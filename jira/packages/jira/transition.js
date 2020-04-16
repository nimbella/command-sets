'use strict';

/**
 * @description Transition an issue.
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {jiraOrgUrl, jiraApiKey, jiraUserEmail} = secrets;
  if (!jiraOrgUrl || !jiraApiKey || !jiraUserEmail) {
    return {
      response_type: 'ephemeral',
      text: `We need secrets named \`jiraOrgUrl\`, \`jiraApiKey\`, and \`jiraUserEmail\` to run this command. Create them by running \`/nc secret_create\`.`
    };
  }

  const result = [];
  let {issueId, columnName} = params;
  issueId = issueId.toUpperCase();

  const axios = require('axios');
  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${jiraUserEmail}:${jiraApiKey}`
    ).toString('base64')}`,
    Accept: 'application/json'
  };

  // Get transistion ID
  let transitionDetails;
  const {
    data: {transitions}
  } = await axios.get(jiraOrgUrl + `/rest/api/3/issue/${issueId}/transitions`, {
    headers
  });
  for (const transition of transitions) {
    if (
      columnName.toLowerCase().trim() === transition.name.toLowerCase() &&
      transition.isAvailable
    ) {
      transitionDetails = transition;
    }
  }

  if (transitions.length === 0) {
    return {
      response_type: 'ephemeral',
      text: `We couldn't find any columns with the provided name: *${columnName}*`
    };
  }

  // Transistion the issue.
  const {status} = await axios.post(
    jiraOrgUrl + `/rest/api/3/issue/${issueId}/transitions`,
    {
      transition: {
        id: transitionDetails.id
      }
    },
    {
      headers
    }
  );

  if (status === 204) {
    result.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Transitioned <${jiraOrgUrl}/browse/${issueId}|${issueId}> to *${transitionDetails.name}*`
        }
      ]
    });
  } else {
    result.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Failed to transition <${jiraOrgUrl}/browse/${issueId}|${issueId}> to *${transitionDetails.name}*`
        }
      ]
    });
  }

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    blocks: result
  };
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */
const main = async args => ({
  body: await _command(
    args.params,
    args.commandText,
    args.__secrets || {}
  ).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
