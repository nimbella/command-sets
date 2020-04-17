// jshint esversion: 9

/**
 * @description Request someone to review a pull request
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
  const {prNumber, reviewers} = params;
  const repo = params.repo === false ? defaultRepo.trim() : params.repo.trim();
  if (!repo && !defaultRepo) {
    return {
      response_type: 'ephemeral',
      text:
        'Please create `github_default_repo` secret to avoid passing the repository.'
    };
  }

  try {
    const url = `https://api.github.com/repos/${repo}/pulls/${prNumber}/requested_reviewers`;
    const axios = require('axios');
    const {data} = await axios({
      method: 'POST',
      url: url,
      data: {
        reviewers: reviewers.split(',').map(reviewer => reviewer.trim())
      },
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
      pretext: `${reviewers} has been requested to review <${data.html_url}|#${data.number}>:`
    });
  } catch (error) {
    if (error.response.status === 404) {
      result.push({
        color: 'danger',
        text: `PR #${prNumber} not found for <https://github.com/${repo}|${repo}>.`
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
