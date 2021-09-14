// jshint esversion: 9

/**
 * @description View repository community statistics
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */



async function _command(params, commandText, secrets = {}, token = null) {
  let baseURL = 'https://api.github.com'
  let { github_repos: githubRepos = '', github_host } = secrets;
  
  githubRepos = params.repo ? params.repo : githubRepos;

  if (!githubRepos) {
    return {
      response_type: 'ephemeral',
      text:
        'Either pass a repo name or create a secret named `github_repos` to avoid passing the repository.'
    };
  }
  githubRepos = githubRepos.split(',').map(repo => repo.trim());

  const result = [];
  const client = params.__client.name;
  const host = params.host
  const tokenMessage = token
    ? ''
    : 'For greater limits, please run /nc oauth_create github. See <https://nimbella.com/docs/commander/slack/oauth#adding-github-as-an-oauth-provider | github as oauth provider>';

  try {
    const axios = require('axios');
    const networkRequests = [];
    baseURL = host || github_host || baseURL
    baseURL = updateURL(baseURL)
    for (const repo of githubRepos) {
      const url = `${baseURL}/repos/${repo}`;
      networkRequests.push(
        axios({
          method: 'GET',
          url: url,
          headers: token
            ? {
              Authorization: `Bearer ${token}`,
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
    args.__secrets || {},
    args._token || null
  ).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
