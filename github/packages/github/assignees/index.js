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
 * @return {Promise<SlackBodyType>} Response body
 */
async function command(params, commandText, secrets = {}, token = null) {
  let {
    action,
    repository,
    issue_number = '',
    assignees = '',
    per_page = 10,
    page = 1,
    host
  } = params;
  let method = 'GET'
  let assignee = ''
  let data = {}

  repository = GetRepository(secrets.github_repos, repository)
  if (!repository) return Fail('*please specify repository*')

  switch (action) {
    case 'a':
    case 'add':
      action = 'add'
      method = 'POST'
      if (assignees.length === 0) return Fail('*please specify assignee*')
      if (!issue_number) return Fail('*please specify an issue number*')

      data = {
        assignees: assignees.split(',').map(a => a.trim())
      }
      break;
    case 'r':
    case 'remove':
      action = 'remove'
      method = 'DELETE'
      if (assignees.length === 0) return Fail('*please specify assignee*')
      if (!issue_number) return Fail('*please specify an issue number*')
      data = {
        assignees: assignees.split(',').map(a => a.trim())
      }
      break;
    case 'c':
    case 'check':
      action = 'check'
      if (assignees.length === 0) return Fail('*please specify assignee*')
      assignee = assignees.split(',').map(a => a.trim())[0]
      break;
    case 'l':
    case 'ls':
    case 'list':
      action = 'list'
      break;
    default:
      return Fail(`*Invalid Action. Expected options:  'add', 'remove', 'check', 'list' *`)
  }

  const url = `${GetBaseUrl(host, secrets.github_host)}/repos/${repository}${issue_number ? `/issues/${issue_number}` : ''}/assignees${assignee ? `/${assignee}` : ''}`
  const res = await Request(url, action, method, data, token)
  const { header, currReading } = GetHeader(res, token)
  if (currReading === 0) {
    return Fail(header);
  }
  return success(action, header, res.data, secrets);
}

const _assignee = (item, response) => {
  const block = {
    type: 'section',
    fields: [
      Text(`<${item.html_url}|${item.login}>`)
    ],
    accessory: Image(item.avatar_url, item.login)
  }
  response.blocks.push(block)
  if (item.body) response.blocks.push(Section(`${item.body.length > 500 ? item.body.substr(0, 500) + '...' : item.body}`.replace(/#(\d+)/g, `<${item.html_url.split('/').splice(0, 5).join('/')}/issues/$1|#$1>`)));
};

const _assignees = (items, response) => (items).forEach((item) => {
  _assignee(item, response)
});

const _get = (item, response) => {
  const block = {
    type: 'section',
    fields: [
      Text(`<${item.html_url}|${item.number}> \n ${item.title} ${item.milestone ? `\n ${item.milestone.title}` : ''}
      ${item.assignees.length > 0 ? `\n ${item.assignees.map(a => `<${a.html_url}|${a.login}>`).join()}` : ''} 
      ${item.labels.length > 0 ? `\n ${item.labels.map(l => l.name).join()}` : ''} 
      `),
      Text(`*State:* ${item.state.charAt(0).toUpperCase() + item.state.substr(1)} \n*Created:* ${GetPrettyDate(item.created_at)}\n*Updated:* ${GetPrettyDate(item.updated_at)} ${item.closed_at ? `\n*Closed:* ${GetPrettyDate(item.closed_at)}` : ''}`),
    ],
  }
  if (item.assignee) block.accessory = Image(item.assignee.avatar_url, item.assignee.login)
  response.blocks.push(block)
  if (item.body) response.blocks.push(Section(`${item.body.length > 500 ? item.body.substr(0, 500) + '...' : item.body}`.replace(/#(\d+)/g, `<${item.html_url.split('/').splice(0, 5).join('/')}/issues/$1|#$1>`)));
};


const success = async (action, header, data) => {
  const response = {
    response_type: 'in_channel',
    blocks: [Section(header)],
  };
  if (action === 'list')
    _assignees(data || [], response)
  else if (action === 'add')
    _get(data, response)
  else if (action === 'remove')
    _get(data || [], response)
  else if (action === 'check')
    response.blocks.push(Section(`Can be assigned`))
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
