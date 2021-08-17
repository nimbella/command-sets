// jshint esversion: 9

import {
  GetHeader,
  GetFooter,
  GetRepository,
  GetPrettyDate,
  GetBaseUrl,
  Fail,
  Request,
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
    title,
    due_on,
    state,
    description,
    milestone_number,
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
    case 'create':
    case 'add':
      action = 'create'
      method = 'POST'
      if (!title) return Fail('*please enter name*')
      data = {
        title,
        state: 'open',
        description
      }
      if (due_on) data.due_on = due_on
      break;
    case 'u':
    case 'up':
    case 'update':
      action = 'update'
      method = 'PATCH'
      if (!milestone_number) return Fail('*please enter milestone_number*')
      data = {
        title,
        state,
        description
      }
      if (due_on) data.due_on = due_on
      break;
    case 'g':
    case 'get':
      action = 'get';
      if (!milestone_number) return Fail('*please enter milestone_number*')
      break;
    case 'l':
    case 'ls':
    case 'list':
      action = 'list'
      if (milestone_number) return Fail('*milestone_number can\'t be specified while fetching list*')
      break;
    case 'd':
    case 'delete':
      action = 'delete'
      method = 'DELETE'
      if (!milestone_number) return Fail('*please enter milestone_number*')
      break;
    default:
      return Fail(`*Invalid Action. Expected options: 'create', 'update', 'delete', 'get', 'list' *`)
  }

  const url = `${GetBaseUrl(host, secrets.github_host)}/repos/${repository}/milestones${milestone_number ? `/${milestone_number}` : ''}${state ? `?state=${state}` : ''}`
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
      Text(`<${item.html_url}|${item.number}> \n ${item.title}\nOpen: ${item.open_issues} \nClosed: ${item.closed_issues}`),
      Text(`*State:* ${item.state.charAt(0).toUpperCase() + item.state.substr(1)} 
      \n*Created:* ${GetPrettyDate(item.created_at)}
      \n*Updated:* ${GetPrettyDate(item.updated_at)}
      \n*Due:* ${item.due_on ? `${GetPrettyDate(item.due_on)}` : '-'}
      ${item.closed_at ? `\n*Closed:* ${GetPrettyDate(item.closed_at)}` : ''}`),
      Text(`Creator: <${item.creator.avatar_url}|${item.creator.login}>`)
    ],
  }
  response.blocks.push(block)
  if (item.description) response.blocks.push(Section(`${item.description.length > 500 ? item.description.substr(0, 500) + '...' : item.description}`));
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
  else if (action === 'delete')
    response.blocks.push(Section(`Milestone Deleted.`))
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
