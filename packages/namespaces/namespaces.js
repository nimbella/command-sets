/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {ibmIAMToken} = secrets;
  if (!ibmIAMToken) {
    return {
      response_type: 'ephemeral',
      text: `We need a secret named \`ibmIAMToken\` to run this command. Create one using \`/nc secret_create\``
    };
  }

  // TODO: Support different regions.
  const baseURL = 'https://eu-gb.functions.cloud.ibm.com/api/v1';
  const result = [];
  const axios = require('axios');
  const {
    data: {namespaces}
  } = await axios.get(baseURL + `/namespaces`, {
    headers: {
      authorization: ibmIAMToken,
      accept: 'application/json'
    }
  });

  for (const namespace of namespaces) {
    const namespaceOutput = {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `ID: \`${namespace.id}\``
        },
        {
          type: 'mrkdwn',
          text: `Location: \`${namespace.location}\``
        }
      ]
    };

    if (namespace.name) {
      namespaceOutput.elements.push({
        type: 'mrkdwn',
        text: `*${namespace.name}*`
      });
    }

    result.push(namespaceOutput);
  }

  return {
    response_type: 'in_channel',
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
