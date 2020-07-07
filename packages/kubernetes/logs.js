// jshint esversion: 9

/**
 * @description Get logs of a pod.
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {K8_TOKEN, K8_APISERVER, K8_CA} = secrets;
  if (!K8_TOKEN || !K8_APISERVER || !K8_CA) {
    return {
      response_type: 'ephemeral',
      text:
        `Secrets named \`K8_TOKEN\`, \`K8_APISERVER\` & \`K8_CA\` with the ` +
        `access token, the address of your kubernetes cluster, and certificate ` +
        `authority data respectively are required to run this command set.`
    };
  }

  const {podName, tailLines = 25} = params;

  const https = require('https');
  const axios = require('axios');
  const {data} = await axios.get(
    `${K8_APISERVER}/api/v1/namespaces/default/pods/${podName}/log?tailLines=${tailLines}`,
    {
      httpsAgent: new https.Agent({
        ca: Buffer.from(K8_CA, 'base64')
      }),
      headers: {
        Authorization: `Bearer ${K8_TOKEN}`
      }
    }
  );

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: tailLines > 25 ? data : `\`\`\`\n${data}\`\`\``
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
    // To get more info, run `/nc activation_log` after your command executes
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
