// jshint esversion: 9

const axios = require('axios')

/**
 * A small function that converts slack elements `context` and `section` to mattermost compatible markdown.
 * @param {object} element - Slack element
 * @param {string} client - name of the client
 */
const mui = (element, client) => {
  const output = [];
  if (client === 'slack') {
    return element;
  } else {
    if (element.type === 'context') {
      for (const item of element.elements) {
        output.push(item.text.replace(/\*/g, '**'));
      }
    } else if (element.type === 'section') {
      output.push(element.text.text.replace(/\*/g, '**'));
    }
  }

  return output.join(' ');
};

/**
 * Function to call CircleCI API to trigger workflow.
 * @param {string} apiBaseURL 
 * @param {string} projectName 
 * @param {string} vcsType 
 * @param {string} orgName 
 * @param {string} projectToken 
 * @param {string} workflowName 
 */
async function getWorkflowList(apiBaseURL, projectName, vcsType, orgName, projectToken, workflowName) {

  const URL = `${apiBaseURL}/insights/${vcsType}/${orgName}/${projectName}/workflows/${workflowName}`;
  var config = {
    method: 'get',
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
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {

  const { projectName: projectName, workflowName: workflowName, __client } = params;
  const tokenKey = projectName + "_token";
  const projectToken = secrets[tokenKey];
  const vcsType = secrets.vcsType;
  const orgName = secrets.orgName;
  const apiBaseURL = "https://circleci.com/api/v2";

  if (!projectToken || !vcsType || !orgName) {
    return {
      response_type: 'ephemeral', // eslint-disable-line camelcase
      text: `You must create secrets for \`${tokenKey}\`, \`vcsType\`, \`orgName\` to use this command`
    };
  }

  const client = __client.name;

  try {
    const apiResponse = await getWorkflowList(apiBaseURL, projectName, vcsType, orgName, projectToken, workflowName);
    const result = [];
    apiResponse.items.slice(0, 5).forEach(item => {
      result.push(
        mui(
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `
Workflow Id: \`${item.id}\`
Workflow run duration: \`${item.duration}\`
Workflow status: \`${item.status}\`
Workflow started at: \`${item.created_at} (UTC)\`
Workflow stopped st: \`${item.stopped_at} (UTC)\`
              `
            }
          },
          client
        )
      );
    });
    return {
      response_type: 'in_channel', // or `ephemeral` for private response
      [client === 'slack' ? 'blocks' : 'text']:
      client === 'slack' ? result : result.join('\n')
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
