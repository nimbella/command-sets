// jshint esversion: 9

const axios = require('axios')

/**
 * Function to call CircleCI API to trigger workflow.
 * @param {string} apiBaseURL 
 * @param {string} projectName 
 * @param {string} vcsType 
 * @param {string} orgName 
 * @param {string} projectToken 
 * @param {string} branchName 
 */
async function triggerWorkflow(apiBaseURL, projectName, vcsType, orgName, projectToken, branchName) {

  var URL = `${apiBaseURL}/project/${vcsType}/${orgName}/${projectName}/pipeline`;
  if (branchName !== '') {
    URL = URL + `?branch=${branchName}`;
  }
  var config = {
    method: 'post',
    url: URL,
    headers: {
      'Circle-Token': projectToken
    }
  };

  return await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      throw new Error(error.message);
    });

}

/**
 * @description Trigger workflow to run all the jobs present in it for the default or specified branch
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {

  const { projectName: projectName, branchName: branchName = '', orgName = false, __client } = params;
  const tokenKey = projectName + "_token";
  const projectToken = secrets[tokenKey];
  const vcsType = secrets.vcsType || 'gh';
  const organization = orgName != false ? orgName : secrets.orgName;
  const apiBaseURL = "https://circleci.com/api/v2";

  if (!projectToken || !vcsType || !organization) {
    return {
      response_type: 'ephemeral', // eslint-disable-line camelcase
      text: `You must create secrets for \`${tokenKey}\`, \`vcsType\`, \`orgName\` to use this command`
    };
  }

  const client = __client.name;

  try {
    const apiResponse = await triggerWorkflow(apiBaseURL, projectName, vcsType, organization, projectToken, branchName);
    const formattedResponse = `
    Workflow triggered successfully.
    Workflow number: \`${apiResponse.number}\`
    Workflow Id: \`${apiResponse.id}\`
    Workflow state: \`${apiResponse.state === 'pending' ? 'running' : apiResponse.state}\`
    Workflow triggered at: \`${apiResponse.created_at} (UTC)\`
    `;
    return {
      response_type: 'in_channel', // or `ephemeral` for private response
      text: formattedResponse
    };
  } catch (e) {
    return {
      response_type: 'in_channel', // or `ephemeral` for private response
      text: e.message
    };
  }
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    // To get more info, run `/nc activation_log` after your command executes
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
