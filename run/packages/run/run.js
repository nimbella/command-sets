'use strict';

/**
 * @description Runs slash commands
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {mmURL, mmToken} = secrets;
  if (!mmURL || !mmToken) {
    return {
      response_type: 'ephemeral',
      text:
        `You need to create secrets named \`mmURL\` & \`mmToken\` with your mattermost ` +
        `server URL & API token. Create secrets by running \`/nc secret_create\``
    };
  }

  const {varArgs, __client} = params;
  const requestEndpoint = `${mmURL}/api/v4/commands/execute`;

  try {
    const axios = require('axios');
    await axios({
      method: 'POST',
      url: requestEndpoint,
      data: {
        channel_id: __client.channel_id,
        command: varArgs.startsWith('/') ? varArgs : '/' + varArgs
      },
      headers: {
        Authorization: `Bearer ${mmToken}`
      }
    });
  } catch (error) {
    return {
      response_type: 'in_channel',
      text: error.message
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
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
