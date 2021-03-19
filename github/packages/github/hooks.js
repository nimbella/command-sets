// jshint esversion: 9

const axios = require('axios');

const requestThreshold = 3
const headers = {
  'Content-Type': 'application/json',
};


async function Request(url, action, method, data, secrets) {
  if (secrets.github_token) {
    let token
    [token,] = secrets.github_token.split('@')
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
async function command(params, commandText, secrets = {}) {
  let tokenHost, baseURL = 'https://api.github.com'
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
  const { github_repos, github_host } = secrets;
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
  if (secrets.github_token) {
    [, tokenHost] = secrets.github_token.split('@')
  }
  baseURL = host || tokenHost || github_host || baseURL
  baseURL = updateURL(baseURL)
  const url = `${baseURL}/${type === 'repos' ? `repos/${repository}` : `orgs/${org}`}/hooks${id ? `/${id}` : ''}${ping ? `/ping` : ''}`
  // /orgs/{org}/hooks
  console.log(url);
  const res = await Request(url, action, method, data, secrets)

  if (res) {
    const tokenMessage = secrets.github_token ? '' : '*For greater limits you can add <https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line | secrets> using*\n `/nc secret_create`';
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
  else if (action === 'lock')
    response.blocks.push(section(`Pull Locked.`))
  else if (action === 'unlock')
    response.blocks.push(section(`Pull Unlocked.`))
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
  if (url.includes('|')) { url = (url.split('|')[1] || '').replace('>', '') }
  else { url = url.replace('<', '').replace('>', '') }
  if (!url.startsWith('http')) { url = 'https://' + url; }
  if (!url.includes('api')) { url += '/api/v3'; }
  return url
}

const main = async (args) => ({
  body: await command(args.params, args.commandText, args.__secrets || {}).catch((error) => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`,
  })),
});

module.exports = main;
