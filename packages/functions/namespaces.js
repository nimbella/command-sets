/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {ibmApiKey} = secrets;
  if (!ibmApiKey) {
    return {
      response_type: 'ephemeral',
      text: `We need a secret named \`ibmApiKey\` to run this command. Create one using \`/nc secret_create\``
    };
  }

  const result = [];
  const axios = require('axios');

  // Get the access token.
  const body = `grant_type=${encodeURIComponent(
    'urn:ibm:params:oauth:grant-type:apikey'
  )}&apikey=${encodeURIComponent(ibmApiKey)}`;
  const {
    data: {access_token, token_type}
  } = await axios.post('https://iam.cloud.ibm.com/identity/token', body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    }
  });

  // TODO: Support different regions.
  const baseURL = 'https://eu-gb.functions.cloud.ibm.com/api/v1';
  const {
    data: {namespaces}
  } = await axios.get(baseURL + `/namespaces`, {
    headers: {
      authorization: token_type + ' ' + access_token,
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
