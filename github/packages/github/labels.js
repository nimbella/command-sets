// jshint esversion: 9

const axios = require('axios');

const requestThreshold = 3
const headers = {
  'Content-Type': 'application/json',
};
let tokenHost, baseURL = 'https://api.github.com/'

async function Request(url, action, method, data, secrets) {
  if (!secrets.github_token && (action !== 'list' || action !== 'get')) { return fail('*please add github_token secret*') }
  if (secrets.github_token) {
    let token
    [token, tokenHost] = secrets.github_token.split('@')
    headers.Authorization = `Bearer ${token}`;
  }
  return (axios({
    method: method,
    url,
    headers,
    data
  }).then((res) => res).catch(
    (err) => console.log(err)
  ))
}


/**
 * @description 
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function command(params, commandText, secrets = {}) {
  let {
    action,
    repository,
    issue_number = '',
    name,
    new_name = '',
    color,
    description,
    labels = [],
    list_option = 'repo',
    milestone_number,
    since,
    sort = 'created',
    direction = 'desc',
    per_page = 100,
    page = 1,
    host
  } = params;
  let method = 'GET'
  let data = {}
  let listing = false
  const { github_repos, github_host } = secrets;
  const default_repos = repository ? repository : github_repos;
  if (default_repos) {
    repository = default_repos.split(',').map(repo => repo.trim())[0];
  }
  switch (action) {
    case 'c':
    case 'cr':
    case 'create':
      action = 'create'
      method = 'POST'
      if (!name) return fail('*please enter name*')
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
  baseURL = host || tokenHost || github_host || baseURL
  baseURL = updateURL(baseURL)
  const url = `${baseURL}repos/${repository}${issue_number ? `/issues/${issue_number}` : ''}/labels${(name && action !== 'create') ? `/${name}` : ''}`
  const res = await Request(url, action, method, data, secrets)

  if (res) {
    const tokenMessage = secrets.github_token ? '' : '*For greater limits you can add <https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line | secrets> using*\n `/nc secret_create`';
    const currReading = parseInt(res.headers['x-ratelimit-remaining']);
    let header = `\nLabel *${action.charAt(0).toUpperCase() + action.substr(1)}* Request Result:`;
    if (currReading < requestThreshold) {
      header = `:warning: *You are about to reach the api rate limit.* ${tokenMessage}`;
    }
    if (currReading === 0) {
      header = `:warning: *The api rate limit has been exhausted.* ${tokenMessage}`;
      return fail(header);
    }
    return success(action, header, res.data, secrets);
  }
  return fail();
}

const mdText = (text) => ({
  type: 'mrkdwn',
  text: text
});

const section = (text) => ({
  type: 'section',
  text: mdText(text),
});

const fail = (msg) => {
  const response = {
    response_type: 'in_channel',
    blocks: [section(`${msg || '*couldn\'t get action results*'}`)],
  };
  return response
};

const _get = (item, response) => {
  console.log(item)
  const block = {
    type: 'section',
    fields: [
      mdText(`${item.name} \n ${item.description || ''}`),
      mdText(`Color: ${item.color} ${item.default ? '| Default' : ''}`),
    ],
  }
  response.blocks.push(block)
};

const _list = (items, response) => (items).forEach((item) => {
  _get(item, response)
});


const success = async (action, header, data, secrets) => {
  const response = {
    response_type: 'in_channel',
    blocks: [section(header)],
  };
  switch (action) {
    case 'list':
    case 'add':
    case 'set':
    case 'remove':
      _list(data || [], response)
      break;
    case 'delete':
      response.blocks.push(section(`Label Deleted.`))
      break
    case 'removeall':
      response.blocks.push(section(`Label(s) Removed.`))
      break
    default:
      _get(data, response)
      break;
  }

  response.blocks.push({
    type: 'context',
    elements: [
      mdText('add _github command-set_ to your Slack with <https://nimbella.com/product/commander/ | Commander>'),
    ],
  });
  return response
};

const updateURL = (url) => {
  if (!url.startsWith('http')) { url = 'https://' + url; }
  if (!url.includes('api')) { url += '/api/v3/'; }
  return url
}

const main = async (args) => ({
  body: await command(args.params, args.commandText, args.__secrets || {}).catch((error) => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`,
  })),
});

module.exports = main;
