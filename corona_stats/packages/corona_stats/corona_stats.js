/* eslint-disable global-require */
/* eslint-disable no-underscore-dangle */
// jshint esversion: 9

let cheerio;
let cache;
let tableparser;

const coronaMeter = 'https://www.worldometers.info/coronavirus/';

const toTitleCase = phrase =>
  phrase
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const abbrExpand = shortName => {
  let longName = shortName;
  switch (shortName) {
    case 'Us':
    case 'Usa':
      longName = 'USA';
      break;
    case 'Uk':
      longName = 'UK';
      break;
    case 'Sk':
      longName = 'S. Korea';
      break;
    case 'Hk':
      longName = 'Hong Kong';
      break;
    case 'Uae':
      longName = 'UAE';
      break;
    case 'Sl':
      longName = 'Sri Lanka';
      break;
    default:
      break;
  }
  return longName;
};

const getFlag = name => {
  let flag = '';
  switch (name) {
    case 'USA':
      flag = ':flag-us:';
      break;
    case 'UK':
      flag = ':flag-gb:';
      break;
    case 'India':
      flag = ':flag-in:';
      break;
    case 'S. Korea':
      flag = '🇰🇷';
      break;
    case 'Hong Kong':
      flag = '🇭🇰';
      break;
    case 'UAE':
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

const install = pkgs => {
  pkgs = pkgs.join(' ');
  return new Promise((resolve, reject) => {
    const {exec} = require('child_process');
    exec(`npm install ${pkgs}`, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const fail = (err, msg) => {
  console.log(err);
  return {
    response_type: 'in_channel',
    text: msg || "Couldn't get stats."
  };
};

const success = (header, fields, footer) => {
  const response = {
    response_type: 'in_channel',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${header}*`
        }
      },
      {
        type: 'section',
        fields: []
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${footer || ' '}`
          }
        ]
      }
    ]
  };

  for (const property in fields) {
    response.blocks[1].fields.push(
      {
        type: 'mrkdwn',
        text: `*${property}*`
      },
      {
        type: 'mrkdwn',
        text: `*${(fields[property] || 0).toString().padStart(12)}*`
      }
    );
  }
  return response;
};

/**
 * @description Live stats for the epidemic, worldwide or in a specific country
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
  if (!cache) {
    await install(['axios-cache-adapter']);
    cache = require('axios-cache-adapter');
  }
  if (!tableparser) {
    await install(['cheerio-tableparser']);
    tableparser = require('cheerio-tableparser');
  }
  const cacheSetup = cache.setupCache({
    maxAge: 15 * 60 * 1000 // 15 mins
  });
  const api = axios.create({
    adapter: cacheSetup.adapter
  });

  let response;
  try {
    response = await api.get(coronaMeter);
    if (response.status !== 200) {
      return fail(response);
    }
  } catch (err) {
    return fail(err.message);
  }
  if (!response) return fail();

  const fields = {};
  const html = cheerio.load(response.data);
  let header;
  let footer;

  if (params.countryName) {
    let country = toTitleCase(params.countryName);
    country = abbrExpand(country);
    tableparser(html);
    const countryStat = html('#main_table_countries').parsetable(
      false,
      false,
      true
    );
    const recordIndex = countryStat[0].indexOf(country);
    if (recordIndex > 0) {
      fields['Cases:'] = countryStat[1][recordIndex];
      fields['Fatalities:'] = countryStat[3][recordIndex];
      fields['Recovered:'] = countryStat[5][recordIndex];
      fields['Active Cases:'] = countryStat[6][recordIndex];
      fields['Critical Cases:'] = countryStat[7][recordIndex];
      header = `CoronaVirus :mask: Stats in ${country} ${getFlag(country)} :`;
    } else {
      return fail(undefined, `Couldn't get stats for ${country}.`);
    }
  } else {
    const statsElements = html('.maincounter-number');
    const stats = statsElements
      .text()
      .trim()
      .replace(/\s\s+/g, ' ')
      .split(' ');
    fields['Cases:'] = stats[0];
    fields['Fatalities:'] = stats[1];
    fields['Recovered:'] = stats[2];
    header = 'CoronaVirus :mask: Stats Worldwide :world_map: :';
    footer =
      'to see stats for a country, type `corona_stats <countryName>` e.g. `/nc corona_stats us`';
  }

  return success(header, fields, footer);
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
