'use strict';

/**
 * @description Assign an issue to a user.
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
  let {issueId, userName} = params;
  issueId = issueId.toUpperCase();

  const axios = require('axios');
  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${jiraUserEmail}:${jiraApiKey}`
    ).toString('base64')}`,
    Accept: 'application/json'
  };

  // Get the accountId of the user
  const {data: users} = await axios.get(
    jiraOrgUrl +
      `/rest/api/3/user/assignable/search?query=${userName}&issueKey=${issueId}`,
    {headers}
  );

  if (users.length === 0) {
    return {
      response_type: 'ephemeral',
      text: `We couldn't find any user with the provided name: *${userName}*`
    };
  } else if (users.length > 1) {
    const output = ['We found more than one user with the provided name:'];
    for (const user of users) {
      output.push(`\`${user.displayName}\``);
    }
    output.push(
      'Please provide full display name of the user to narrow down the result.'
    );

    return {
      response_type: 'ephemeral',
      text: output.join('\n')
    };
  }

  // Assign issue to the user.
  const {status} = await axios.put(
    jiraOrgUrl + `/rest/api/3/issue/${issueId}/assignee`,
    {
      accountId: users[0].accountId
    },
    {headers}
  );

  if (status === 204) {
    result.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Assigned <${jiraOrgUrl}/browse/${issueId}|${issueId}> to *${users[0].displayName}*`
        }
      ]
    });
  } else {
    result.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Failed to assign <${jiraOrgUrl}/browse/${issueId}|${issueId}> to *${users[0].displayName}*`
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
