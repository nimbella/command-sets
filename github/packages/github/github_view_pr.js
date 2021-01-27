// jshint esversion: 9

/**
 * @description View recent pull requests
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

let redirectURL, tokenHost, baseURL = 'https://api.github.com/'

async function _command(params, commandText, secrets = {}) {
  let tokenHost, baseURL = 'https://api.github.com'
  let { github_token: githubToken, github_repos: githubRepos, github_host } = secrets;

  githubRepos = params.repo ? params.repo : githubRepos;

  const { state = 'open' } = params;
  if (!githubRepos) {
    return {
      response_type: 'ephemeral',
      text:
        'Either pass a repo name or create a secret named `github_repos` to avoid passing the repository.'
    };
  }
  if (secrets.github_token) {
    [githubToken, tokenHost] = secrets.github_token.split('@')
  }
  githubRepos = githubRepos.split(',').map(repo => repo.trim());

  const result = [];
  const host = params.host
  const tokenMessage = githubToken
    ? ''
    : 'For greater limits, create a secret named `github_token` with a <https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line|GitHub token> using `/nc secret_create`.';

  try {
    const axios = require('axios');
    const networkRequests = [];
    baseURL = host || tokenHost || github_host || baseURL
    baseURL = updateURL(baseURL)
    if (!baseURL.includes('api')) { baseURL += '/api/v3/' }    
    for (const repo of githubRepos) {
      const url = `${baseURL}/repos/${repo}/pulls?state=${state}`;
      console.log(url)
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
      const { data, headers } = responses[i];
      result.push({
        pretext: githubRepos[i]
      });

      const requestThreshold = 3;
      const currReading = parseInt(headers['x-ratelimit-remaining']);
      if (currReading < requestThreshold) {
        result.push({
          pretext: `:warning: *You are about to reach the api rate limit.* ${tokenMessage}`
        });
      }

      // Matches <>
      const html = new RegExp(/<.*>/);
      // Show 5 recent PRs.
      for (let i = 0; i < (data.length > 5 ? 5 : data.length); i++) {
        const pr = data[i];
        const body = html.test(pr.body)
          ? `_couldn't render body of pr_`
          : pr.body
            // Convert markdown links to slack format.
            .replace(/!*\[(.*)\]\((.*)\)/g, '<$2|$1>')
            // Covert Issues mentions to links
            .replace(
              /#(\d+)/g,
              `<${getRedirectURL(baseURL)}${githubRepos[i]}/issues/$1|#$1>`
            )
            // Replace markdown headings with slack bold
            .replace(/#+\s(.+)(?:\R(?!#(?!#)).*)*/g, '*$1*');

        result.push({
          color: pr.state === 'open' ? 'good' : 'danger',
          title: `PR #${pr.number}: ${pr.title}`,
          // Convert ISO to slack format.
          text: `_Last updated on <!date^${new Date(pr.created_at).getTime() / 1000
            }^{date_short} at {time}|${pr.created_at}>_\n${body}`,
          title_link: pr.html_url
        });
      }
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

const getRedirectURL = url =>  url.replace('api.', '').replace('/api/v3', '')

const updateURL = (url) => {
  if (url.includes('|')) { url = (url.split('|')[1] || '').replace('>', '') }
  else { url = url.replace('<', '').replace('>', '') }
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

const getRedirectURL = url => redirectURL|| (redirectURL= url.replace('api.','').replace('api/v3',''))
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
    text: `Error: ${error}`
  }))
});
module.exports = main;
