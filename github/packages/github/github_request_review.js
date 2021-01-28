// jshint esversion: 9

/**
 * @description Request someone to review a pull request
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

let redirectURL, tokenHost, baseURL = 'https://api.github.com/'

async function _command(params, commandText, secrets = {}) {
  let { github_token: githubToken, github_repos: defaultRepo = '', github_host } = secrets;
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
  const { prNumber, reviewers, host } = params;
  const repo = params.repo === false ? defaultRepo.trim() : params.repo.trim();
  if (!repo && !defaultRepo) {
    return {
      response_type: 'ephemeral',
      text:
        'Either pass a repo name or create a secret named `github_repos` to avoid passing the repository.'
    };
  }

  try {
    baseURL = host || tokenHost || github_host || baseURL
    baseURL = updateURL(baseURL)
    const url = `${baseURL}repos/${repo}/pulls/${prNumber}/requested_reviewers`;
    const axios = require('axios');
    const { data } = await axios({
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
        .replace(/#(\d+)/g, `<${getRedirectURL(baseURL)}${repo}/issues/$1|#$1>`)
        // Replace markdown headings with slack bold
        .replace(/#+\s(.+)(?:\R(?!#(?!#)).*)*/g, '*$1*');

    // output formatted text
    const getReviewers = reviewers => {
      const output = [];
      reviewers = reviewers.split(',');
      reviewers.forEach((reviewer, index) => {
        if (reviewers.length > 1 && index === reviewers.length - 1) {
          output.push(
            `and <${getRedirectURL(baseURL)}${reviewer.trim()}|${reviewer.trim()}>`
          );
        } else {
          output.push(
            `<${getRedirectURL(baseURL)}${reviewer.trim()}|${reviewer.trim()}>`
          );
        }
      });

      return output.join(' ');
    };

    result.push({
      color: data.state == 'open' ? 'good' : 'danger',
      text: `_Created on <!date^${new Date(data.created_at).getTime() / 1000
        }^{date_short} at {time}|${data.created_at}>_\n${body}`,
      title_link: data.html_url,
      title: `PR #${data.number}: ${data.title}`,
      pretext: `${getReviewers(reviewers)} has been requested to review <${data.html_url
        }|#${data.number}>:`
    });
  } catch (error) {
    result.push({
      color: 'danger',
      text: getErrorMessage(error, 'PR', prNumber, getRedirectURL(baseURL), repo)
    });
  }

  return {
    response_type: 'in_channel',
    attachments: result
  };
}

const getRedirectURL = url => redirectURL || (redirectURL = url.replace('api.', '').replace('api/v3', ''))

const updateURL = (url) => {
  if (!url.startsWith('http')) { url = 'https://' + url; }
  if (!url.includes('api')) { url += '/api/v3/'; }
  return url
}

const getErrorMessage = (error, entityType, entityNumber, probeURL, displayLink) => {
  console.error(error)
  if (error.response && error.response.status === 403) {
    return `:warning: *The api rate limit has been exhausted.*`
  } else if (error.response && error.response.status === 404) {
    return `${entityType} #${entityNumber} not found for <${probeURL}${displayLink}|${displayLink}>.`
  }
  else if (error.response && error.response.status && error.response.data) {
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
