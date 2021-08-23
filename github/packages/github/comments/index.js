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
    comment_id = '',
    body,
    since,
    sort = 'created',
    direction = 'desc',
    per_page = 100,
    page = 1,
    host
  } = params;
  let method = 'GET'
  let data = {}

  repository = GetRepository(secrets.github_repos, repository)
  if (!repository) return Fail('*please specify repository*')
  switch (action) {
    case 'c':
    case 'cr':
    case 'add':
    case 'create':
      action = 'create'
      method = 'POST'
      if (!body) return Fail('*please enter comment*')
      if (!issue_number) return Fail('*please specify an issue number*')
      data = {
        body
      }
      break;
    case 'u':
    case 'up':
    case 'update':
      action = 'update'
      method = 'PATCH'
      if (!comment_id) return Fail('*please specify comment id*')
      data = {
        body
      }
      break;
    case 'g':
    case 'get':
      action = 'get';
      if (!comment_id) return Fail('*please specify comment id*')
      break;
    case 'l':
    case 'ls':
    case 'list':
      action = 'list'
      break;
    case 'd':
    case 'delete':
      action = 'delete'
      method = 'DELETE'
      if (!comment_id) return Fail('*please specify comment id*')
      break;
    default:
      return Fail(`*Invalid Action. Expected options: 'add', 'update', 'delete', 'get', 'list' *`)
  }

  const url = `${GetBaseUrl(host, secrets.github_host)}/repos/${repository}/issues${issue_number ? `/${issue_number}` : ''}/comments${comment_id ? `/${comment_id}` : ''}`
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
      Text(item.id ? `<${item.html_url}|${item.id}>` : ''),
      Text(`*Created:* ${item.created_at ? `${GetPrettyDate(item.created_at)}` : '-'}
      \n*Updated:* ${item.updated_at ? `${GetPrettyDate(item.updated_at)}` : '-'} `),
    ],
  }
  if (item.user) block.accessory = Image(item.user.avatar_url, item.user.login)
  response.blocks.push(block)
  if (item.body) response.blocks.push(Section(`${item.body.length > 500 ? item.body.substr(0, 500) + '...' : item.body}`.replace(/#(\d+)/g, `<${item.html_url.split('/').splice(0, 5).join('/')}/issues/$1|#$1>`)));
};

const _list = (items, response) => (items).forEach((item) => {
  _get(item, response)
});


const success = async (action, header, data) => {
  const response = {
    response_type: 'in_channel',
    blocks: [Section(header)],
  };
  if (action === 'list')
    _list(data || [], response)
  else if (action === 'unlock')
    response.blocks.push(Section(`Comment Deleted.`))
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
