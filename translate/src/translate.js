// jshint esversion: 9

let axios;


const translator = 'https://translate.googleapis.com/translate_a/single';
/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {

  if (!axios) {
    await install(['axios']);
    axios = require('axios');
  }
  const sourceLang = 'auto';
  let targetLang = params.language;
  let translatedText = '';

  if (!params.language) { targetLang = 'en'; }
  if (!params.text) {
    return {
      response_type: 'ephemeral',
      text: 'Please specify the text to translate!'
    };
  }
  const sourceText = params.text;
  let response;
  try {

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


// installs a set of npm packages
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

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async ({ __secrets = {}, commandText, ...params }) => ({ body: await _command(params, commandText, __secrets) });
module.exports = main;
