// jshint esversion: 9

let cheerio;


const coronaMeter = 'https://www.worldometers.info/coronavirus/';
/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {

  const axios = require('axios');
  if (!cheerio) {
    await install(['cheerio']);
    cheerio = require('cheerio');
  }

  let response;
  try {
    response = await axios.get(coronaMeter);
    if (response.status !== 200) {
      throw err;
    }
  } catch (err) {
    return null;
  }

  let result = {};
  const html = cheerio.load(response.data);
  const stat = html(`span.panel-title:contains(Incubation Period)`);
  if (stat.length) {
    result = stat.parent().next().text();
  }
  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: `INCUBATION PERIOD (Estimated for 2019-nCoV):\n ${result}`
  };
}


// installs a set of npm packges
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
