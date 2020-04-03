/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {ibmApiKey, ibmNamespaceId, ibmRegionCode = 'eu-gb'} = secrets;
  if (!ibmApiKey) {
    return {
      response_type: 'ephemeral',
      text: `We need a secret named \`ibmApiKey\` to run this command. Create one using \`/nc secret_create\``
    };
  }

  const {namespaceId = ibmNamespaceId, activationId, __client} = params;
  if (!namespaceId) {
    return {
      response_type: 'ephemeral',
      text: `Namespace ID couldn't be found. Please pass the namespace id as the second parameter to the command or create a secret named \`ibmNamespaceId\`.`
    };
  }

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

  const baseURL = `https://${ibmRegionCode}.functions.cloud.ibm.com/api/v1`;
  const {
    data: {logs}
  } = await axios.get(
    `${baseURL}/namespaces/${namespaceId}/activations/${activationId}/logs`,
    {
      headers: {
        authorization: token_type + ' ' + access_token,
        accept: 'application/json'
      }
    }
  );

  if (logs.length === 0) {
    return {
      response_type: 'in_channel',
      text: "We couldn't find any logs under this activation."
    };
  }

  let logsOutput = [];
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i].split(/(stdout:|stderr:)/)[2];
    logsOutput.push(log);

    if (i !== 0 && i % 30 === 0) {
      axios.post(__client.response_url, {
        type: 'in_channel',
        text: `\`\`\` ${logsOutput.join('\n')} \`\`\``
      });
      logsOutput = [];
    }
  }

  return {
    response_type: 'in_channel',
    text: logsOutput.length >= 1 ? `\`\`\`${logsOutput.join('\n')}\`\`\`` : ''
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
