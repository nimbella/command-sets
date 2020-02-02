// jshint esversion: 9

let axios, cheerio;


const coronaMeter = 'https://www.worldometers.info/coronavirus/';
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
  html('.maincounter-number').filter((i, el) => {
    let count = el.children[0].next.children[0].data;
    if (i === 0) {
      result.cases = count;
    } else {
      result.deaths = count;
    }
  });

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: `CoronaVirus Stats Worldwide: \n Cases:- ${result.cases} \n Deaths:- ${result.deaths}`
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
