/**
 * @description Assigns an issue to a user.
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

  const {issueId, userName} = params;

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
      `/rest/api/3/user/assignable/search?query=${userName}&issueKey=${String(
        issueId
      ).toUpperCase()}`,
    {headers}
  );

  if (users.length > 1) {
    const output = ['We found more than one user with the provided name:'];
    for (const user of users) {
      output.push(`\`${user.displayName}\``);
    }
    output.push(
      'Please provide full name of the user to narrow down the result.'
    );

    return {
      response_type: 'ephemeral',
      text: output.join('\n')
    };
  }

  // Assign issue to the user.
  const {status} = await axios.put(
    jiraOrgUrl + `/rest/api/3/issue/${String(issueId).toUpperCase()}/assignee`,
    {
      accountId: users[0].accountId
    },
    {headers}
  );

  if (status === 204) {
    return {
      response_type: 'in_channel',
      text: `Assigned \`${issueId}\` to \`${users[0].displayName}\`.`
    };
  }
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
