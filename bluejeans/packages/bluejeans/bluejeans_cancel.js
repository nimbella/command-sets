'use strict';

/**
 * @description undefined
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params = {}, commandText, secrets = {}) {
  const {bluejeansAppKey, bluejeansAppSecret} = secrets;
  if (!bluejeansAppKey || !bluejeansAppSecret) {
    return {
      response_type: 'ephemeral',
      text: `You need secrets \`bluejeansAppKey\` & \`bluejeansAppSecret\` to be able to run this command.`
    };
  }

  const result = [];
  const baseURL = `https://api.bluejeans.com`;
  const {meetingId, cancellationMessage} = params;
  const axios = require('axios');

  // Fetch access token
  const {data} = await axios.post(baseURL + '/oauth2/token?Client', {
    grant_type: 'client_credentials',
    client_id: bluejeansAppKey,
    client_secret: bluejeansAppSecret
  });

  // Fetch users
  const {
    data: {users}
  } = await axios.get(
    baseURL +
      `/v1/enterprise/${data.scope.enterprise}/users?access_token=${data.access_token}`
  );

  // Cancel a meeting
  let requestURL = baseURL + users[0].uri + `/scheduled_meeting/${meetingId}`;
  requestURL += `?email=true&cancellationMessage=${encodeURI(
    cancellationMessage
  )}&access_token=${data.access_token}`;

  const {status} = await axios.delete(requestURL);
  if (status === 200) {
    result.push(`Successfully cancelled the meeting (ID: \`${meetingId}\`).`);
  }

  return {
    response_type: 'in_channel', // eslint-disable-line camelcase
    text: result.join('\n')
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
module.exports.main = main;
