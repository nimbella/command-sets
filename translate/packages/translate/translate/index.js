// jshint esversion: 9

const translator = 'https://translate.googleapis.com/translate_a/single';

const mui = (element, client) => {
  if (client === 'mattermost') {
    const output = [];
    switch (element.type) {
      case 'context': {
        for (const item of element.elements) {
          output.push(item.text.replace(/\*/g, '**'));
        }
        break;
      }
      case 'section': {
        if (element.fields && element.fields.length > 0) {
          for (const field of element.fields) {
            output.push(field.text.replace(/\*/g, '**') + '\n');
          }
        } else if (element.text) {
          output.push('#### ' + element.text.text.replace(/\*/g, '**'));
        }
        break;
      }
      case 'mrkdwn': {
        output.push('#### ' + element.text.replace(/\*/g, '**'));
        break;
      }
      case 'divider': {
        output.push('***');
        break;
      }
    }

    return output.join(' ');
  }
  return element;
};

const fail = (msg) => {
  return {
    response_type: 'in_channel',
    text: msg || `couldn't translate`,
  };
};
/**
 * @description Translates text to a given language
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {

  const axios = require('axios');
  const sourceLang = 'auto';
  let translatedText = '';
  let {
    language: targetLang = 'en',
    text: sourceText,
    __client
  } = params;
  const client = __client.name;
  const languageHelp = 'Language can be a <https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes|2 character ISO6931 code> or a language name such as Spanish, Chinese, etc.'
  if (sourceText == 'help' && targetLang == 'en') {
    return { response_type: 'in_channel', text: languageHelp };
  }

  try {
    if (targetLang.length != 2) {
      const ISO6391 = require('iso-639-1');
      targetLang = ISO6391.getCode(targetLang);
    }

    const url = `${translator}?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q="${encodeURI(sourceText)}"`;
    const result = await axios.get(url);
    if (result.status !== 200) {
      return fail();
    }
    translatedText = result.data[0][0][0];
  } catch (err) {
    return fail(err.response.status === 400 ? `Unknown language. ${languageHelp}` : err.message);
  }


  const response = {
    response_type: 'in_channel', // or `ephemeral` for private response
    blocks: [
      mui({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: translatedText,
        },
      }, client),
      mui({
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: `add _translate_ to your ${client} with <${client === 'slack' ? 'https://nimbella.com/blog/greet-your-friends-in-their-native-language-in-slack-with-nimbella-commander/' : 'https://github.com/nimbella/command-sets/tree/master/translate'}|Commander>`,
        }]
      }, client)]
  };
  if (client === 'mattermost') {
    response.text = response.blocks.join('\n');
    delete response.blocks;
  }
  return response;
}


/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports.main = main;
