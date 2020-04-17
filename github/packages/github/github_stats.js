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
    blocks: [section(`${msg || '*couldn\'t get the stats*'}`)],
  };
  return response;
};

async function command(params, commandText, secrets = {}) {
  const {
    repo,
  } = params;
  const url = `https://api.github.com/repos/${repo}`;
  const res = await getRequest(url, secrets);

  if (res && res.data) {
    const { data } = res;
    const tokenMessage = secrets.github_token ? '' : '*For greater limits you can add <https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line | secrets> using*\n `/nc secret_create`';
    const currReading = parseInt(res.headers['x-ratelimit-remaining']);
    let header = `${data.full_name} statistics`;
    if (currReading < requestThreshold) {
      header = `:warning: *You are about to reach the api rate limit.* ${tokenMessage}`;
    }
    if (currReading === 0) {
      header = `:warning: *The api rate limit has been exhausted.* ${tokenMessage}`;
      return fail(header);
    }
    return {
      attachments: [{
        color: 'good',
        title: `Most used langauge: ${data.language}
Default Branch: ${data.default_branch}
Collaborators: ${data.network_count}
Open Issues Count: ${data.open_issues_count}
Forks: ${data.forks}
Watchers: ${data.subscribers_count}
Stars: ${data.stargazers_count}`,
        title_link: data.html_url,
        pretext: header,
      }],
    };
  }
  return fail();
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async (args) => ({
  body: await command(args.params, args.commandText, args.__secrets || {}).catch((error) => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`,
  })),
});
module.exports = main;
