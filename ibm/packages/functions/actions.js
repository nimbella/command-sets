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

  const {namespaceId = ibmNamespaceId, skip = 0} = params;
  if (!namespaceId) {
    return {
      response_type: 'ephemeral',
      text: `Namespace ID couldn't be found. Please pass the namespace as parameter to the command or create a secret named \`ibmNamespaceId\`.`
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

  const baseURL = `https://${ibmRegionCode}.functions.cloud.ibm.com/api/v1`;
  const {data} = await axios.get(
    `${baseURL}/namespaces/${namespaceId}/actions?limit=20&skip=${Number(
      skip
    )}`,
    {
      headers: {
        authorization: token_type + ' ' + access_token,
        accept: 'application/json'
      }
    }
  );

  for (const action of data) {
    result.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Name: ${action.name}`
        },
        {
          type: 'mrkdwn',
          text: `${action.annotations[0].value}`
        },
        {
          type: 'mrkdwn',
          text: `Last updated: \`${
            new Date(action.updated)
              .toISOString()
              .replace('T', ' ')
              .split('.')[0]
          }\``
        },
        {
          type: 'mrkdwn',
          text: `Limits: \`timeout: ${action.limits.timeout}ms memory: ${action.limits.memory}MB\``
        }
      ]
    });
  }

  result.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Powered by <https://nimbella.com/product/commander|Nimbella Commander>.`
      }
    ]
  });

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
