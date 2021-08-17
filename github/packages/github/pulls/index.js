// jshint esversion: 9

import {
    GetHeader,
    GetFooter,
    GetRepository,
    GetBaseUrl,
    GetPrettyDate,
    Fail,
    Request,
    Image,
    Text,
    Section
} from './common'

/**
 * @description 
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @param {?string} token oauth token
 * @return {Promise<SlackBodyType>} Response body
 */
async function command(params, commandText, secrets = {}, token = null) {
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
    repository = GetRepository(secrets.github_repos, repository)
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
    const url = `${GetBaseUrl(host, secrets.github_host)}/${listing ? list_path : `repos/${repository}`}/pulls${pr_number ? `/${pr_number}` : ''}${merge ? `/merge` : ''}`
    console.log(url);
    const res = await Request(url, action, method, data, token)

    const { header, currReading } = GetHeader(res, token)
    if (currReading === 0) {
        return Fail(header);
    }
    return success(action, header, res.data, secrets);
}

const _get = (item, response) => {
    const block = {
        type: 'section',
        fields: [
            Text(`<${item.html_url}|${item.number}> \n ${item.title} ${item.milestone ? `\n ${item.milestone.title}` : ''}
      ${item.assignees.length > 0 ? `\n ${item.assignees.map(a => `<${a.html_url}|${a.login}>`).join()}` : ''} 
      ${item.labels.length > 0 ? `\n ${item.labels.map(l => l.name).join()}` : ''} 
      `),
            Text(`*State:* ${item.state.charAt(0).toUpperCase() + item.state.substr(1)}
      \n*Created:* ${GetPrettyDate(item.created_at)}
      \n*Updated:* ${GetPrettyDate(item.updated_at)}
      ${item.closed_at ? `\n*Closed:* ${GetPrettyDate(item.closed_at)}` : ''}`),
        ],
    }
    if (item.assignee) block.accessory = Image(item.assignee.avatar_url, item.assignee.login)
    response.blocks.push(block)
    if (item.body) response.blocks.push(Section(`${item.body.length > 500 ? item.body.substr(0, 500) + '...' : item.body}`.replace(/#(\d+)/g, `<${item.html_url.split('/').splice(0, 5).join('/')}/pulls/$1|#$1>`)));
};

const _list = (items, response) => (items).forEach((item) => {
    _get(item, response)
});


const success = async (action, header, data, secrets) => {
    const response = {
        response_type: 'in_channel',
        blocks: [Section(header)],
    };
    if (action === 'list')
        _list(data || [], response)
    else
        _get(data, response)

    response.blocks.push(GetFooter());
    return response
};

const main = async (args) => ({
    body: await command(args.params, args.commandText, args.__secrets || {}, args.token || null).catch((error) => ({
        response_type: 'ephemeral',
        text: `Error: ${error.message}`,
    })),
});

module.exports = main;
