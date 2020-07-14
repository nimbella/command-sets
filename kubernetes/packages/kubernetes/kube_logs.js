// jshint esversion: 9

/**
 * @description Get logs of a pod.
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {K8S_SERVER, K8S_TOKEN, K8S_CA} = secrets;
  if (!K8S_TOKEN || !K8S_SERVER || !K8S_CA) {
    return {
      response_type: 'ephemeral',
      text:
        `Secrets named \`K8S_SERVER\`, \`K8S_TOKEN\`, and \`K8S_CA\` are required to run this Command Set. ` +
        `Read <https://github.com/nimbella/command-sets/tree/master/kubernetes#requirements|this> to learn more.`
    };
  }

  const {podName, tailLines = 25, namespace = 'default'} = params;

  const https = require('https');
  const axios = require('axios');
  const {data} = await axios.get(
    `${K8S_SERVER}/api/v1/namespaces/${namespace}/pods/${podName}/log?tailLines=${tailLines}`,
    {
      httpsAgent: new https.Agent({
        ca: Buffer.from(K8S_CA, 'base64')
      }),
      headers: {
        Authorization: `Bearer ${Buffer.from(K8S_TOKEN, 'base64')}`
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
