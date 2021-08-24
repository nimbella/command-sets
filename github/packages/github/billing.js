// jshint esversion: 9

const axios = require('axios');

const requestThreshold = 3
const headers = {
    'Content-Type': 'application/json',
};


async function Request(url, action, method, data, token) {
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return axios({
        method: method,
        url,
        headers,
        data
    })
}

/**
 * @description 
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function command(params, commandText, secrets = {}, token = null) {
    let baseURL = 'https://api.github.com'
    let {
        entity = 'package',
            type,
            org,
            user,
            host
    } = params;

    let method = 'GET'
    let data = {}
    let list_path = ''
    const {
        github_host
    } = secrets;
    type = type || 'user'

    if (type === 'org' && !org) return fail('*please specify organization*')
    if (type === 'user' && !user) return fail('*please specify user*')

    if (!['org', 'user'].includes(type))
        return fail(`*expected type to be one of 'org', 'user'*`)

    switch (entity) {
        case 'a':
        case 'action':
            entity = 'action';
            list_path = 'actions'
            break;
        case 'p':
        case 'package':
            entity = 'package'
            list_path = 'packages'
            break;
        case 's':
        case 'storage':
            entity = 'storage'
            list_path = 'shared-storage'
            break;
        default:
            return fail(`*Invalid Entity. Expected options: 'action', 'package', 'storage' *`)
    }
    baseURL = host || github_host || baseURL
    baseURL = updateURL(baseURL)
    const url = `${baseURL}/${type}s/${type === 'org' ? org : user}/settings/billing/${list_path}`
    console.log(url);
    const res = await Request(url, entity, method, data, token)

    if (res) {
        const tokenMessage = token ? '' : '*For greater limits please run /nc oauth_create github. See add <https://nimbella.com/docs/commander/slack/oauth#adding-github-as-an-oauth-provider | github as oauth provider>';
        if (res.headers) {
            const currReading = parseInt(res.headers['x-ratelimit-remaining']);
            let header = `\nBilling *${entity.charAt(0).toUpperCase() + entity.substr(1)}* Request Result:`;
            if (currReading < requestThreshold) {
                header = `:warning: *You are about to reach the api rate limit.* ${tokenMessage}`;
            }
            if (currReading === 0) {
                header = `:warning: *The api rate limit has been exhausted.* ${tokenMessage}`;
                return fail(header);
            }
        }

        return success(entity, header, res.data, secrets);
    }
    return fail(undefined, res);
}

const image = (source, alt) => ({
    type: 'image',
    image_url: source,
    alt_text: alt,
});

const mdText = (text) => ({
    type: 'mrkdwn',
    text: text
        // Convert markdown links to slack format.
        .replace(/!*\[(.*)\]\((.*)\)/g, '<$2|$1>')
        // Replace markdown headings with slack bold
        .replace(/#+\s(.+)(?:R(?!#(?!#)).*)*/g, '*$1*'),
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
        blocks: [section(`${msg || errMsg || '*couldn\'t get action results*'}`)],
    };
    return response
};

const getErrorMessage = (error) => {
    console.error(error)
    if (error.response && error.response.status === 403) {
        return `:warning: *The api rate limit has been exhausted.*`
    } else if (error.response && error.response.status && error.response.data) {
        return `Error: ${error.response.status} ${error.response.data.message}`
    } else {
        return error.message
    }
};

const _actions = (item, response) => {
    const block = {
        type: 'section',
        fields: [
            mdText(`*Total Minutes Used:* ${item.total_minutes_used}
      \n*Total Paid Minutes Used:* ${item.total_paid_minutes_used}
      \n*Included Minutes:* ${item.included_minutes}
      \n*Minutes Used Breakdown:* _Ubuntu_ ${item.minutes_used_breakdown.UBUNTU}, _Mac_ ${item.minutes_used_breakdown.MACOS}, 
      _Windows_ ${item.minutes_used_breakdown.WINDOWS}`),
        ],
    }
    response.blocks.push(block)
};

const _packages = (item, response) => {
    const block = {
        type: 'section',
        fields: [
            mdText(`*Total Gigabytes Bandwidth Used:* ${item.total_gigabytes_bandwidth_used}
      \n*Total Paid Gigabytes Bandwidth Used:* ${item.total_paid_gigabytes_bandwidth_used}
      \n*Included Gigabytes Bandwidth:* ${item.included_gigabytes_bandwidth}`),
        ],
    }
    response.blocks.push(block)
};

const _storage = (item, response) => {
    const block = {
        type: 'section',
        fields: [
            mdText(`*Days Left In Billing Cycle:* ${item.days_left_in_billing_cycle}
      \n*Estimated Paid Storage For Month:* ${item.estimated_paid_storage_for_month}
      \n*Estimated Storage For Month:* ${item.estimated_storage_for_month}`),
        ],
    }
    response.blocks.push(block)
};

const success = async (entity, header, data, secrets) => {
    const response = {
        response_type: 'in_channel',
        blocks: [section(header)],
    };
    if (entity === 'package')
        _packages(data || [], response)
    else if (entity === 'storage')
        _storage(data || [], response)
    else
        _actions(data, response)

    response.blocks.push({
        type: 'context',
        elements: [
            mdText('add _github command-set_ to your Slack with <https://nimbella.com/product/commander/ | Commander>'),
        ],
    });
    return response
};

const updateURL = (url) => {
    if (url.includes('|')) {
        url = (url.split('|')[1] || '').replace('>', '')
    } else {
        url = url.replace('<', '').replace('>', '')
    }
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }
    if (!url.includes('api')) {
        url += '/api/v3';
    }
    return url
}

const main = async (args) => ({
    body: await command(args.params, args.commandText, args.__secrets || {}, args.token || null).catch((error) => ({
        response_type: 'ephemeral',
        text: `Error: ${error.message}`,
    })),
});

module.exports = main;