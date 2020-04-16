// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
const axios = require('axios');
const requestThreshold = 3;
const headers = {
  'Content-Type': 'application/json'
}
async function getRequest(url, secrets) {
  if (secrets.github_token)
    headers.Authorization = `Bearer ${secrets.github_token}`;
  return (axios({
    method: "get",
    url: url,
    headers: headers
  })
    .then(res => { return res; })
    .catch(err => { return err; }));
}

async function _command(params, commandText, secrets = {}) {
  let {
    entity, //repositories, commits, code, issues pull requests, users, topics
    keywords,
    repository,
    language
  } = params;
  let displayEntity = entity;
  let displayKeywords = keywords;
  let pageSize = ''
  switch (entity) {
    case 'r':
    case 'rep':
    case 'repo':
    case 'repos':
      displayEntity = 'Repositories'
      entity = 'repositories'
      break;
    case 'cm':
    case 'commit':
      entity = 'commits'
      displayEntity = 'Commits'
      headers.Accept = 'application/vnd.github.cloak-preview'
      break;
    case 'c':
    case 'cd':
      entity = 'code'
      displayEntity = 'Code Files'
      keywords = keywords + `+in:file`
      if (!repository) return fail('please specify a repository')
      break;
    case 'i':
    case 'issue':
      entity = 'issues'
      displayEntity = 'Issues'
      keywords = keywords + `+is:issue`
      pageSize = '&per_page=10"'
      break;
    case 'p':
    case 'pr':
    case 'prs':
      entity = 'issues'
      displayEntity = 'Pull-requests'
      keywords = keywords + `+is:pr`
      break;
    case 'u':
    case 'user':
      displayEntity = 'Users'
      entity = 'users'
      break;
    case 't':
    case 'topic':
      entity = 'topics'
      displayEntity = 'Topics'
      headers.Accept = 'application/vnd.github.mercy-preview+json'
      pageSize = '&per_page=10"'
      break;
    default:
      break;
  }
  const url = `https://api.github.com/search/${entity}?q=${repository ? `repo:${repository}+` : ''}${keywords}${language ? `+language:${language}` : ''}${pageSize}`;
  const res = await getRequest(url, secrets);

  if (res && res.data) {
    const token_message = secrets.github_token ? '' : '*For greater limits you can add <https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line | secrets> using*\n `/nc secret_create`'
    const curr_reading = parseInt(res.headers['x-ratelimit-remaining'])
    let header = `*${displayEntity}* with keywords _*${displayKeywords}*_`
    if (curr_reading < requestThreshold) {
      header = `:warning: *You are about to reach the api rate limit.* ${token_message}`
    }
    if (curr_reading === 0) {
      header = `:warning: *The api rate limit has been exhausted.* ${token_message}`
      return fail(header);
    }
    return success(entity, header, res.data.items || []);
  }
  else {
    return fail();
  }

}


const image = (source, alt) => ({
  type: 'image',
  image_url: source,
  alt_text: alt
});

const section = text => ({
  type: 'section',
  text: {
    type: 'mrkdwn',
    text
  }
});

const divider = _ => ({
  type: "divider"
})

const fail = (msg) => {
  const response = {
    response_type: 'in_channel',
    blocks: [section(`*${msg || `couldn\'t get the listing`}*`)]
  };
  return response;
}

const repositories = (items, response) => (items).forEach(item => {
  response.blocks.push(
    {
      type: 'section',
      accessory: image(item.owner.avatar_url, item.owner.login),
      fields: [
        {
          type: 'mrkdwn',
          text: `<${item.html_url}|${item.full_name}> \n *Watchers:* ${item.watchers_count} \n *Stars:* ${item.stargazers_count} \n *Forks:* ${item.forks_count}`,
        },
        {
          type: 'mrkdwn',
          text: `${item.description || ' '}`,
        },
      ],
    },
  );
})

const commits = (items, response) => (items).forEach(item => {
  item.author = item.author || item.committer
  response.blocks.push(
    {
      type: 'section',
      accessory: image(item.author.avatar_url, item.author.login),
      fields: [
        {
          type: 'mrkdwn',
          text: `*Repository:* <${item.repository.html_url}|${item.repository.full_name}> \n *Author:* <${item.author.url}|${item.commit.author.name}> \n *Committer:* <${item.committer.url}|${item.commit.committer.name}> \n *Comments:* ${item.commit.comment_count}`,
        }
      ],
    },
  );
  response.blocks.push(section(`<${item.html_url}| Commit> Message: ${item.commit.message}`));
})

const code = (items, response) => (items).forEach(item => {
  response.blocks.push(
    {
      type: 'section',
      accessory: image(item.repository.owner.avatar_url, item.repository.owner.login),
      fields: [
        {
          type: 'mrkdwn',
          text: `*Repository:* <${item.repository.html_url}|${item.repository.full_name}>`,
        },
        {
          type: 'mrkdwn',
          text: `*File:* <${item.html_url}|${item.name}> \n*Path:* ${item.path}`,
        },
      ],
    },
  );
})

const issues = (items, response) => (items).forEach(item => {
  item.author = item.author || item.user
  response.blocks.push(divider());
  response.blocks.push(
    {
      type: 'section',
      accessory: image(item.user.avatar_url, item.user.login),
      fields: [
        {
          type: 'mrkdwn',
          text: `*<${item.html_url}|Title>:* ${item.title} \n *Author:* <${item.author.url}|${item.author.login}>  ${item.assignee ? `\n *Assignee:* <${item.assignee.url}|${item.assignee.login}>` : ``}  \n *Comments:* ${item.comments}`,
        },
        {
          type: 'mrkdwn',
          text: `*Labels:* ${item.labels.map(l => { return `\n<${l.url}|${l.name}>` })}`
        }
      ],
    }
  );
  response.blocks.push(section(item.body));
})

const users = (items, response) => (items).forEach(item => {
  response.blocks.push(
    {
      type: 'section',
      accessory: image(item.avatar_url, item.login),
      fields: [
        {
          type: 'mrkdwn', // TODO: Add more useful information
          text: `${item.type === 'User' ? ':male-office-worker:' : ':office:'} <${item.html_url}|${item.login}>\n<${item.html_url}?tab=repositories|repositories> \n<${item.html_url}?tab=projects|projects> \n<${item.html_url}?tab=stars|stars>  \n<${item.html_url}?tab=following|following> \n<${item.html_url}?tab=followers|followers>`,
        }
      ],
    },
  );
})

const topics = (items, response) => (items).forEach(item => {
  response.blocks.push(
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*${item.display_name || item.name}* ${item.short_description ? '\n' + item.short_description : ''} ${item.created_by ? `\n *Creator:* ${item.created_by}` : ''} ${item.released ? `\n *Released:* ${item.released}` : ''} \n *Created:* <!date^${Math.floor(new Date(item.created_at).getTime() / 1000)}^{date_long_pretty} at {time}|${item.created_at}>  \n *Updated:* <!date^${Math.floor(new Date(item.updated_at).getTime() / 1000)}^{date_long_pretty} at {time}|${item.updated_at}>  \n *Featured:* ${item.featured ? ':thumbsup:' : ':thumbsdown:'}  *Curated:* ${item.curated ? ':thumbsup:' : ':thumbsdown:'}`,
        }
      ],
    },
  );
  if (item.description) response.blocks.push(section(item.description));
})

const success = (entity, header, items) => {
  const response = {
    response_type: 'in_channel',
    blocks: [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${header}`,
      },
    },
    ],
  };
  if (entity === 'repositories')
    repositories(items, response);
  if (entity === 'commits')
    commits(items, response);
  if (entity === 'code')
    code(items, response);
  if (entity === 'issues')
    issues(items, response);
  if (entity === 'users')
    users(items, response);
  if (entity === 'topics')
    topics(items, response);

  response.blocks.push({
    type: 'context',
    elements: [{
      type: 'mrkdwn',
      text: 'add _github command-set_ to your Slack with <https://nimbella.com/product/commander/ | Commander>',
    }]
  })

  return response;
}
/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
