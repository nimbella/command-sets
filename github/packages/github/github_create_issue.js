// jshint esversion: 9

/**
 * @description Create a GitHub issue.
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

async function _command(params, commandText, secrets = {}) {
  let tokenHost, baseURL = 'https://api.github.com'
  let {github_token: githubToken, github_repos: defaultRepo = '', github_host} = secrets;
  if (!githubToken) {
    return {
      response_type: 'ephemeral',
      text:
        'Missing GitHub Personal Access Token! Create a secret named `github_token` with your personal access token.'
    };
  }
  if (secrets.github_token) {
    [githubToken, tokenHost] = secrets.github_token.split('@')
  }

  // Extract the first repository.
  defaultRepo = defaultRepo.split(',').map(repo => repo.trim())[0];

  const result = [];
  const {title, body, host} = params;
  const repo = params.repo === false ? defaultRepo : params.repo;
  if (!repo && !defaultRepo) {
    return {
      response_type: 'ephemeral',
      text:
        'Either pass a repo name or create a secret named `github_repos` to avoid passing the repository.'
    };
  }

  try {
    console.log(host)
    console.log(tokenHost)
    console.log(github_host)
    console.log(baseURL)
    baseURL = host || tokenHost || github_host || baseURL
    console.log(baseURL)
    baseURL = updateURL(baseURL)
    console.log(baseURL)
    const url = `${baseURL}/repos/${repo}/issues`;
    console.log(url)
    const axios = require('axios');
    const {data} = await axios({
      method: 'POST',
      url: url,
      data: {title, body},
      headers: {
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json'
      }
    });

    result.push({
      color: 'good',
      title: data.title,
      text: data.body,
      title_link: data.html_url,
      pretext: `Issue <${data.html_url}|#${data.number}> opened:`
    });
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
  if (!url.startsWith('http')) { url = 'https://' + url; }
  if (!url.includes('api')) { url += '/api/v3'; }
  return url
}

const getErrorMessage = (error) => {
  // console.error(error)
  if (error.response && error.response.status === 403) {
    return `:warning: *The api rate limit has been exhausted.*`
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
