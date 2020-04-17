// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
const axios = require('axios');

const requestThreshold = 3;
const headers = {
  'Content-Type': 'application/json',
};
async function getRequest(url, secrets) {
  if (secrets.github_token) headers.Authorization = `Bearer ${secrets.github_token}`;
  return (axios({
    method: 'get',
    url,
    headers,
  }).then((res) => res).catch((err) => err));
}

const section = (text) => ({
  type: 'section',
  text: {
    type: 'mrkdwn',
    text,
  },
});

const fail = (msg) => {
  const response = {
    response_type: 'in_channel',
    blocks: [section(`${msg || '*couldn\'t get to the pull requests*'}`)],
  };
  return response;
};


async function command(params, commandText, secrets = {}) {
  const {
    repo
  } = params;
  const url = `https://api.github.com/repos/${repo}/pulls?state=all`;

  const res = await getRequest(url, secrets);

  if (res && res.data) {
    const tokenMessage = secrets.github_token ? '' : '*For greater limits you can add <https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line | secrets> using*\n `/nc secret_create`';
    const currReading = parseInt(res.headers['x-ratelimit-remaining']);
    let header;
    if (currReading < requestThreshold) {
      header = `:warning: *You are about to reach the api rate limit.* ${tokenMessage}`;
    }
    if (currReading === 0) {
      header = `:warning: *The api rate limit has been exhausted.* ${tokenMessage}`;
      return fail(header);
    }
    const pr = res.data;
    const attachments = [];

    for (let i = 0; i < pr.length && i < 10; i++) {
      attachments.push({
        color: pr[i].state == 'open' ? 'good' : 'danger',
        title: pr[i].body && !pr[i].body.includes('http') ? pr[i].body : 'Link',
        title_link: pr[i].html_url,
        pretext: `Issue #${pr[i].number}: ${pr[i].title}\nID: ${pr[i].id} Date Created: ${pr[i].created_at}`
      });
    }
    if (attachments.length > 0) {
      if (header) attachments.unshift({ pretext: header });
      return {
        attachments,
      };
    }
    return fail(`No pull requests could be found`);
  }
  return fail();
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async (args) => ({
  body: await command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
