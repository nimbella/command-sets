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
  const roStat = html(`span.panel-title:contains(Transmission Rate)`);
  if (roStat.length) {
    result = roStat.parent().next().text();
  }

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: `TRANSMISSION RATE (Ro) (Estimated for 2019-nCoV):\n ${result}`
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

const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
