// jshint esversion: 9

function formatDate(d) {
  const date = new Date(d);
  let dd = date.getDate();
  let mm = date.getMonth() + 1;
  let yyyy = date.getFullYear();

  if (dd < 10) {
    dd = `0${dd}`;
  }
  if (mm < 10) {
    mm = `0${mm}`;
  }
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {github_token: githubToken, github_default_repo: defaultRepo} = secrets;
  const repo = params.repo === false ? defaultRepo.trim() : params.repo.trim();
  if (!repo && !defaultRepo) {
    return {
      response_type: 'ephemeral',
      text:
        'Either pass a repo name or create a secret named `github_default_repo` to avoid passing the repository.',
    };
  }

  const result = [];
  const {state = 'closed', date} = params;

  const tokenMessage = githubToken
    ? ''
    : 'For greater limits, create a secret named `github_token` with a <https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line|GitHub token> using `/nc secret_create`.';

  try {
    const url = `https://api.github.com/repos/${repo}/pulls?state=${state}`;
    const axios = require('axios');
    const {data} = await axios({
      method: 'GET',
      url: url,
      headers: githubToken
        ? {
            Authorization: `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
          }
        : {},
    });

    const requestThreshold = 3;
    const currReading = parseInt(headers['x-ratelimit-remaining']);
    if (currReading < requestThreshold) {
      result.push({
        pretext: `:warning: *You are about to reach the api rate limit.* ${tokenMessage}`,
      });
    }

    // Matches html tags
    const html = new RegExp(/<.*>.*<\/.*>/);
    for (const pr of data) {
      if (formatDate(pr.updated_at) == date) {
        const body = html.test(pr.body)
          ? `_couldn't render body of pr_`
          : pr.body
              // Convert markdown links to slack format.
              .replace(/!*\[(.*)\]\((.*)\)/g, '<$2|$1>')
              // Covert Issues mentions to links
              .replace(/#(\d+)/g, `<https://github.com/${repo}/issues/$1|#$1>`)
              // Replace markdown headings with slack bold
              .replace(/#+\s(.+)(?:\R(?!#(?!#)).*)*/g, '*$1*');

        result.push({
          color: pr.state == 'open' ? 'good' : 'danger',
          text: `_Last updated on <!date^${
            new Date(pr.updated_at).getTime() / 1000
          }^{date_short} at {time}|${pr.updated_at}>_\n${body}`,
          title_link: pr.html_url,
          title: `PR #${pr.number}: ${pr.title}`,
        });
      }
    }

    if (result.length === 0) {
      return {
        response_type: 'in_channel',
        text: `No pull requests that were last updated on ${date} could be found`,
      };
    }
  } catch (error) {
    if (error.response.status === 403) {
      result.push({
        color: 'danger',
        text: `:warning: *The api rate limit has been exhausted.* ${tokenMessage}`,
      });
    } else {
      result.push({
        color: 'danger',
        text: `Error: ${error.response.status} ${error.response.data.message}`,
      });
    }
  }

  return {
    response_type: 'in_channel',
    attachments: result,
  };
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */
const main = async (args) => ({
  body: await _command(
    args.params,
    args.commandText,
    args.__secrets || {}
  ).catch((error) => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`,
  })),
});
module.exports = main;
