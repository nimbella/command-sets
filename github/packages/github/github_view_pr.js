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
  const url = `https://api.github.com/repos/${repo}/pulls?state=all`;
  const data = await getRequest(url);
  
  if (data.response) {
    return {
      response_type: 'in_channel',
      text: data.response.headers.status
    };
  } else {
    
    const pr = data.text;
    const attachments = [];
    
    for (let i = 0; i < pr.length && i < 10; i++) {
        attachments.push({
          color: pr[i].state == 'open' ? 'good' : 'danger',
          title: pr[i].body && !pr[i].body.includes('http') ? pr[i].body : 'Link',
          title_link: pr[i].html_url,
          pretext: `Issue #${pr[i].number}: ${pr[i].title}\nID: ${pr[i].id} Date Created: ${pr[i].created_at}`
        });
    }
    return { attachments };
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
