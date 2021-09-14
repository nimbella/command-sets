// jshint esversion: 9

const axios = require('axios');

const requestThreshold = 3
const headers = {
    'Content-Type': 'application/json',
};


async function Request(url, action, method, data, token) {
    // get, list for public repos do not need access token 
    if (!token && !['list', 'get', 'check'].includes(action)) {
        return fail('*please add github_token secret*')
    }
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
        action,
        repository,
        pr_number = '',
        issue = '',
        title = '',
        head = '',
        base = '',
        body = '',
        draft: d,
        maintainer_can_modify = false,
        assignees = '',
        milestone = '',
        labels = '',
        state = '',
        list_option,
        org = '',
        since = '',
        per_page = 50,
        page = 1,
        host
    } = params;
    list_option = list_option || 'pulls'
    let method = 'GET'
    let data = {}
    let merge = false
    let listing = false
    let list_path = ''
    const {
        github_repos,
        github_host
    } = secrets;
    const default_repos = repository ? repository : github_repos;
    if (default_repos) {
        repository = default_repos.split(',').map(repo => repo.trim())[0];
    }
    switch (action) {
        case 'c':
        case 'cr':
        case 'add':
        case 'create':
            action = 'create'
            method = 'POST'
            if (!repository) return fail('*please specify repository*')
            if (!head) return fail('*please enter head branch*')
            if (!base) return fail('*please enter base branch*')
            data = {
                title,
                head,
                base,
                body,
                draft: d,
                issue,
                maintainer_can_modify
            }
            break;
        case 'u':
        case 'up':
        case 'update':
            action = 'update'
            method = 'PATCH'
            if (!repository) return fail('*please specify repository*')
            if (!pr_number) return fail('*please specify pr number*')
            data = {
                title,
                body,
                assignees: assignees ? assignees.split(',').map(a => a.trim()) : [],
                milestone: milestone ? milestone : null,
                labels: labels ? labels.split(',').map(l => l.trim()) : [],
                state
            }
            break;
        case 'g':
        case 'get':
            action = 'get';
            if (!repository) return fail('*please specify repository*')
            if (!pr_number) return fail('*please specify pr number*')
            break;
        case 'l':
        case 'ls':
        case 'list':
            action = 'list'
            listing = true
            if (!['commits', 'files', 'reviews', 'comments', 'pulls'].includes(list_option))
                return fail(`*expected list_option to be one of 'commits', 'files', 'reviews', 'comments','pulls'*`)
            if (list_option === 'pulls')
                listing = false
            else
                list_path = `/${list_option}`
            break;
        case 'ch':
        case 'check':
            action = 'check'
            if (!repository) return fail('*please specify repository*')
            if (!pr_number) return fail('*please specify pr number*')
            break;
        case 'm':
        case 'merge':
            action = 'merge'
            method = 'PUT'
            merge = true
            if (!repository) return fail('*please specify repository*')
            if (!pr_number) return fail('*please specify a pr number*')
            break;
        default:
            return fail(`*Invalid Action. Expected options: 'add', 'update', 'get', 'list', 'check', 'merge' *`)
    }
    baseURL = host || github_host || baseURL
    baseURL = updateURL(baseURL)
    const url = `${baseURL}/${listing ? list_path : `repos/${repository}`}/pulls${pr_number ? `/${pr_number}` : ''}${merge ? `/merge` : ''}`
    console.log(url);
    const res = await Request(url, action, method, data, token)

    if (res) {
        const tokenMessage = token ? '' : '*For greater limits you can add <https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line | secrets> using*\n `/nc secret_create`';
        const currReading = parseInt(res.headers['x-ratelimit-remaining']);
        let header = `\nPull *${action.charAt(0).toUpperCase() + action.substr(1)}* Request Result:`;
        if (currReading < requestThreshold) {
            header = `:warning: *You are about to reach the api rate limit.* ${tokenMessage}`;
        }
        if (currReading === 0) {
            header = `:warning: *The api rate limit has been exhausted.* ${tokenMessage}`;
            return fail(header);
        }
        return success(action, header, res.data, secrets);
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

const _get = (item, response) => {
    const block = {
        type: 'section',
        fields: [
            mdText(`<${item.html_url}|${item.number}> \n ${item.title} ${item.milestone ? `\n ${item.milestone.title}` : ''}
      ${item.assignees.length > 0 ? `\n ${item.assignees.map(a => `<${a.html_url}|${a.login}>`).join()}` : ''} 
      ${item.labels.length > 0 ? `\n ${item.labels.map(l => l.name).join()}` : ''} 
      `),
            mdText(`*State:* ${item.state.charAt(0).toUpperCase() + item.state.substr(1)}
      \n*Created:* <!date^${Math.floor(new Date(item.created_at).getTime() / 1000)}^{date_pretty} at {time}|${item.created_at}>
      \n*Updated:* <!date^${Math.floor(new Date(item.updated_at).getTime() / 1000)}^{date_pretty} at {time}|${item.updated_at}>
      ${item.closed_at ? `\n*Closed:* <!date^${Math.floor(new Date(item.closed_at).getTime() / 1000)}^{date_pretty} at {time}|${item.closed_at}>` : ''}`),
        ],
    }
    if (item.assignee) block.accessory = image(item.assignee.avatar_url, item.assignee.login)
    response.blocks.push(block)
    if (item.body) response.blocks.push(section(`${item.body.length > 500 ? item.body.substr(0, 500) + '...' : item.body}`.replace(/#(\d+)/g, `<${item.html_url.split('/').splice(0, 5).join('/')}/pulls/$1|#$1>`)));
};

const _list = (items, response) => (items).forEach((item) => {
    _get(item, response)
});


const success = async (action, header, data, secrets) => {
    const response = {
        response_type: 'in_channel',
        blocks: [section(header)],
    };
    if (action === 'list')
        _list(data || [], response)
    else
        _get(data, response)

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
    body: await command(args.params, args.commandText, args.__secrets || {}, args._token || null).catch((error) => ({
        response_type: 'ephemeral',
        text: `Error: ${error.message}`,
    })),
});

module.exports = main;