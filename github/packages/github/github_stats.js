// jshint esversion: 9

/**
 * @description View repository community statistics
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */



async function _command(params, commandText, secrets = {}) {
  let tokenHost, baseURL = 'https://api.github.com'
  let { github_token: githubToken, github_repos: githubRepos = '', github_host } = secrets;
  
  githubRepos = params.repo ? params.repo : githubRepos;

  if (!githubRepos) {
    return {
      response_type: 'ephemeral',
      text:
        'Either pass a repo name or create a secret named `github_repos` to avoid passing the repository.'
    };
  }
  if (secrets.github_token) {
    [githubToken, tokenHost] = secrets.github_token.split('@')
  }

  githubRepos = githubRepos.split(',').map(repo => repo.trim());

  const result = [];
  const client = params.__client.name;
  const host = params.host
  const tokenMessage = githubToken
    ? ''
    : 'For greater limits, create a secret named `github_token` with a <https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line|GitHub token> using `/nc secret_create`.';

  try {
    const axios = require('axios');
    const networkRequests = [];
    baseURL = host || tokenHost || github_host || baseURL
    baseURL = updateURL(baseURL)
    for (const repo of githubRepos) {
      const url = `${baseURL}/repos/${repo}`;
      networkRequests.push(
        axios({
          method: 'GET',
          url: url,
          headers: githubToken
            ? {
              Authorization: `Bearer ${githubToken}`,
              'Content-Type': 'application/json'
            }
            : {}
        })
      );
    }

    const responses = await Promise.all(networkRequests);

    for (const response of responses) {
      const { data, headers } = response;
      const requestThreshold = 3;
      const currReading = parseInt(headers['x-ratelimit-remaining']);
      const body = [
        `Stars: ${data.stargazers_count}`,
        `Forks: ${data.forks}`,
        `Open Issues: ${data.open_issues_count}`,
        `Watchers: ${data.subscribers_count}`,
        `Contributors: ${data.network_count}`,
        `Default Branch: ${data.default_branch}`,
        `Most used langauge: ${data.language === null ? 'None' : data.language}`
      ];
      result.push({
        color: 'good',
        text: body.join('\n'),
        title:
          client === 'mattermost'
            ? `[${data.full_name}](${data.html_url})`
            : `<${data.html_url}|${data.full_name}> statistics`,
        pretext:
          currReading < requestThreshold
            ? `:warning: *You are about to reach the api rate limit.* ${tokenMessage}`
            : null
      });
    }
  } catch (error) {
    result.push({
      color: 'danger',
      text: getErrorMessage(error)
    });
  }

  return {
    response_type: 'in_channel',
    attachments: result
  };
}


const getRedirectURL = url =>  url.replace('api.', '').replace('/api/v3', '')

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
  } else if (error.response && error.response.status === 404) {
    return `Repository not found.`
  } else if (error.response && error.response.status && error.response.data) {
    return `Error: ${error.response.status} ${error.response.data.message}`
  } else {
    return error.message
  }
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */
const main = async args => ({
  body: await _command(
    args.params,
    args.commandText,
    args.__secrets || {}
  ).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
