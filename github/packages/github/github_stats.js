// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

const axios = require('axios');

async function getRequest(url) {

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: await axios.get(url)
    .then(response => { return response.data; })
    .catch(error => { return error.response.data; })
  };
}

async function _command(params, commandText, secrets = {}) {
    
  if (!secrets.github_token) {
    return {
      response_type: 'in_channel',
      text: 'Missing GitHub Personal Access Token!'
    };
  }
  const {
    repo
  } = params;
  const url = `https://api.github.com/repos/${repo}`;
  const data = await getRequest(url);
  
  if (data.response) {
    return {
      response_type: 'in_channel',
      text: data.response.headers.status
    };
  } else {
    return { attachments: [{
      color: 'good',
      title: `Most used langauge: ${data.text.language}
Default Branch: ${data.text.default_branch}
Collaborators: ${data.text.network_count}
Open Issues Count: ${data.text.open_issues_count}
Forks: ${data.text.forks}
Watchers: ${data.text.subscribers_count}
Stars: ${data.text.stargazers_count}`,
      title_link: data.text.html_url,
      pretext: `${data.text.full_name} statistics`
    }] };
  }
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;