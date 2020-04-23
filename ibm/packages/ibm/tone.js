/**
 * @description Analyze the tone of a text using IBM Watson Tone Analyzer
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
    url + '/v3/tone?version=2017-09-21',
    {
      text
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

  if (data.document_tone.tones.length === 0) {
    result.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'No dominant tones detected in the document.'
      }
    });

    return {
      response_type: 'in_channel',
      blocks: result
    };
  }

  result.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Overall'
    }
  });

  const documentTone = {
    type: 'context',
    elements: []
  };

  for (const tone of data.document_tone.tones) {
    documentTone.elements.push({
      type: 'mrkdwn',
      text: `*${tone.tone_name}* score: \`${tone.score}\``
    });
  }

  result.push(documentTone);

  if (data.sentences_tone && data.sentences_tone.length > 0) {
    result.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Breakdown'
      }
    });

    for (const sentence of data.sentences_tone) {
      const sentenceOutput = [];

      sentenceOutput.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*Sentence:* ${sentence.text}`
          }
        ]
      });

      for (const tone of sentence.tones) {
        sentenceOutput.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Tone*: ${tone.tone_name} score: \`${tone.score}\``
            }
          ]
        });
      }

      result.push(...sentenceOutput);
    }
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
