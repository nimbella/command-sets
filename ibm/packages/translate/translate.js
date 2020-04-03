/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {text, targetlanguage} = params;
  const {ibmLanguageTranslatorCredentials} = secrets;
  if (!ibmLanguageTranslatorCredentials) {
    return {
      response_type: 'ephemeral',
      text: `We need a secret named \`ibmLanguageTranslatorCredentials\` to run this command. Create using \`/nc secret_create\``
    };
  }

  const {apikey, url} = JSON.parse(ibmLanguageTranslatorCredentials);
  const axios = require('axios');

  const {data} = await axios.post(
    url + '/v3/translate?version=2018-05-01',
    {
      text: text,
      target: targetlanguage
    },
    {
      auth: {
        username: 'apikey',
        password: apikey
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: data.translations[0].translation
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
