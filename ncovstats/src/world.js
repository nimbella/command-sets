// jshint esversion: 9

let axios, cheerio;


const coronaMeter = 'https://www.worldometers.info/coronavirus/';
/**
 * @description Worldwide Stats
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

  const result = {};

  const html = cheerio.load(response.data);
  const statsElements = html(`.maincounter-number`);
  const stats = statsElements.text().trim().replace(/\s\s+/g, ' ').split(' ');

  result.cases = `${stats[0]} \`${statsElements.next().text()}\``;

  result.deaths = stats[1];
  result.cured = stats[2];

  return {
    response_type: 'in_channel', // or `ephemeral` for private response

    text: `CoronaVirus :mask: Stats Worldwide :world_map: :  \n *Cases:-* ${result.cases} \n *Deaths:-* ${result.deaths} \n *Cured:-* ${result.cured}  \n to see stats for a country type \` /ncovstats country <country_name>\` e.g. /ncovstats country uk`

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
