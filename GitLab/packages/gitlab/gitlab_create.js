// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

// Sends ticket to gitLab API

const axios = require('axios');

async function sendIssue(url, issue) {
  return await axios.post(url, issue)
    .then(response => { return response.data; })
    .catch(error => { return error.response.data; });
}

async function _command(params, commandText, secrets = {}) {
  
  const {
    repo,
    title,
    description
  } = params;
  
  const issue = {
    title: title,
    description: description,
    access_token: secrets.AcessToken_GitLab,
  };
  const repoURL = repo.replace(/\//g, "%2F");
  
  // HTTP response from issue POST request
  const url = `https://gitlab.com/api/v4/projects/${repoURL}/issues?`;
  var ret = await sendIssue(url, issue);
  
  if (!ret.web_url) {
    ret.message = ret.message.error ? ret.message.error : ret.message;
  }
    
  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: ret.message ? ret.message : 
    `\`\`\`Title: ${title}
Description: ${description}
Ticket URL: ${ret.web_url}\`\`\`\n`
  };
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async ({__secrets = {}, commandText, ...params}) => ({
  body: await _command(params, commandText, __secrets).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
