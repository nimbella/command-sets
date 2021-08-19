const {
  GetHeader,
  GetFooter,
  GetRepository,
  GetPrettyDate,
  GetBaseUrl,
  Fail,
  Request,
  Image,
  Text,
  Section
} = require('./common')

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
    type = "repos",
    id,
    name = 'web',
    repository,
    config = {
      "content_type": "json",
      "insecure_ssl": "0",
      "secret": "",
      "url": "https://example.com/webhook"
    },
    events,
    add_events = [],
    remove_events = [],
    active = true,
  } = params;
  let method = 'GET'
  let data = {}
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
      if (!name) return fail('*please specify a name*')
      data = {
        name,
        config,
        events: events ? events.split(',').map(a => a.trim()) : ['push'],
        active,
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
      if (list_option === 'org') {
        if (!org)
          return fail('*please specify org name*')
        list_path = `/orgs/${org}`
      }
      if (list_option === 'user')
        list_path = `/user`
      if (list_option === 'repository')
        listing = false
      break;
    case 'ch':
    case 'check':
      action = 'check'
      lock = true
      if (!repository) return fail('*please specify repository*')
      if (!pr_number) return fail('*please specify pr number*')
      data = {
        locked: true,
      }
      break;
    case 'm':
    case 'merge':
      action = 'merge'
      method = 'PUT'
      lock = true
      if (!repository) return fail('*please specify repository*')
      if (!pr_number) return fail('*please specify a pr number*')
      break;
    default:
      return fail(`*Invalid Action. Expected options: 'add', 'update', 'get', 'list', 'lock', 'unlock' *`)
  }

  const url = `${GetBaseUrl(host, secrets.github_host)}/${type === 'repos' ? `repos/${repository}` : `orgs/${org}`}/hooks${id ? `/${id}` : ''}${ping ? `/ping` : ''}`
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
  else if (action === 'lock')
    response.blocks.push(Section(`Pull Locked.`))
  else if (action === 'unlock')
    response.blocks.push(Section(`Pull Unlocked.`))
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
