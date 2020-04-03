/**
 * Parse the given string to return a parameters object.
 * @example
 * // returns { name: 'Satya', human: true}
 * getParams('-name Satya -human');
 * @param {varArgs} string
 */
function getParams(string = '') {
  const object = {};

  for (const str of string.split('-')) {
    if (str === '') {
      continue;
    }

    // `name "Satya Rohith"` => ["name", "Satya Rohith"]
    const [key, value] = str
      .trim()
      .replace(' ', '<kvseperator>')
      .split('<kvseperator>');
    if (value === undefined) {
      object[key] = true;
    } else if (value.startsWith('"') || value.startsWith("'")) {
      object[key] = value.slice(1, -1);
    } else {
      object[key] = value;
    }
  }

  return object;
}

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

  const {namespaceId = ibmNamespaceId, actionName, varArgs} = params;
  if (!namespaceId) {
    return {
      response_type: 'ephemeral',
      text: `Namespace ID couldn't be found. Please pass the namespace as parameter to the command or create a secret named \`ibmNamespaceId\`.`
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

  // Invoke the function
  const baseURL = `https://${ibmRegionCode}.functions.cloud.ibm.com/api/v1`;
  const {data} = await axios.post(
    `${baseURL}/namespaces/${namespaceId}/actions/${actionName}?blocking=true&result=true`,
    getParams(varArgs),
    {
      headers: {
        authorization: token_type + ' ' + access_token,
        accept: 'application/json',
        'content-type': 'application/json'
      }
    }
  );

  return {
    response_type: 'in_channel',
    text: `\`\`\`${JSON.stringify(data, null, 2)} \`\`\``
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
