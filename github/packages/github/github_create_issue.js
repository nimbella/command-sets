// jshint esversion: 9

/**
 * @description Create a GitHub issue.
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
        'Missing GitHub Personal Access Token! Create a secret named `github_token` with your personal access token.'
    };
  }

  const result = [];
  const {title, body} = params;
  const repo = params.repo === false ? defaultRepo : params.repo;
  if (!repo && !defaultRepo) {
    return {
      response_type: 'ephemeral',
      text:
        'Either pass a repo name or create a secret named `github_default_repo` to avoid passing the repository.'
    };
  }

  try {
    const url = `https://api.github.com/repos/${repo}/issues`;
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
      text: `Error: ${error.response.status} ${error.response.data.message}`
    });
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
