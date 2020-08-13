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
    title,
    due_on,
    state ,
    description,
    milestone_number,
    sort = 'created',
    direction = 'desc',
    per_page = 100,
    page = 1
  } = params;
  let method = 'GET'
  let data = {}
  let listing = false
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
      if (!title) return fail('*please enter name*')
      data = {
        title,
        state,
        description,
        due_on
      }
      break;
    case 'u':
    case 'up':
    case 'update':
      action = 'update'
      method = 'PATCH'
      if (!milestone_number) return fail('*please enter milestone_number*')
      data = {
        title,
        state,
        description,
        due_on
      }
      break;
    case 'g':
    case 'get':
      action = 'get';
      if (!milestone_number) return fail('*please enter milestone_number*')
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
      if (!milestone_number) return fail('*please enter milestone_number*')
      break;
    default:
      return fail(`*Invalid Action. Expected options: 'create', 'update', 'delete', 'get', 'list' *`)
  }
  const url = `https://api.github.com/repos/${repository}/milestones${milestone_number ? `/${milestone_number}` : ''}${state ? `?state=${state}` : ''}`
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
  const block = {
    type: 'section',
    fields: [
      mdText(`<${item.html_url}|${item.number}> \n ${item.title}
      Open: ${item.open_issues} \nClosed: ${item.closed_issues} 
      `),
      mdText(`*State:* ${item.state.charAt(0).toUpperCase() + item.state.substr(1)} 
      \n*Created:* <!date^${Math.floor(new Date(item.created_at).getTime() / 1000)}^{date_pretty} at {time}|${item.created_at}> 
      \n*Updated:* <!date^${Math.floor(new Date(item.updated_at).getTime() / 1000)}^{date_pretty} at {time}|${item.updated_at}>  
      \n*Due:* <!date^${Math.floor(new Date(item.due_on).getTime() / 1000)}^{date_pretty} at {time}|${item.due_on}>  
      ${item.closed_at ? `\n*Closed:* <!date^${Math.floor(new Date(item.closed_at).getTime() / 1000)}^{date_pretty} at {time}|${item.closed_at}>` : ''}`),
      mdText(`Creator: <${item.creator.avatar_url}|${item.creator.login}>`)
    ],
  }
  response.blocks.push(block)
  if (item.description) response.blocks.push(section(`${item.description.length > 500 ? item.description.substr(0, 500) + '...' : item.description}`));
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
  else if (action === 'delete')
    response.blocks.push(section(`Milestone Deleted.`))
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
