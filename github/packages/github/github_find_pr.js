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

function normalizeDate(date) {
  if (date.trim().length === 8) {
    const arr = date.split('/');
    arr[arr.length - 1] = '20' + arr[arr.length - 1];

    return arr.join('/');
  } else {
    return date;
  }
}

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  let {github_token: githubToken, github_repos: githubRepos} = secrets;
  githubRepos = params.repo ? params.repo : githubRepos;
  if (!githubRepos) {
    return {
      response_type: 'ephemeral',
      text:
        'Either pass a repo name or create a secret named `github_default_repo` to avoid passing the repository.'
    };
  }

  githubRepos = githubRepos.split(',').map(repo => repo.trim());

  const result = [];
  let {state = 'all', date} = params;

  date = normalizeDate(date);

  const tokenMessage = githubToken
    ? ''
    : 'For greater limits, create a secret named `github_token` with a <https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line|GitHub token> using `/nc secret_create`.';

  try {
    const axios = require('axios');
    const networkRequests = [];
    for (const repo of githubRepos) {
      const url = `https://api.github.com/repos/${repo}/pulls?state=${state}`;
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
    for (let i = 0; i < responses.length; i++) {
      const {data, headers} = responses[i];
      const repo = githubRepos[i];

      const requestThreshold = 3;
      const currReading = parseInt(headers['x-ratelimit-remaining']);
      if (currReading < requestThreshold) {
        result.push({
          pretext: `:warning: *You are about to reach the api rate limit.* ${tokenMessage}`
        });
      }

      result.push({
        pretext: `*${repo}*`
      });

      // Matches html tags
      const html = new RegExp(/<.*>.*<\/.*>/);
      const prs = [];
      for (const pr of data) {
        if (formatDate(pr.updated_at) === date) {
          const body = html.test(pr.body)
            ? `_couldn't render body of pr_`
            : pr.body
                // Convert markdown links to slack format.
                .replace(/!*\[(.*)\]\((.*)\)/g, '<$2|$1>')
                // Covert Issues mentions to links
                .replace(
                  /#(\d+)/g,
                  `<https://github.com/${repo}/issues/$1|#$1>`
                )
                // Replace markdown headings with slack bold
                .replace(/#+\s(.+)(?:\R(?!#(?!#)).*)*/g, '*$1*');

          prs.push({
            color: pr.state == 'closed' ? 'danger' : 'good',
            text: `_Last updated on <!date^${
              new Date(pr.updated_at).getTime() / 1000
            }^{date_short} at {time}|${pr.updated_at}>_\n${body}`,
            title_link: pr.html_url,
            title: `PR #${pr.number}: ${pr.title}`
          });
        }
      }

      if (prs.length === 0) {
        result.push({
          pretext: `Couldn't find any PRs that are updated on *${date}*`
        });
      } else {
        result.push(...prs);
      }
    }

    if (result.length === 0) {
      return {
        response_type: 'in_channel',
        text: `No pull requests that were last updated on ${date} could be found`
      };
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
      result.push({
        color: 'danger',
        text: `:warning: *The api rate limit has been exhausted.* ${tokenMessage}`
      });
    } else if (error.response) {
      result.push({
        color: 'danger',
        text: `Error: ${error.response.status} ${error.response.data.message}`
      });
    } else {
      result.push({
        color: 'danger',
        text: `Error: ${JSON.stringify(error)}`
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
