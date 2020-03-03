// jshint esversion: 9

let  cheerio;


const coronaMeter = 'https://www.worldometers.info/coronavirus/countries-where-coronavirus-has-spread/';
/**
 * @description Stats for a Country
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

  const result = {};

  const html = cheerio.load(response.data);
  let country = toTitleCase(params.country_name);
  country = abbrExpand(country);
  const countryStat = html(`td:contains(${country})`);
  let msg;
  if (countryStat.length) {
    result.cases = countryStat.next().text();
    result.deaths = countryStat.next().next().text();
    msg = `CoronaVirus :mask: Stats in *${country}* ${getFlag(country)} :\n *Cases:-* ${result.cases} \n *Deaths:-* ${result.deaths}`;
  }
  else {
    msg = `${country} is safe till now.`;
  }

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: msg
  };
}

const toTitleCase = (phrase) => {
  return phrase
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};


const abbrExpand = (shortName) => {
  longName = shortName;
  switch (shortName) {
    case 'Us':
      longName = 'United States';
      break;
    case 'Uk':
      longName = 'United Kingdom';
      break;
    case 'Sk':
      longName = 'South Korea';
      break;
    case 'Hk':
      longName = 'Hong Kong';
      break;
    case 'Uae':
      longName = 'United Arab Emirates';
      break;
    case 'Sl':
      longName = 'Sri Lanka';
      break;
    default:
      break;
  }
  return longName;
};


const getFlag = (name) => {
  let flag = '';
  switch (name) {
    case 'United States':
      flag = ':flag-us:';
      break;
    case 'United Kingdom':
      flag = ':flag-us:';
      break;
    case 'India':
      flag = ':flag-in:';
      break;
    case 'South Korea':
      flag = '🇰🇷';
      break;
    case 'Hong Kong':
      flag = '🇭🇰';
      break;
    case 'United Arab Emirates':
      flag = '🇦🇪';
      break;
    case 'Sri Lanka':
      flag = '🇱🇰';
      break;
    default:
      break;
  }
  return flag;
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
