// jshint esversion: 9

async function install(pkgs) {
  pkgs = pkgs.join(' ');
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec(`npm install ${pkgs}`, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

const translator = 'https://translate.googleapis.com/translate_a/single';
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
    text: sourceText
  } = params;

  if (sourceText == 'help' && targetLang == 'en') {
    return { response_type: 'in_channel', text: 'language can be a <https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes|2 character ISO6931 code> or a language name such as Spanish, Chinese, etc.' };
  }

  let response;
  try {
    if (targetLang.length != 2) {
      let packages = [ 'iso-639-1' ];
      await install(packages);
      const ISO6391 = require('iso-639-1');
      targetLang = ISO6391.getCode(targetLang);
    }
    
    if (targetLang == '') {
      return { response_type: 'in_channel', text: 'Unknown language. Language can be a <https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes|2 character ISO6931 code> or a language name such as Spanish, Chinese, etc.' };
    }
    
    const url = `${translator}?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURI(sourceText)}`;
    response = await axios.get(url);
    if (response.status !== 200) {
      throw err;
    }
    const result = response.data;
    translatedText = result[0][0][0];

  } catch (err) {
    return null;
  }


  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: translatedText
  };
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
module.exports = main;
