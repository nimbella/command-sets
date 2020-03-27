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

function formatDate(d) {
    
  const date = new Date(d);
  let dd = date.getDate(); 
  let mm = date.getMonth()+1;
  let yyyy = date.getFullYear();
  
  if (dd < 10) {
    dd = `0${dd}`;
  }
  if (mm < 10) {
    mm = `0${mm}`;
  }
  return `${mm}/${dd}/${yyyy}`;
}

async function _command(params, commandText, secrets = {}) {
    
  if (!secrets.github_token) {
    return {
      response_type: 'in_channel',
      text: 'Missing Github Personal Access Token!'
    };
  }
  const {
    repo,
    state,
    date
  } = params;

  const url = `https://api.github.com/repos/${repo}/pulls?state=closed`;
  const data = await getRequest(url);

  if (data.response) {
    return {
      response_type: 'in_channel',
      text: data.response.headers.status
    };
  } else {
    const pr = data.text;
    const attachments = [];
    
    for (let i = 0, j = 0; i < pr.length; i++) {
      if (formatDate(pr[i].updated_at) == date) {
        attachments.push({
          color: pr[i].state == 'open' ? 'good' : 'danger',
          title: pr[i].body && !pr[i].body.includes('http') ? pr[i].body : 'Link',
          title_link: pr[i].html_url,
          pretext: `Pull Request #${pr[i].number}: ${pr[i].title}\nID: ${pr[i].id} Date Created: ${pr[i].created_at}`
        });
      }
    }
    if (attachments.length > 0) {
      return { attachments: attachments };
    } else {
      return {
        response_type: 'in_channel',
        text: `No pull requests that were last updated on ${date} could be found`
      };
    }
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
