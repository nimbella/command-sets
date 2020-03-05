// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

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

function fetchUsers(url) {
  
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url, false );
    xmlHttp.send( null );
    return JSON.parse(xmlHttp.responseText);
  }
  
  async function _command(params, commandText, secrets = {}) {
    
    if (!XMLHttpRequest) {
      let packages = [ 'xmlhttprequest' ];
      await install(packages);
      XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    }
    
    const {
      repo,
      name = ''
    } = params;
    
    var text = '';
    var repoURL = `https://gitlab.com/api/v4/projects/${repo.replace(/\//g, "%2F")}/users`;
    var users = fetchUsers(repoURL);
    
    if (users.length) {
      // If name is povided parse for users with a matching name
      if (name) {
        users = users.filter((user) => {
          return user.name.toLowerCase().includes(name.toLowerCase());
        });
      }
      // Formatting text
      users.forEach((user) => {
        text += `ID: ${user.id} | Name: ${user.name} | Username: ${user.username} | URL: ${user.web_url}\n`;
      });
      if (!text)
        text = 'No users found.';
  }
    return {
      response_type: 'in_channel', // or `ephemeral` for private response
      text: text ? `\`\`\`${text}\`\`\`\n` : users.message
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
  