/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {text} = params;
  const {ibmToneAnalyzerCredentials} = secrets;
  if (!ibmToneAnalyzerCredentials) {
    return {
      response_type: 'ephemeral',
      text: `We need a secret named \`ibmToneAnalyzerCredentials\` to run this command. Create using \`/nc secret_create\``
    };
  }

  const result = [];
  const {apikey, url} = JSON.parse(ibmToneAnalyzerCredentials);
  const axios = require('axios');

  const {data} = await axios.post(
    url + '/v3/tone_chat?version=2017-09-21',
    {
      utterances: [{text}]
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

  const toneData = data.utterances_tone;

  const toneResult = {
    type: 'context',
    elements: []
  };

  for (const tone of toneData[0].tones) {
    toneResult.elements.push({
      type: 'mrkdwn',
      text: `*${tone.tone_name}* score: \`${tone.score}\``
    });
  }

  result.push(toneResult);

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
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
