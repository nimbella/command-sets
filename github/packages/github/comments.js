// jshint esversion: 9

const axios = require('axios');

const requestThreshold = 3
const headers = {
  'Content-Type': 'application/json',
};
async function Request(url, action, method, data, secrets) {
  if (!secrets.github_token && (action !== 'list' || action !== 'get')) { return fail('*please add github_token secret*') }
  if (secrets.github_token) headers.Authorization = `Bearer ${secrets.github_token}`;
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
    comment_id = '',
    body,
    since,
    sort = 'created',
    direction = 'desc',
    per_page = 100,
    page = 1
  } = params;
  let method = 'GET'
  let data = {}

  const { github_repos } = secrets;
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
      lock = true
      if (!comment_id) return fail('*please specify comment id*')
      break;
    default:
      return fail(`*Invalid Action. Expected options: 'add', 'update', 'delete', 'get', 'list' *`)
  }
  const url = `https://api.github.com/repos/${repository}/issues${issue_number ? `/${issue_number}` : ''}/comments${comment_id ? `/${comment_id}` : ''}`
  const res = await Request(url, action, method, data, secrets)

  if (res) {
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
    // Convert markdown links to slack format.
    .replace(/!*\[(.*)\]\((.*)\)/g, '<$2|$1>')
    // Replace markdown headings with slack bold
    .replace(/#+\s(.+)(?:\R(?!#(?!#)).*)*/g, '*$1*'),
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
  const block = {
    type: 'section',
    fields: [
      mdText(`<${item.html_url}|${item.id}>`),
      mdText(`*Created:* <!date^${Math.floor(new Date(item.created_at).getTime() / 1000)}^{date_pretty} at {time}|${item.created_at}> \n*Updated:* <!date^${Math.floor(new Date(item.updated_at).getTime() / 1000)}^{date_pretty} at {time}|${item.updated_at}>`),
    ],
  }
  block.accessory = image(item.user.avatar_url, item.user.login)
  response.blocks.push(block)
  if (item.body) response.blocks.push(section(`${item.body.length > 500 ? item.body.substr(0, 500) + '...' : item.body}`.replace(/#(\d+)/g, `<${item.html_url.split('/').splice(0, 5).join('/')}/issues/$1|#$1>`)));
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

const main = async (args) => ({
  body: await command(args.params, args.commandText, args.__secrets || {}).catch((error) => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`,
  })),
});
module.exports = main;
