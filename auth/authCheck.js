const nimbella = require('@nimbella/sdk')
const kv = nimbella.redis()
const baseUrl = 'https://github.com'
const authorizePath = '/login/oauth/authorize'
const scope = 'user:email,read:org'
const allowSignup = 'false'
// const authorizationUrl = `${baseUrl}${authorizePath}?client_id=${process.env.OAUTH_CLIENT_ID}&scope=${scope}&allow_signup=${allowSignup}`
const sessionExpiration = 1 * 60 // ttl in seconds
const https = require('https')
const { URL } = require('url')


// Generates error response. This is not intended for slack and usually indicates
// an invalid request.
function generateErrorObject(message, statusCode) {
  return {
    statusCode: 400 || statusCode,
    body: {
      error: message
    }
  }
}

// When the request contains an access token, it is the result of an asynchronous
// call back. This will indicate that the handler should rehydrate the state then
// call the command handler. When the handler completes, we must post the result
// back using the saved webhook.
//
// This function will attempt to save the access token for a predetermined amount
// of time so that it may be reused without forcing the same user to re-authenticate.
async function rehydrate(access_token, state) {
  return kv
    .getAsync(state)
    .then(JSON.parse)
    .then(async state => {
      if (state && state.savedArgs) {
        try {
          // remember the access token for a some duration
          const userid = state.savedArgs.params.__client.user_id
          await kv.setexAsync(userid, sessionExpiration, JSON.stringify({ access_token }))
        } catch (e) {
          console.error('could not save access token', e)
        }

        return state.savedArgs
      } else {
        return Promise.reject('Your session has expired')
      }
    })
}

// For the user identified in the request, check if there is a previously saved
// access token. If so, return it. Otherwise return undefined and allow handler
// to initiate a new oauth flow.
async function previouslyAuthorized(event) {
  try {
    const userid = event.params.__client.user_id
    return kv
      .getAsync(userid)
      .then(JSON.parse)
      .then(_ => {
        if (_ && _.access_token) {
          return _.access_token
        } else return undefined
      })
  } catch (e) {
    console.error('Invalid request (missing expected properties)')
    return undefined
  }
}

async function postResult(webhook, result) {
  const url = new URL(webhook)
  return new Promise(function (resolve, reject) {
    const data = JSON.stringify(result)    
    https.request({
      method: 'POST',
      host: url.host,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (resp) => {
      let buffer = ''

      resp.on('data', (chunk) => {
        buffer += chunk
      })

      resp.on('end', () => {
        try {
          resolve({ body: buffer })
        } catch (e) {
          console.error(e, buffer)
          reject(generateErrorObject('Unexpected response'))
        }
      })
    }).on('error', reject)
      .write(data)
      .end()
  })
}

function validEvent(event) {
  return event.params
      && event.params.__client
      && event.params.__client.user_id
      && event.params.__client.response_url
      && event.params.__client.name === 'slack'
}

const authCheck = async (event, _command) => {
  try {
    // check if this is an asynchronous call back from an oauth flow
    // in which case the state and access_tokens are available in the event
    if (event.state && event.access_token) {
      // rehydrate, then execute the command with the access token
      const savedArgs = await rehydrate(event.access_token, event.state)
      const result = await _command(event.access_token, savedArgs.params, savedArgs.commandText, savedArgs.__secrets || {})
      const webhook = savedArgs.params.__client.response_url
      return postResult(webhook, result)
    } else if (validEvent(event)) {
      // this is a synchronous inbound event from slack, check if there is an
      // access token available for the slack user who initiated this request
      const access_token  = await previouslyAuthorized(event)
      if (access_token) {
        // previously authorized, execute the command and return the result
        return _command(access_token, event.params, event.commandText, event.__secrets || {})
      } else {
        // kick off authorization flow
        const state = process.env.__OW_ACTIVATION_ID
        return kv
          .setexAsync(state, sessionExpiration, JSON.stringify({savedArgs: event, callback: `${process.env.__OW_ACTION_NAME}`}))
          .then(result => {
            if (result === 'OK') {
              return {
                response_type: 'ephemeral',
                text: `You need to authenticate to perform this operation. Please click this <${authorizationUrl}&state=${state}|link> to continue.`
              }
            } else {
              console.log('kv set failed with result:', result)
              return {
                response_type: 'ephemeral',
                text: `This operation requires you to authenticate but could not create a session for you.\n` +
                      `If you are authorized to inspect the activation logs, check them for details or contact your Commander admin.`
              }
            }
          })
      }
    } else {
      console.error('Invalid request', event)
      return generateErrorObject('Invalid request')
    }
  } catch (error) {
    console.error(error)
    return generateErrorObject('Unexpected error')
  }
}

module.exports = authCheck
