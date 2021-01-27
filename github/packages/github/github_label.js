// jshint esversion: 9

/**
 * @description Label an issue.
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

let tokenHost, baseURL = 'https://api.github.com/'

async function _command(params, commandText, secrets = {}) {
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
  const {issueNumber, labels, host} = params;
  const repo = params.repo === false ? defaultRepo : params.repo;
  if (!repo && !defaultRepo) {
    return {
      response_type: 'ephemeral',
      text:
        'Either pass a repo name or create a secret named `github_repos` to avoid passing the repository.'
    };
  }

  try {
    baseURL = host || tokenHost || github_host || baseURL
    if (!baseURL.includes(':')) { baseURL = "https://" + baseURL }
    if (!baseURL.includes('api')) { baseURL += '/api/v3/' }
    const url = `${baseURL}repos/${repo}/issues/${issueNumber}`;
    const axios = require('axios');

    // Get current labels of the issue.
    const {
      data: {labels: currentLabels}
    } = await axios({
      method: 'GET',
      url: url,
      headers: {
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Add labels to the issue.
    const {data} = await axios({
      method: 'PATCH',
      url: url,
      data: {
        // Merge current labels of the issue and the labels provided by the user.
        labels: [
          ...labels.split(',').map(label => label.trim()),
          ...currentLabels.map(label => label.name)
        ]
      },
      headers: {
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Matches html tags
    const html = new RegExp(/<.*>.*<\/.*>/);
    const body = html.test(data.body)
      ? `_couldn't render body of issue_`
      : data.body;

    result.push({
      color: 'good',
      title: `${data.title}`,
      text: `${body}\nLabels: ${data.labels
        .map(label => `\`${label.name}\``)
        .join(' ')}`,
      title_link: data.html_url,
      pretext: `Lable(s) added to <${data.html_url}|#${data.number}>`
    });
  } catch (error) {
    if (error.response.status === 404) {
      result.push({
        color: 'danger',
        text: `Issue #${issueNumber} not found for <https://github.com/${repo}|${repo}>.`
      });
    } else {
      result.push({
        color: 'danger',
        text: `Error: ${error.response.status} ${error.response.data.message}`
      });
    }
  }

  return {
    response_type: 'in_channel',
    attachments: result
  };
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
