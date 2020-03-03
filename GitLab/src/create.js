// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

// Sends ticket to gitLab API

var XMLHttpRequest;

async function install(pkgs) {
  
  pkgs = pkgs.join(' ');
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec(`npm install ${pkgs}`, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
function sendIssue(url) {
    
    var responseText;
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    xhr = new XMLHttpRequest();
    xhr.open("POST", url, false);
    xhr.onload = () => { responseText = JSON.parse(xhr.responseText); };
    xhr.send( null );
    return responseText;
}

async function _command(params, commandText, secrets = {}) {
  if (!XMLHttpRequest) {
    let packages = [ 'xmlhttprequest' ];
    await install(packages);
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  }
  const {
    repo,
    title,
    description
  } = params;
  
  const repoURL = repo.replace(/\//g, "%2F");
  const url = `https://gitlab.com/api/v4/projects/${repoURL}/issues?access_token=${secrets.AcessToken_GitLab}&title=${title}&description=${description}`;
  // HTTP response from issue POST request
  const issuePostResponse = sendIssue(url);
  var error;
  if (!issuePostResponse.web_url)
    error = issuePostResponse.message.error ? issuePostResponse.message.error : issuePostResponse.message;
  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: error ? error : 
    `\`\`\`Title: ${title}
Description: ${description}
Ticket URL: ${issuePostResponse.web_url}\`\`\`\n`
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
