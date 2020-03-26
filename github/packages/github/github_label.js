// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
const axios = require('axios');

async function patchRequest(url, secrets, labels) {

    return (axios({
        method: "patch",
        url: url,
        data: {labels: labels},
        headers: {
            Authorization: `Bearer ${secrets.github_token}`,
            "Content-Type": "application/json"
        }})
        .then(res => { return res.data; })
        .catch(err => { return err; }));
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
    number,
    labels
  } = params;
  const url = `https://api.github.com/repos/${repo}/issues/${number}`;
  const data = await patchRequest(url, secrets, labels.split(', '));
  
  if (data.response) {
    return {
      response_type: 'in_channel',
      text: data.response.headers.status
    };
  } else {
    return { attachments: [{
      color: 'good',
      title: `${data.title}\n${data.body && !data.body.includes('http') ? data.body : 'Link'}\nLabels: ${labels}`,
      title_link: data.html_url,
      pretext: `${labels.split(', ').length} Labels created for ${repo} issue #${number}`
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
