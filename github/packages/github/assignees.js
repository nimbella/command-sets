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
    assignees = '',
    per_page = 10,
    page = 1,
    host
  } = params;
  let method = 'GET'
  let assignee = ''
  let data = {}

  const { github_repos, github_host } = secrets;
  const default_repos = repository ? repository : github_repos;
  if (default_repos) {
    repository = default_repos.split(',').map(repo => repo.trim())[0];
  }
  switch (action) {
    case 'a':
    case 'add':
      action = 'add'
      method = 'POST'
      if (assignees.length === 0) return fail('*please specify assignee*')
      if (!issue_number) return fail('*please specify an issue number*')
      data = {
        assignees: assignees.split(',').map(a => a.trim())
      }
      break;
    case 'r':
    case 'remove':
      action = 'remove'
      method = 'DELETE'
      if (assignees.length === 0) return fail('*please specify assignee*')
      if (!issue_number) return fail('*please specify an issue number*')
      data = {
        assignees: assignees.split(',').map(a => a.trim())
      }
      break;
    case 'c':
    case 'check':
      action = 'check'
      if (assignees.length === 0) return fail('*please specify assignee*')
      assignee = assignees.split(',').map(a => a.trim())[0]
      break;
    case 'l':
    case 'ls':
    case 'list':
      action = 'list'
      break;
    default:
      return fail(`*Invalid Action. Expected options:  'add', 'remove', 'check', 'list' *`)
  }
  baseURL = host || tokenHost || github_host || baseURL
  baseURL = updateURL(baseURL)
  const url = `${baseURL}repos/${repository}${issue_number ? `/issues/${issue_number}` : ''}/assignees${assignee ? `/${assignee}` : ''}`
  const res = await Request(url, action, method, data, secrets)

  if (res) {
    const tokenMessage = secrets.github_token ? '' : '*For greater limits you can add <https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line | secrets> using*\n `/nc secret_create`';
    const currReading = parseInt(res.headers['x-ratelimit-remaining']);
    let header = `\nAssignee *${action.charAt(0).toUpperCase() + action.substr(1)}* Request Result:`;
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

const image = (source, alt) => ({
  type: 'image',
  image_url: source,
  alt_text: alt,
});

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

const _assignee = (item, response) => {
  const block = {
    type: 'section',
    fields: [
      mdText(`<${item.html_url}|${item.login}>`)
    ],
    accessory: image(item.avatar_url, item.login)
  }
  response.blocks.push(block)
  if (item.body) response.blocks.push(section(`${item.body.length > 500 ? item.body.substr(0, 500) + '...' : item.body}`.replace(/#(\d+)/g, `<${item.html_url.split('/').splice(0, 5).join('/')}/issues/$1|#$1>`)));
};

const _assignees = (items, response) => (items).forEach((item) => {
  _assignee(item, response)
});

const _get = (item, response) => {
  const block = {
    type: 'section',
    fields: [
      mdText(`<${item.html_url}|${item.number}> \n ${item.title} ${item.milestone ? `\n ${item.milestone.title}` : ''}
      ${item.assignees.length > 0 ? `\n ${item.assignees.map(a => `<${a.html_url}|${a.login}>`).join()}` : ''} 
      ${item.labels.length > 0 ? `\n ${item.labels.map(l => l.name).join()}` : ''} 
      `),
      mdText(`*State:* ${item.state.charAt(0).toUpperCase() + item.state.substr(1)} \n*Created:* <!date^${Math.floor(new Date(item.created_at).getTime() / 1000)}^{date_pretty} at {time}|${item.created_at}> \n*Updated:* <!date^${Math.floor(new Date(item.updated_at).getTime() / 1000)}^{date_pretty} at {time}|${item.updated_at}>  ${item.closed_at ? `\n*Closed:* <!date^${Math.floor(new Date(item.closed_at).getTime() / 1000)}^{date_pretty} at {time}|${item.closed_at}>` : ''}`),
    ],
  }
  if (item.assignee) block.accessory = image(item.assignee.avatar_url, item.assignee.login)
  response.blocks.push(block)
  if (item.body) response.blocks.push(section(`${item.body.length > 500 ? item.body.substr(0, 500) + '...' : item.body}`.replace(/#(\d+)/g, `<${item.html_url.split('/').splice(0, 5).join('/')}/issues/$1|#$1>`)));
};


const success = async (action, header, data, secrets) => {
  const response = {
    response_type: 'in_channel',
    blocks: [section(header)],
  };
  if (action === 'list')
    _assignees(data || [], response)
  else if (action === 'add')
    _get(data, response)
  else if (action === 'remove')
    _get(data || [], response)
  else if (action === 'check')
    response.blocks.push(section(`Can be assigned`))
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
