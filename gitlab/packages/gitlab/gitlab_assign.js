// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

const axios = require('axios');

async function editIssue(url, issue) {
    
    return await axios.put(url, issue)
    .then(response => { return response.data; })
    .catch(error => { return error.response.data; });
}

async function _command(params, commandText, secrets = {}) {
  
  const {
    repo,
    issue_id,
    assignee_ids,
    labels = ''
  } = params;
  
  if (!secrets.gitlabToken) {
    return  {
      response_type: 'in_channel',
      text: 'Incorrect or missing personal access token!'
    };
  }
  
  var url = `https://gitlab.com/api/v4/projects/${repo.replace(/\//g, "%2F")}/issues/${issue_id}?access_token=${secrets.gitlabToken}`;
  
  var ret = await editIssue(url, params);

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: ret.message ? ret.message : ret.web_url
  };
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