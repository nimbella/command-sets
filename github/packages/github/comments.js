// jshint esversion: 9

const axios = require('axios');

const requestThreshold = 3
const headers = {
  'Content-Type': 'application/json',
};


async function Request(url, action, method, data, secrets) {
  if (!secrets.github_token && (action !== 'list' || action !== 'get')) { return fail('*please add github_token secret*') }
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

  const { github_repos, github_host } = secrets;
  const default_repos = repository ? repository : github_repos;
  if (default_repos) {
    repository = default_repos.split(',').map(repo => repo.trim())[0];
  }
  if (!repository) return fail('*please specify repository*')
  switch (action) {
    case 'c':
    case 'cr':
    case 'add':
    case 'create':
      action = 'create'
      method = 'POST'
      if (!body) return fail('*please enter comment*')
      if (!issue_number) return fail('*please specify an issue number*')
      data = {
        body
      }
      break;
    case 'u':
    case 'up':
    case 'update':
      action = 'update'
      method = 'PATCH'
      if (!comment_id) return fail('*please specify comment id*')
      data = {
        body
      }
      break;
    case 'g':
    case 'get':
      action = 'get';
      if (!comment_id) return fail('*please specify comment id*')
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
      if (!comment_id) return fail('*please specify comment id*')
      break;
    default:
      return fail(`*Invalid Action. Expected options: 'add', 'update', 'delete', 'get', 'list' *`)
  }
  if (secrets.github_token) {
    [, tokenHost] = secrets.github_token.split('@')
  }
  baseURL = host || tokenHost || github_host || baseURL
  baseURL = updateURL(baseURL)
  const url = `${baseURL}/repos/${repository}/issues${issue_number ? `/${issue_number}` : ''}/comments${comment_id ? `/${comment_id}` : ''}`
  const res = await Request(url, action, method, data, secrets)

  if (res && res.headers) {
    const tokenMessage = secrets.github_token ? '' : '*For greater limits you can add <https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line | secrets> using*\n `/nc secret_create`';
    const currReading = parseInt(res.headers['x-ratelimit-remaining']);
    let header = `\nComment *${action.charAt(0).toUpperCase() + action.substr(1)}* Request Result:`;
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
      mdText(item.id?`<${item.html_url}|${item.id}>`:''),
      mdText(`*Created:* ${item.created_at ? `<!date^${Math.floor(new Date(item.created_at).getTime() / 1000)}^{date_pretty} at {time}|${item.created_at}>` : '-'}
      \n*Updated:* ${item.updated_at ? `<!date^${Math.floor(new Date(item.updated_at).getTime() / 1000)}^{date_pretty} at {time}|${item.updated_at}>` : '-'} `),
    ],
  }
  if (item.user) block.accessory = image(item.user.avatar_url, item.user.login)
  response.blocks.push(block)
  if (item.body) response.blocks.push(section(`${item.body.length > 500 ? item.body.substr(0, 500) + '...' : item.body}`.replace(/#(\d+)/g, `<${item.html_url.split('/').splice(0, 5).join('/')}/issues/$1|#$1>`)));
};

const _list = (items, response) => (items).forEach((item) => {
  _get(item, response)
});


const success = async (action, header, data) => {
  const response = {
    response_type: 'in_channel',
    blocks: [section(header)],
  };
  if (action === 'list')
    _list(data || [], response)
  else if (action === 'unlock')
    response.blocks.push(section(`Comment Deleted.`))
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
