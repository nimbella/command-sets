// jshint esversion: 9
/* eslint-disable global-require */
/* eslint-disable no-underscore-dangle */
let cheerio;
let cache;
let tableParser;
let countryHtml;
let stateHtml;
const coronaMeter = 'https://www.worldometers.info/coronavirus/';

const toTitleCase = (phrase) => phrase
  .toLowerCase()
  .split(' ')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const getCountryName = (name) => {
  const longNames = {
    Cn: 'China', // Countries
    It: 'Italy',
    Es: 'Spain',
    Ir: 'Iran',
    De: 'Germany',
    Us: 'USA',
    Usa: 'USA',
    Fr: 'France',
    Sk: 'S. Korea',
    Ch: 'Switzerland',
    Uk: 'UK',
    Nl: 'Netherlands',
    Be: 'Belgium',
    At: 'Austria',
    No: 'Norway',
    Se: 'Sweden',
    Dk: 'Denmark',
    My: 'Malaysia',
    Jp: 'Japan',
    Au: 'Australia',
    Can: 'Canada',
    Pt: 'Portugal',
    Il: 'Israel',
    Br: 'Brazil',
    Ie: 'Ireland',
    Gr: 'Greece',
    Hk: 'Hong Kong',
    Uae: 'UAE',
    Sl: 'Sri Lanka',
    In: 'India',
    Iq: 'Iraq',
    Pk: 'Pakistan',
    Default: name,
  };
  return (longNames[name] || longNames.Default);
};


const getStateName = (name) => {
  const longNames = {
    Al: 'Alabama',
    Ak: 'Alaska',
    As: 'American Samoa',
    Az: 'Arizona',
    Ar: 'Arkansas',
    Ca: 'California',
    Co: 'Colorado',
    Ct: 'Connecticut',
    De: 'Delaware',
    Dc: 'District Of Columbia',
    Fm: 'Federated States Of Micronesia',
    Fl: 'Florida',
    Ga: 'Georgia',
    Gu: 'Guam',
    Hi: 'Hawaii',
    Id: 'Idaho',
    Il: 'Illinois',
    In: 'Indiana',
    Ia: 'Iowa',
    Ks: 'Kansas',
    Ky: 'Kentucky',
    La: 'Louisiana',
    Me: 'Maine',
    Mh: 'Marshall Islands',
    Md: 'Maryland',
    Ma: 'Massachusetts',
    Mi: 'Michigan',
    Mn: 'Minnesota',
    Ms: 'Mississippi',
    Mo: 'Missouri',
    Mt: 'Montana',
    Ne: 'Nebraska',
    Nv: 'Nevada',
    Nh: 'New Hampshire',
    Nj: 'New Jersey',
    Nm: 'New Mexico',
    Ny: 'New York',
    Nc: 'North Carolina',
    Nd: 'North Dakota',
    Mp: 'Northern Mariana Islands',
    Oh: 'Ohio',
    Ok: 'Oklahoma',
    Or: 'Oregon',
    Pw: 'Palau',
    Pa: 'Pennsylvania',
    Pr: 'Puerto Rico',
    Ri: 'Rhode Island',
    Sc: 'South Carolina',
    Sd: 'South Dakota',
    Tn: 'Tennessee',
    Tx: 'Texas',
    Ut: 'Utah',
    Vt: 'Vermont',
    Vi: 'Virgin Islands',
    Va: 'Virginia',
    Wa: 'Washington',
    Wv: 'West Virginia',
    Wi: 'Wisconsin',
    Wy: 'Wyoming',
    Default: name,
  };
  return (longNames[name] || longNames.Default);
};

const getFlag = (name) => {
  const flags = {
    China: '🇨🇳',
    Italy: '🇮🇹',
    Spain: '🇪🇸',
    Iran: '🇮🇷',
    Germany: '🇩🇪',
    USA: '🇺🇸',
    UK: '🇬🇧',
    France: '🇫🇷',
    Switzerland: '🇨🇭',
    Netherlands: '🇳🇱',
    Austria: '🇦🇹',
    Australia: '🇦🇺',
    Canada: '🇨🇦',
    India: '🇮🇳',
    'S. Korea': '🇰🇷',
    'Hong Kong': '🇭🇰',
    UAE: '🇦🇪',
    'Sri Lanka': '🇱🇰',
    Default: '',
  };
  return (flags[name] || flags.Default);
};

const install = (pkgs) => {
  pkgs = pkgs.join(' ');
  return new Promise((resolve, reject) => {
    const {
      exec,
    } = require('child_process');
    exec(`npm install ${pkgs}`, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const fail = (err, msg) => {
  console.log(err);
  return {
    response_type: 'in_channel',
    text: msg || "Couldn't get stats.",
  };
};

const success = (header, fields, footer) => {
  const response = {
    response_type: 'in_channel',
    blocks: [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${header}*`,
      },
    },
    {
      type: 'section',
      fields: [],
    },
    ],
  };
  for (const property in fields) {
    response.blocks[1].fields.push({
      type: 'mrkdwn',
      text: `${property}:   *${(fields[property] || 0)}*`,
    });
  }
  if (footer) {
    response.blocks.push({
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: footer,
      }],
    });
  }
  return response;
};


const getDetails = (name, html, domName) => {
  const fields = {};
  try {
    tableParser(html);
    const stats = html(`#${domName}`).parsetable(false, false, true);
    if (stats.length === 0) {
      return;
    }
    const recordIndex = stats[0].indexOf(name);
    if (recordIndex > 0) {
      fields['Total Cases'] = stats[1][recordIndex];
      fields['New Cases'] = stats[2][recordIndex];
      fields['Total Fatalities'] = stats[3][recordIndex];
      fields['Total Recovered'] = stats[5][recordIndex];
      fields['New Fatalities'] = stats[4][recordIndex];
      fields['Active Cases'] = stats[6][recordIndex];
      fields['Critical Cases'] = stats[7][recordIndex];
    }
  } catch (e) {
    fail(e.message);
  }
  return fields;
};

async function getData(api, url) {
  let response;
  try {
    response = await api.get(url);
    if (response.status !== 200) {
      return;
    }
  } catch (err) {
    return fail(err.message);
  }
  if (!response) return;
  return cheerio.load(response.data);
}


/**
 * @description Live stats for the epidemic, worldwide or in a specific country
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

async function _command(params) {
  const axios = require('axios');
  if (!cheerio) {
    await install(['cheerio']);
    cheerio = require('cheerio');
  }
  if (!cache) {
    await install(['axios-cache-adapter']);
    cache = require('axios-cache-adapter');
  }
  if (!tableParser) {
    await install(['cheerio-tableparser']);
    tableParser = require('cheerio-tableparser');
  }
  const cacheSetup = cache.setupCache({
    maxAge: 15 * 60 * 1000, // 15 mins
  });
  const api = axios.create({
    adapter: cacheSetup.adapter,
  });


  let fields = {};
  let header;
  let footer;
  const country = getCountryName(toTitleCase(params.countryName || ''));
  if (country === 'USA' && params.region) {
    const state = getStateName(toTitleCase(params.region));
    if (!stateHtml) {
      stateHtml = await getData(api, `${coronaMeter}country/us/`);
      if (!stateHtml) { return fail(undefined, `Couldn't get stats for ${state}.`); }
    }
    header = `CoronaVirus :mask: Stats in ${state}, ${country} ${getFlag(country)} :`;
    fields = getDetails(state, stateHtml, 'usa_table_countries_today');
    if (Object.keys(fields).length === 0 && fields.constructor === Object) { return fail(undefined, `Couldn\'t get stats for ${state}`); }
    return success(header, fields, footer);
  }
  if (!countryHtml) {
    countryHtml = await getData(api, coronaMeter);
    if (!countryHtml) { return fail(undefined, 'Couldn\'t get the stats'); }
  }
  if (country) {
    if (country === 'USA') {
      footer = 'to see stats for a state, type `corona_stats us -r <stateName>` e.g. `/nc corona_stats us -r ny`';
    }
    header = `CoronaVirus :mask: Stats in ${country} ${getFlag(country)} :`;
    fields = getDetails(country, countryHtml, 'main_table_countries_today');
    if (Object.keys(fields).length === 0 && fields.constructor === Object) { return fail(undefined, `Couldn\'t get stats for ${country}`); }
  } else {
    try {
      const statsElements = countryHtml('.maincounter-number');
      const stats = statsElements
        .text()
        .trim()
        .replace(/\s\s+/g, ' ')
        .split(' ');
      fields.Cases = stats[0];
      fields.Recovered = stats[2];
      fields.Fatalities = stats[1];
      header = 'CoronaVirus :mask: Stats Worldwide :world_map: :';
      footer = 'to see stats for a country, type `corona_stats <countryName>` e.g. `/nc corona_stats us`';
    } catch (e) {
      return fail(undefined, 'Couldn\'t get the stats.');
    }
  }
  return success(header, fields, footer);
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async (args) => ({
  body: await _command(
    args.params,
  ).catch((error) => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`,
  })),
});
module.exports = main;
