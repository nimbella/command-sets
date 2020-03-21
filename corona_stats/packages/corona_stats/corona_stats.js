// jshint esversion: 9
/* eslint-disable global-require */
/* eslint-disable no-underscore-dangle */
let cheerio;
let tableParser;
let countryHtml;
let stateHtml;
const coronaMeter = 'https://www.worldometers.info/coronavirus/';
const axios = require('axios');

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

async function checkDependencies() {
  if (!cheerio) {
    await install(['cheerio']);
    cheerio = require('cheerio');
  }
  if (!tableParser) {
    await install(['cheerio-tableparser']);
    tableParser = require('cheerio-tableparser');
  }
}

const toTitleCase = (phrase) => phrase
  .toLowerCase()
  .split(' ')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const getCountryName = (name) => {
  const longNames = {
    CN: 'China',
    IT: 'Italy',
    ES: 'Spain',
    IR: 'Iran',
    DE: 'Germany',
    US: 'USA',
    USA: 'USA',
    FR: 'France',
    SK: 'S. Korea',
    CH: 'Switzerland',
    UK: 'UK',
    NL: 'Netherlands',
    BE: 'Belgium',
    AT: 'Austria',
    NO: 'Norway',
    SE: 'Sweden',
    DK: 'Denmark',
    MY: 'Malaysia',
    JP: 'Japan',
    AU: 'Australia',
    CAN: 'Canada',
    PT: 'Portugal',
    IL: 'Israel',
    BR: 'Brazil',
    IE: 'Ireland',
    GR: 'Greece',
    HK: 'Hong Kong',
    UAE: 'UAE',
    SL: 'Sri Lanka',
    IN: 'India',
    IQ: 'Iraq',
    PK: 'Pakistan',
    Default: name,
  };
  return (longNames[name] || toTitleCase(longNames.Default));
};

const getStateName = (name) => {
  const longNames = {
    AL: 'Alabama',
    AK: 'Alaska',
    AS: 'American Samoa',
    AZ: 'Arizona',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DE: 'Delaware',
    DC: 'District Of Columbia',
    FM: 'Federated States Of Micronesia',
    FL: 'Florida',
    GA: 'Georgia',
    GU: 'Guam',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MH: 'Marshall Islands',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    MP: 'Northern Mariana Islands',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PW: 'Palau',
    PA: 'Pennsylvania',
    PR: 'Puerto Rico',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VI: 'Virgin Islands',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming',
    Default: name,
  };
  return (longNames[name] || toTitleCase(longNames.Default));
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

async function getData(url) {
  let response;
  try {
    response = await axios.get(url);
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
  let fields = {};
  let header;
  let footer;
  await checkDependencies();
  const country = getCountryName((params.countryName || '').toUpperCase());
  if (country === 'USA' && params.region) {
    const state = getStateName(params.region.toUpperCase());
    if (!stateHtml) {
      stateHtml = await getData(`${coronaMeter}country/us/`);
      if (!stateHtml) { return fail(undefined, `Couldn't get stats for ${state}.`); }
    }
    header = `CoronaVirus :mask: Stats in ${state}, ${country} ${getFlag(country)} :`;
    fields = getDetails(toTitleCase(state), stateHtml, 'usa_table_countries_today');
    if (Object.keys(fields).length === 0 && fields.constructor === Object) { return fail(undefined, `Couldn\'t get stats for ${state}`); }
    return success(header, fields, footer);
  }
  if (!countryHtml) {
    countryHtml = await getData(coronaMeter);
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
