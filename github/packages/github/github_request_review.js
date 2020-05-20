// jshint esversion: 9

/**
 * @description Request someone to review a pull request
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  let {github_token: githubToken, github_repos: defaultRepo} = secrets;
  if (!githubToken) {
    return {
      response_type: 'ephemeral',
      text:
        'Missing GitHub Personal Access Token! Create a secret named `github_token` with your personal access token.'
    };
  }

  // Extract the first repository.
  defaultRepo = defaultRepo.split(',').map(repo => repo.trim())[0];

  const result = [];
  const {prNumber, reviewers} = params;
  const repo = params.repo === false ? defaultRepo.trim() : params.repo.trim();
  if (!repo && !defaultRepo) {
    return {
      response_type: 'ephemeral',
      text:
        'Either pass a repo name or create a secret named `github_default_repo` to avoid passing the repository.'
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

    // Matches <anything>
    const html = new RegExp(/<.*>/);
    const body = html.test(data.body)
      ? `_couldn't render body of issue_`
      : data.body
          // Convert markdown links to slack format.
          .replace(/!*\[(.*)\]\((.*)\)/g, '<$2|$1>')
          // Covert Issues mentions to links
          .replace(/#(\d+)/g, `<https://github.com/${repo}/issues/$1|#$1>`)
          // Replace markdown headings with slack bold
          .replace(/#+\s(.+)(?:\R(?!#(?!#)).*)*/g, '*$1*');

    // output formatted text
    const getReviewers = reviewers => {
      const output = [];
      reviewers = reviewers.split(',');
      reviewers.forEach((reviewer, index) => {
        if (reviewers.length > 1 && index === reviewers.length - 1) {
          output.push(
            `and <https://github.com/${reviewer.trim()}|${reviewer.trim()}>`
          );
        } else {
          output.push(
            `<https://github.com/${reviewer.trim()}|${reviewer.trim()}>`
          );
        }
      });

      return output.join(' ');
    };

    result.push({
      color: data.state == 'open' ? 'good' : 'danger',
      text: `_Created on <!date^${
        new Date(data.created_at).getTime() / 1000
      }^{date_short} at {time}|${data.created_at}>_\n${body}`,
      title_link: data.html_url,
      title: `PR #${data.number}: ${data.title}`,
      pretext: `${getReviewers(reviewers)} has been requested to review <${
        data.html_url
      }|#${data.number}>:`
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
