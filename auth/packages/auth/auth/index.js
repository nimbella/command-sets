/* eslint-disable camelcase */
// jshint esversion: 9

/*
/nc command_create auth <action> [<entity>] [-n <provider_name>] [-b <base_url>] [-i <client_id>] [-s <client_secret>] [-p <scope>] [-d <duration>]
*/

const nimbella = require('@nimbella/sdk')
const kv = nimbella.redis()
const { encrypt, decrypt } = require('./encrypt')
const https = require('https')
const { URL } = require('url')
const entities = ['provider']
const actions = ['list', 'add', 'get', 'remove', 'use']
const grants = ['Authorization Code', 'Client Credentials', 'Password Credentials', 'Implicit']
const authLinkValidity = 30 // in seconds
async function executer(action, data) {
  if (action === 'list') {
    const keys = await kv.keysAsync(`auth.${data.user_id}*`)
    const requests = []
    for (const key of keys) {
      requests.push(
        JSON.parse(await kv.getAsync(key))
      )
    }
    const providers = await Promise.all(requests)
    return providers
  }
  if (action === 'add') {
    await kv
      .setAsync(`auth.${data.user_id}.${data.provider_name}`, JSON.stringify(data))
    return data
  }
  if (action === 'get') {
    const toGet = await kv
      .getAsync(`auth.${data.user_id}.${data.provider_name}`)
    return JSON.parse(toGet)
  }
  if (action === 'remove') {
    const toDelete = await kv
      .get(`auth.${data.user_id}.${data.provider_name}`)
    await kv
      .delAsync(`auth.${data.user_id}.${data.provider_name}`)
    return toDelete
  }
  if (action === 'use') {
    const authData = await kv.getAsync(`auth.${data.user_id}.${data.provider_name}`)
    if (authData) {
      const toUse = JSON.parse(authData)
      const state = process.env.__OW_ACTIVATION_ID || ''
      const authUrl = `${toUse.auth_url}?client_id=${toUse.client_id}&scope=${toUse.scope}&allow_signup=false`
      toUse.callback = process.env.__OW_ACTION_NAME
      toUse.duration = data.duration
      toUse.webhook = data.webhook
      const result = await kv
        .setexAsync(state, authLinkValidity * 60, JSON.stringify(toUse))
      if (result === 'OK') {
        return `For authentication, you have opted to use *${data.provider_name}* for *${Number(data.duration)}* Seconds. Please click this <${authUrl}&state=${state}|link> to continue.`
      }
      else {
        console.log('kv set failed with result:', result)
        return `This operation requires you to authenticate but could not create a session for you.\n
              If you are authorized to inspect the activation logs, check them for details or contact your Commander admin.`
      }
    }
    else {
      return `Couldn't find provider with name *${data.provider_name}*, please ensure the name is correct or add using _/nc auth add_`
    }
  }
}


/**
 * @description 
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function command(params, commandText, secrets = {}) {
  let {
    entity = 'provider',
    action = 'use',
    provider_name,
    grant_type = 'Authorization Code',
    auth_url,
    access_token_url,
    base_url,
    callback_url = 'https://apigcp.nimbella.io/api/v1/web/pslat20n-memkpwiprzv/auth/callback',
    client_id,
    client_secret,
    scope = 'user:email,read:org',
    duration = 1 // in seconds
  } = params;

  // const key = 'vOVH6pripNWjRRIqRodrdxchalwHzfr3'
  // const e = encrypt('testEncrypt', key)
  // console.log(decrypt(e, key))

  auth_url = extractURL(auth_url)
  access_token_url = extractURL(access_token_url)
  base_url = extractURL(base_url)
  let data = {}
  if (!entities.includes(entity)) return fail(`*valid entities are: ${entities.join(', ')}*`)
  if (!actions.includes(action)) return fail(`*valid actions are: ${actions.join(', ')}*`)
  if (!grants.includes(grant_type)) return fail(`*valid grant_types are: ${grants.join(', ')}*`)
  switch (action) {
    case 'a':
    case 'add':
      action = 'add'
      if (!provider_name) return fail('*please specify provider name* e.g. -n twitter')
      if (!(auth_url || base_url)) return fail('*please specify auth_url or base_url* e.g. -b github.com')
      if (!(access_token_url || base_url)) return fail('*please specify access_token_url or base_url* e.g. -b github.com')
      if (!callback_url) return fail('*please specify callback_url*')
      if (!client_id) return fail('*please specify client_id* e.g. -i xxxxx261xxxxx016xxxx')
      if (!client_secret) return fail('*please specify client_secret* e.g. -s xxxxx6edfdd975dxxxxx354680xxxxxb3b9xxxxx')
      if (!scope) return fail('*please specify scope*')

      // set default
      auth_url = auth_url || `${base_url}/login/oauth/authorize`
      access_token_url = access_token_url || `${base_url}/login/oauth/access_token`

      data = {
        provider_name,
        grant_type,
        auth_url,
        base_url,
        callback_url,
        access_token_url,
        client_id,
        client_secret,
        scope,
        user_id: params.__client.user_id
      }
      break;
    case 'r':
    case 'remove':
      action = 'remove'
      if (!provider_name) return fail('*please specify provider name* e.g. -n twitter')
      data = {
        provider_name,
        user_id: params.__client.user_id
      }
      break;
    case 'g':
    case 'get':
      action = 'get'
      if (!provider_name) return fail('*please specify provider name* e.g. -n twitter')
      data = {
        provider_name,
        user_id: params.__client.user_id
      }
      break;
    case 'u':
    case 'use':
      action = 'use'
      if (!provider_name) return fail('*please specify provider name* e.g. -n twitter')
      if (!duration) return fail('*please specify duration*')
      data = {
        provider_name,
        user_id: params.__client.user_id,
        webhook: params.__client.response_url,
        duration
      }
      break;
    case 'l':
    case 'ls':
    case 'list':
      action = 'list'
      data = {
        user_id: params.__client.user_id,
      }
      break;
    default:
      return fail(`*Invalid Action. Expected options:  'add', 'remove', 'use', 'list' *`)
  }
  const res = await executer(action, data)
  if (res) {
    let header = `\nAuth *${action.charAt(0).toUpperCase() + action.substr(1)}* Request Result:`;
    return success(action, header, res);
  }
  return fail(undefined, res);
}

const mdText = (text) => ({
  type: 'mrkdwn',
  text: text
});

const section = (text) => ({
  type: 'section',
  text: mdText(text),
});

const fail = (msg, err) => {
  let errMsg
  if (err) errMsg = getErrorMessage(err)
  const response = {
    response_type: 'in_channel',
    blocks: [section(`${msg || errMsg || '*couldn\'t process requested action*'}`)],
  };
  return response
};

const getErrorMessage = (error) => {
  console.error(error)
  return error.message
}

const _provider = (item, response) => {
  const block = {
    type: 'section',
    fields: [
      mdText(`Name: *${item.provider_name}*\n Auth URL: ${item.auth_url}\n Access Token URL: ${item.access_token_url}\n Callback URL: ${item.callback_url}\n Scopes: ${item.scope}\n`)
    ],
  }
  response.blocks.push(block)
};

const _providers = (items, response) => (items).forEach((item) => {
  _provider(item, response)
  response.blocks.push({
    "type": "divider"
  })
});

const success = async (action, header, data) => {
  const response = {
    response_type: 'ephemeral',
    blocks: [section(header)],
  };
  if (action === 'list')
    _providers(data || [], response)
  else if (action === 'add' || action === 'get')
    _provider(data, response)
  else if (action === 'remove')
    _provider(data || [], response)
  else if (action === 'use')
    response.blocks.push(section(data))
  if (action !== 'use')
    response.blocks.push({
      type: 'context',
      elements: [
        mdText('add _auth command-set_ to your Slack with <https://nimbella.com/product/commander/ | Commander>'),
      ],
    });
  return response
};

const extractURL = (url) => {
  if (url) {
    if (url.includes('|')) { url = (url.split('|')[1] || '').replace('>', '') }
    else { url = url.replace('<', '').replace('>', '') }
    if (!url.startsWith('http')) { url = 'https://' + url; }
  }
  return url
}

async function saveToken(access_token, state) {
  let response='', webhook
  const savedState = await kv.getAsync(state)
  console.log(savedState);
  if (savedState) {
    try {
      const parsedState = JSON.parse(savedState)
      // remember the access token for specified duration
      const userid = parsedState.user_id
      const duration = parsedState.duration
      webhook = parsedState.webhook
      await kv.setexAsync(`${userid}.tk`, Number(duration) * 60, JSON.stringify({ access_token }))
      response = await success(undefined, `Authentication Successful!`, undefined)
    } catch (e) {
      console.error('could not save access token', e)
      response = fail('Couldn\'t Authenticate')
    }
  } else {
    response = fail('Couldn\'t Authenticate')
  }
  console.log(response);
  return { webhook, response }
}

function generateErrorObject(message, statusCode) {
  return {
    statusCode: 400 || statusCode,
    body: {
      error: message
    }
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

const main = async (args) => {
  console.log(process.env.__OW_NAMESPACE);
  console.log(process.env.__OW_ACTION_NAME);
  console.log(args);
  if (args.state && args.access_token) {
    const { webhook, response } = await saveToken(args.access_token, args.state)
    console.log('webhook post:' + webhook);
    console.log(response)
    return await postResult(webhook, response)
  }
  else {
    console.log('webhook pre:' + args.params.__client.response_url);
    const _command = command(args.params, args.commandText, args.__secrets || {})
    return {
      body: await _command.catch((error) => ({
        response_type: 'ephemeral',
        text: `Error: ${error.message}`,
      })),
    }
  }
}

exports.main = main;
