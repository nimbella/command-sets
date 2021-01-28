// jshint esversion: 9

const axios = require('axios');

const requestThreshold = 3;
const headers = {
  'Content-Type': 'application/json',
};


async function getRequest(url, secrets) {
  console.log(url);
  if (secrets.github_token) {
    let token
    [token,] = secrets.github_token.split('@')
    headers.Authorization = `Bearer ${token}`;
  }
  return (axios({
    method: 'get',
    url,
    headers,
  }).then((res) => res).catch((err) => err));
}


/**
 * @description search github for repositories, commits, code, issues pull requests, users, topics
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function command(params, commandText, secrets = {}) {
  let tokenHost, baseURL = 'https://api.github.com'
  let {
    entity,
    keywords = '',
    query = '',
    repositories,
    language,
    pageSize,
    pageNumber = 1,
    host
  } = params;
  const displayQuery = query;
  let displayEntity = entity;
  let adjustedPageSize = 20;
  let sort = 'sort:created'

  const { github_repos, github_host } = secrets;
  const default_repos = repositories ? repositories : github_repos;
  if (default_repos) {
    repositories = default_repos.split(',').map(repo => 'repo:' + repo.trim()).join('+');
  }
  switch (entity) {
    case 'r':
    case 'rep':
    case 'repo':
    case 'repos':
      displayEntity = 'Repositories';
      entity = 'repositories';
      repositories = undefined;
      if (!keywords) return fail('*please specify a keyword*')
      break;
    case 'cm':
    case 'commit':
      entity = 'commits';
      displayEntity = 'Commits';
      headers.Accept = 'application/vnd.github.cloak-preview';
      if (!keywords) return fail('*please specify a keyword*')
      break;
    case 'c':
    case 'cd':
      entity = 'code';
      displayEntity = 'Code Files';
      query += '+in:file';
      if (!keywords) return fail('*please specify a keyword*')
      if (!repositories) return fail('*please specify a repository, using -r flag e.g.*\n`/nc github_search c github -r nimbella/command-sets`');
      break;
    case 'i':
    case 'issue':
    case 'issues':
      entity = 'issues';
      displayEntity = 'Issues';
      query += '+is:issue';
      adjustedPageSize = 10;
      if (!keywords && !repositories) return fail('*please specify a keyword or repository*')
      break;
    case 'p':
    case 'pr':
    case 'prs':
      entity = 'issues';
      displayEntity = 'Pull-requests';
      query += '+is:pr';
      if (!keywords && !repositories) return fail('*please specify a keyword or repository*')
      break;
    case 'u':
    case 'user':
      displayEntity = 'Users';
      entity = 'users';
      repositories = undefined;
      adjustedPageSize = 10;
      if (!keywords) return fail('*please specify a keyword*')
      break;
    case 't':
    case 'topic':
    case 'topics':
      entity = 'topics';
      displayEntity = 'Topics';
      headers.Accept = 'application/vnd.github.mercy-preview+json';
      sort = 'repositories:>0'
      adjustedPageSize = 10;
      repositories = undefined;
      break;
    default:
      displayEntity = 'Repositories';
      entity = 'repositories';
      repositories = undefined;
      if (!keywords) return fail('*please specify a keyword*')
      break;
  }
  if (secrets.github_token) {
    [, tokenHost] = secrets.github_token.split('@')
  }
  baseURL = host || tokenHost || github_host || baseURL
  baseURL = updateURL(baseURL)
  const url = `${baseURL}/search/${entity}?q=${keywords}+${query}+${repositories || ''}${language ? `+language:${language}` : ''}+${sort}&page=${pageNumber}&per_page=${pageSize ? pageSize : adjustedPageSize}`;
  const res = await getRequest(url, secrets);

  if (res && res.data) {
    const tokenMessage = secrets.github_token ? '' : '*For greater limits you can add <https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line | secrets> using*\n `/nc secret_create`';
    const currReading = parseInt(res.headers['x-ratelimit-remaining']);
    let header = `\n\n*${displayEntity}:* ${keywords ? ` with keyword(s) _*${keywords}*_` : ''} ${displayQuery ? `matching query _*${displayQuery}*_` : ''} found *${res.data.total_count}* result(s). ${res.data.total_count > 10 ? 'Use `-n` flag to get next set of results' : ''}`;
    if (currReading < requestThreshold) {
      header = `:warning: *You are about to reach the api rate limit.* ${tokenMessage}`;
    }
    if (currReading === 0) {
      header = `:warning: *The api rate limit has been exhausted.* ${tokenMessage}`;
      return fail(header);
    }
    return success(entity, header, res.data.items || [], secrets);
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
    blocks: [section(`${msg || '*couldn\'t get search results*'}`)],
  };
  return response;
};

const repositories = (items, response) => (items).forEach((item) => {
  response.blocks.push(
    {
      type: 'section',
      accessory: image(item.owner.avatar_url, item.owner.login),
      fields: [
        mdText(`<${item.html_url}|${item.full_name}> \n *Watchers:* ${item.watchers_count} \n *Stars:* ${item.stargazers_count} \n *Forks:* ${item.forks_count}`),
        mdText(`${item.description || ' '}`),
      ],
    },
  );
});

const commits = (items, response) => (items).forEach((item) => {
  item.author = item.author || item.committer;
  if (item.author) {
    response.blocks.push(
      {
        type: 'section',
        accessory: image(item.author.avatar_url, item.author.login),
        fields: [
          mdText(`*Repository:* <${item.repository.html_url}|${item.repository.full_name}> \n *Author:* <${item.author.html_url}|${item.commit.author.name}> \n *Committer:* <${item.committer.html_url}|${item.commit.committer.name}> \n *Date:* <!date^${Math.floor(new Date(item.commit.author.date).getTime() / 1000)}^{date_pretty} at {time}|${item.commit.author.date}> \n *Comments:* ${item.commit.comment_count}`),
        ],
      },
    );
    response.blocks.push(section(`<${item.html_url}| Commit> Message: ${item.commit.message}`));
  }
});

const code = (items, response) => (items).forEach((item) => {
  response.blocks.push(
    {
      type: 'section',
      accessory: image(item.repository.owner.avatar_url, item.repository.owner.login),
      fields: [
        mdText(`*Repository:* <${item.repository.html_url}|${item.repository.full_name}>`),
        mdText(`*File:* <${item.html_url}|${item.name}> \n*Path:* ${item.path}`),
      ],
    },
  );
});

const issues = (items, response) => (items).forEach((item) => {
  item.author = item.author || item.user;
  response.blocks.push(
    {
      type: 'section',
      accessory: image(item.user.avatar_url, item.user.login),
      fields: [
        mdText(`*Title:* <${item.html_url}|${item.title}> \n*Author:* <${item.author.html_url}|${item.author.login}>  ${item.assignee ? `\n *Assignee:* <${item.assignee.url}|${item.assignee.login}>` : ''}  \n *Comments:* ${item.comments}`),
        mdText(`${item.labels.length ? `*Labels:* ${item.labels.map((l) => `\n<${l.url}|${l.name}>`)}` : ' '}`),
        mdText(`*State:* ${item.state.charAt(0).toUpperCase() + item.state.substr(1)} \n*Created:* <!date^${Math.floor(new Date(item.created_at).getTime() / 1000)}^{date_pretty} at {time}|${item.created_at}> \n*Updated:* <!date^${Math.floor(new Date(item.updated_at).getTime() / 1000)}^{date_pretty} at {time}|${item.updated_at}>  ${item.closed_at ? `\n*Closed:* <!date^${Math.floor(new Date(item.closed_at).getTime() / 1000)}^{date_pretty} at {time}|${item.closed_at}>` : ''}`),
      ],
    },
  );
  if (item.body) response.blocks.push(section(`${item.body.length > 500 ? item.body.substr(0, 500) + '...' : item.body}`.replace(/#(\d+)/g,`<${item.html_url.split('/').splice(0,5).join('/')}/issues/$1|#$1>`)));
});

const users = async (items, response, secrets) => await Promise.all(items.map(async (item) => {
  const res = await getRequest(item.url, secrets)
  const user = res.data
  console.log(user);
  response.blocks.push(
    {
      type: 'section',
      accessory: image(item.avatar_url, item.login),
      fields: [],
    },
  );
  const index = response.blocks.length - 1
  if (user) {
    response.blocks[index].fields.push(mdText(`${item.type === 'User' ? ':male-office-worker:' : ':office:'}\n<${item.html_url}|${item.login}>\n\n<${item.html_url}?tab=repositories|repositories> ${user.public_repos} \n<https://gist.github.com/${item.login}|gists> ${user.public_gists}\n<${item.html_url}?tab=projects|projects> ${item.type === 'User' ? `\n<${item.html_url}?tab=stars|stars>` : ''}  \n<${item.html_url}?tab=following|following> ${user.following} \n<${item.html_url}?tab=followers|followers> ${user.followers}`))
    response.blocks[index].fields.push(mdText(`${user.name || ''} \n${user.company || ''} \n${user.location || ''} \n${user.bio || ''} \n${user.blog || ''} ${item.type === 'User' ? `\nOpen to job opportunities: ${user.hireable ? 'Yes' : 'No'}` : ''}`))
  }
  else {
    response.blocks[index].fields.push(mdText(`${item.type === 'User' ? ':male-office-worker:' : ':office:'}\n<${item.html_url}|${item.login}>\n\n<${item.html_url}?tab=projects|projects> \n<${item.html_url}?tab=stars|stars> `))
  }
}));

const topics = (items, response) => (items).forEach((item) => {
  response.blocks.push(
    {
      type: 'section',
      fields: [
        mdText(`_*${item.display_name || item.name}*_ ${item.short_description ? `\n${item.short_description}` : ''} ${item.created_by ? `\n *Creator:* ${item.created_by}` : ''} ${item.released ? `\n *Released:* ${item.released}` : ''} \n*Created:* <!date^${Math.floor(new Date(item.created_at).getTime() / 1000)}^{date_pretty} at {time}|${item.created_at}>  \n*Updated:* <!date^${Math.floor(new Date(item.updated_at).getTime() / 1000)}^{date_pretty} at {time}|${item.updated_at}>  \n *Featured:* ${item.featured ? ':thumbsup:' : ':thumbsdown:'}  *Curated:* ${item.curated ? ':thumbsup:' : ':thumbsdown:'}`),
      ],
    },
  );
  if (item.description) response.blocks.push(section(item.description));
});

const success = async (entity, header, items, secrets) => {
  const response = {
    response_type: 'in_channel',
    blocks: [section(header)],
  };
  if (entity === 'repositories') repositories(items, response);
  if (entity === 'commits') commits(items, response);
  if (entity === 'code') code(items, response);
  if (entity === 'issues') issues(items, response);
  if (entity === 'users') await users(items, response, secrets);
  if (entity === 'topics') topics(items, response);

  response.blocks.push({
    type: 'context',
    elements: [
      mdText('add _github command-set_ to your Slack with <https://nimbella.com/product/commander/ | Commander>'),
    ],
  });
  return response;
};

const updateURL = (url) => {
  if (url.includes('|')) { url = (url.split('|')[1] || '').replace('>', '') }
  else { url = url.replace('<', '').replace('>', '') }
  if (!url.startsWith('http')) { url = 'https://' + url; }
  if (!url.includes('api')) { url += '/api/v3'; }
  return url
}

const getErrorMessage = (error) => {
  console.error(error)
  if (error.response && error.response.status === 403) {
    return `:warning: *The api rate limit has been exhausted.*`
  } else if (error.response && error.response.status && error.response.data) {
    return `Error: ${error.response.status} ${error.response.data.message}`
  } else {
    return error.message
  }
}

const main = async (args) => ({
  body: await command(args.params, args.commandText, args.__secrets || {}).catch((error) => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`,
  })),
});
module.exports = main;
