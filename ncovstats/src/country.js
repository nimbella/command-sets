// jshint esversion: 9

let axios, cheerio;


const coronaMeter = 'https://www.worldometers.info/coronavirus/countries-where-coronavirus-has-spread/';
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
  const country = toTitleCase(params.country_name); 
  const countryStat = html(`td:contains(${country})`);
  if(countryStat.length)
  {
    result.cases = countryStat.next().text();
    result.deaths = countryStat.next().next().text();
  }

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: `CoronaVirus Stats in ${country}:\n Cases:- ${result.cases} \n Deaths:- ${result.deaths}`
  };
}

const toTitleCase = (phrase) => {
  return phrase
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const install = (pkgs) => {
  pkgs = pkgs.join(' ');
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec(`npm install ${pkgs}`, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async ({ __secrets = {}, commandText, ...params }) => ({ body: await _command(params, commandText, __secrets) });
module.exports = main;
