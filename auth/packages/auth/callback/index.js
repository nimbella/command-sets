
const wsk = require('openwhisk')()
const nimbella = require('@nimbella/sdk')
const kv = nimbella.redis()
const https = require('https')
const { URL } = require('url')

async function exchangeCodeForToken(code, params) {
    const api = new URL(params.access_token_url)
    api.searchParams.set('client_id', params.client_id)
    api.searchParams.set('client_secret', params.client_secret)
    api.searchParams.set('code', code)

    return asyncHttpsPostRequest(api)
}

async function asyncHttpsPostRequest(url) {
    return new Promise(function (resolve, reject) {
        https.request({
            method: 'POST',
            host: url.host,
            path: url.pathname + url.search,
            headers: {
                'Accept': 'application/json'
            }
        }, (resp) => {
            let data = ''
            resp.on('data', (chunk) => {
                data += chunk
            })
            resp.on('end', () => {
                try {
                    let parsed = JSON.parse(data)
                    resolve(parsed)
                } catch (e) {
                    reject(data)
                }
            })
        }).on('error', reject)
            .end()
    })
}

function generateErrorObject(message, statusCode) {
    return {
        statusCode: 400 || statusCode,
        body: {
            error: message
        }
    }
}


exports.main = async (event) => {
    if (!event.code) {
        return generateErrorObject('You did not authenticate')
    }
    let response, state
    try {
        const auth = await kv.getAsync(event.state)
        if (auth) {
            state = JSON.parse(auth)
            if (!state.client_id || !state.client_secret || !state.access_token_url) {
                return generateErrorObject('API is not properly configured')
            }
            response = await exchangeCodeForToken(event.code, state)
        }
        else {
            return generateErrorObject('Couldn\'t authenticate')
        }
    } catch (e) {
        console.log(e)
        return generateErrorObject('Failed to exchange code for access_token')
    }

    if (!response || !response.access_token) {
        return generateErrorObject('Missing access_token')
    }
    try {
        if (state && state.callback) {
            return wsk.actions
                .invoke({
                    actionName: state.callback,
                    params: {
                        access_token: response.access_token,
                        state: event.state,
                    },
                    blocking: false
                })
                .then(activation => {
                    console.log('forked', activation)
                    return {
                        body: 'You are authorized to perform the requested operation. Check Slack for progress. You may close this browser tab.'
                    }
                })
                .catch(error => {
                    console.error(error)
                    return generateErrorObject('Your session expired')
                })
        } else {
            return generateErrorObject('Your session expired')
        }
    }
    catch (e) {
        console.log(e)
        return generateErrorObject('API encountered an unexpected error')
    }
}
