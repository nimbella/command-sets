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
    action,
    repository,
    issue_number = '',
    title = '',
    body = '',
    assignees = '',
    milestone = '',
    labels = '',
    state = '',
    reason = '',
    list_option,
    org = '',
    since = '',
    per_page = 50,
    page = 1,
    host
  } = params;
  list_option = list_option || 'repository'
  let method = 'GET'
  let data = {}
  let lock = false
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
      if (!repository) return Fail('*please specify repository*')
      if (!title) return Fail('*please enter issue title*')
      data = {
        title,
        body,
        assignees: assignees ? assignees.split(',').map(a => a.trim()) : [],
        milestone: milestone ? milestone : null,
        labels: labels ? labels.split(',').map(l => l.trim()) : []
      }
      break;
    case 'u':
    case 'up':
    case 'update':
      action = 'update'
      method = 'PATCH'
      if (!repository) return Fail('*please specify repository*')
      if (!issue_number) return Fail('*please specify an issue number*')
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
      if (!repository) return Fail('*please specify repository*')
      if (!issue_number) return Fail('*please specify an issue number*')
      break;
    case 'l':
    case 'ls':
    case 'list':
      action = 'list'
      listing = true
      if (!['repository', 'org', 'user', 'all'].includes(list_option))
        return Fail(`*expected list_option to be one of 'repository', 'org', 'user', 'all'*`)
      if (list_option === 'org') {
        if (!org)
          return Fail('*please specify org name*')
        list_path = `/orgs/${org}`
      }
      if (list_option === 'user')
        list_path = `/user`
      if (list_option === 'repository')
        listing = false
      break;
    case 'lc':
    case 'lock':
      action = 'lock'
      method = 'PUT'
      lock = true
      if (!repository) return Fail('*please specify repository*')
      if (!issue_number) return Fail('*please specify an issue number*')
      if (!['', undefined, 'off-topic', 'too heated', 'resolved', 'spam'].includes(reason))
        return Fail(`*expected reason to be one of  'off-topic','too heated', 'resolved', 'spam'*`)
      data = {
        locked: true,
        active_lock_reason: reason || 'resolved'
      }
      break;
    case 'ul':
    case 'unlock':
      action = 'unlock'
      method = 'DELETE'
      lock = true
      if (!repository) return Fail('*please specify repository*')
      if (!issue_number) return Fail('*please specify an issue number*')
      break;
    default:
      return Fail(`*Invalid Action. Expected options: 'add', 'update', 'get', 'list', 'lock', 'unlock' *`)
  }
  const url = `${GetBaseUrl(host, secrets.github_host || '')}/${listing ? list_path : `repos/${repository}`}/issues${issue_number ? `/${issue_number}` : ''}${lock ? `/lock` : ''}`
  console.log(url);
  const res = await Request(url, action, method, data, token)

  const { header, currReading } = GetHeader(res, token, 'issues', action)
  if (currReading === 0) {
    return Fail(header);
  }
  return success(action, header, res.data, secrets);
}

const _get = (item, response) => {
  console.log(item)
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
  if (item.body) response.blocks.push(Section(`${item.body.length > 500 ? item.body.substr(0, 500) + '...' : item.body}`.replace(/#(\d+)/g, `<${item.html_url.split('/').splice(0, 5).join('/')}/issues/$1|#$1>`)));
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
    response.blocks.push(Section(`Issue Locked.`))
  else if (action === 'unlock')
    response.blocks.push(Section(`Issue Unlocked.`))
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

module.exports.main = main;
