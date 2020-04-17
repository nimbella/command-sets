// jshint esversion: 9

/**
 * @description Label an issue.
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {github_token: githubToken, github_default_repo: defaultRepo} = secrets;
  if (!githubToken) {
    return {
      response_type: 'ephemeral',
      text:
        'Missing GitHub Personal Access Token! Create a secret named `github_token` with your personal access token. '
    };
  }

  const result = [];
  const {issueNumber, labels} = params;
  const repo = params.repo === false ? defaultRepo : params.repo;
  if (!repo && !defaultRepo) {
    return {
      response_type: 'ephemeral',
      text:
        'Please create `github_default_repo` secret to avoid passing the repository.'
    };
  }

  try {
    const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}`;
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

    result.push({
      color: 'good',
      title: `${data.title}`,
      text: `${data.body}\nLabels: ${data.labels
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
