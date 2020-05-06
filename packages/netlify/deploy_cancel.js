// jshint esversion: 9

/**
 * @description Access all deploys of a site.
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {netlifyToken} = secrets;
  if (!netlifyToken) {
    return {
      response_type: 'ephemeral',
      text:
        'A secret named `netlifyToken` is required to run this command. Grab your Netlify token and run `/nc secret_create` to get a link to the secret creator.'
    };
  }

  const {deployId} = params;

  const axios = require('axios');
  const result = [];

  try {
    const URL = `https://api.netlify.com/api/v1/deploys/${deployId}/cancel?access_token=${netlifyToken}`;
    const {data} = await axios.post(URL);

    result.push({
      title: data.title,
      text: `State: \`${data.state}\`\nSkipped: \`${data.skipped}\``
    });
  } catch (error) {
    result.push({
      color: 'danger',
      text: `Error: ${error.message}`
    });
  }

  return {
    response_type: 'in_channel',
    attachments: result
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
