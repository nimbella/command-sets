// jshint esversion: 9

import {
  GetHeader,
  GetFooter,
  GetRepository,
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
    issue_number = '',
    name,
    new_name = '',
    color,
    description,
    labels = [],
    list_option,
    milestone_number,
    since,
    sort = 'created',
    direction = 'desc',
    per_page = 100,
    page = 1,
    host
  } = params;
  list_option = list_option || 'repo'
  let method = 'GET'
  let data = {}
  let list_path, listing = false
  repository = GetRepository(secrets.github_repos, repository)
  if (!repository) return fail('*please specify repository*')
  switch (action) {
    case 'c':
    case 'cr':
    case 'create':
      action = 'create'
      method = 'POST'
      if (!name) return fail('*please enter name*')
      if (issue_number) return fail('*can\'t specify issue_number while creating*')
      if (!color) return fail('*please specify a hexadecimal color code for the label, without the leading #*')
      data = {
        name,
        color,
        description
      }
      break;
    case 'u':
    case 'up':
    case 'update':
      action = 'update'
      method = 'PATCH'
      if (!name) return fail('*please enter name*')
      if (!new_name) return fail('*please enter new name*')
      data = {
        new_name,
        color,
        description
      }
      break;
    case 'g':
    case 'get':
      action = 'get';
      if (!name) return fail('*please enter name*')
      break;
    case 'l':
    case 'ls':
    case 'list':
      action = 'list'
      listing = true
      if (!['repo', 'issue', 'milestone'].includes(list_option))
        return fail(`*expected list_option to be one of 'repo', 'issue', 'milestone'*`)
      if (list_option === 'issue') {
        if (!issue_number) return fail('*please specify issue_number*')
        list_path = `/issues/${issue_number}`
      }
      if (list_option === 'milestone')
        if (!milestone_number) return fail('*please specify milestone_number*')
      list_path = `/milestones/${milestone_number}`
      if (list_option === 'repo')
        listing = false
      break;
    case 'd':
    case 'delete':
      action = 'delete'
      method = 'DELETE'
      if (!name) return fail('*please enter name*')
      break;
    // Issue Labels
    case 'a':
    case 'add':
      action = 'add'
      method = 'POST'
      if (!labels) return fail('*please enter labels to add*')
      if (!issue_number) return fail('*please specify issue_number*')
      data = {
        labels: labels.split(',').map(l => l.trim())
      }
      break;
    case 's':
    case 'set':
      action = 'set'
      method = 'PUT'
      if (!labels) return fail('*please enter labels to add*')
      if (!issue_number) return fail('*please specify issue_number*')
      data = {
        labels: labels.split(',').map(l => l.trim())
      }
      break;
    case 'r':
    case 'rm':
    case 'remove':
      action = 'remove'
      method = 'DELETE'
      if (!name) return fail('*please enter label name to remove*')
      if (!issue_number) return fail('*please specify issue_number*')
      break;
    case 'ra':
    case 'rma':
    case 'removeall':
      action = 'removeall'
      method = 'DELETE'
      if (!issue_number) return fail('*please specify issue_number*')
      break;
    default:
      return fail(`*Invalid Action. Expected options: 'create', 'update', 'delete', 'get', 'list', 'add', 'set', 'remove', 'removeall' *`)
  }
  const url = `${GetBaseUrl(host, secrets.github_host)}/repos/${repository}${issue_number ? `/issues/${issue_number}` : ''}/labels${(name && action !== 'create') ? `/${name}` : ''}`
  console.log(url);
  const res = await Request(url, action, method, data, token)

  const { header, currReading } = GetHeader(res, token)
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
      Text(`${item.name} \n ${item.description || ''}`),
      Text(`Color: ${item.color} ${item.default ? '| Default' : ''}`),
    ],
  }
  response.blocks.push(block)
};

const _list = (items, response) => (items).forEach((item) => {
  _get(item, response)
});


const success = async (action, header, data) => {
  const response = {
    response_type: 'in_channel',
    blocks: [Section(header)],
  };
  switch (action) {
    case 'list':
    case 'add':
    case 'set':
    case 'remove':
      _list(data || [], response)
      break;
    case 'delete':
      response.blocks.push(Section(`Label Deleted.`))
      break
    case 'removeall':
      response.blocks.push(Section(`Label(s) Removed.`))
      break
    default:
      _get(data, response)
      break;
  }
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
