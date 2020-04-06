// jshint esversion: 9
/* eslint-disable global-require */
/* eslint-disable guard-for-in */
/* eslint-disable prefer-destructuring */
/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
const coronaMeter = 'https://www.worldometers.info/coronavirus/';
const covid19India = 'https://api.covid19india.org/';
const countryDomId = 'table_countries_today';
const axios = require('axios');
const cheerio = require('cheerio');
const tableParser = require('cheerio-tableparser');
let countryHtml;
let usStatesHtml;
let inStatesData;
let inDistrictData;

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

const getUSStateName = (name) => {
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

const getIndianStateName = (name) => {
  const longNames = {
    AP: 'Andhra Pradesh',
    AR: 'Arunachal Pradesh',
    AS: 'Assam',
    BR: 'Bihar',
    CG: 'Chhattisgarh',
    CH: 'Chandigarh',
    DD: 'Daman and Diu',
    DH: 'Dadra and Nagar Haveli',
    DL: 'Delhi',
    GA: 'Goa',
    GJ: 'Gujarat',
    HP: 'Himachal Pradesh',
    HR: 'Haryana',
    JK: 'Jammu and Kashmir',
    JH: 'Jharkhand',
    KA: 'Karnataka',
    KL: 'Kerala',
    LD: 'Lakshadweep',
    MH: 'Maharashtra',
    ML: 'Meghalaya',
    MN: 'Manipur',
    MP: 'Madhya Pradesh',
    MZ: 'Mizoram',
    NL: 'Nagaland',
    OR: 'Orissa',
    PJ: 'Punjab',
    RJ: 'Rajasthan',
    SK: 'Sikkim',
    TN: 'Tamil Nadu',
    TR: 'Tripura',
    UK: 'Uttarakhand',
    UP: 'Uttar Pradesh',
    WB: 'West Bengal',
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
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: 'add _corona_stats_ to your Slack with <https://nimbella.com/blog/get-live-coronavirus-stats-in-slack-with-nimbella-commander/ | Commander>',
      }],
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
    response.blocks[2].elements.push(
      {
        type: 'mrkdwn',
        text: footer,
      },
    );
  }
  return response;
};

const help = () => {
  const response = {
    response_type: 'in_channel',
    blocks: [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Using these commands, see stats for any country/region or worldwide.*',
      },
    },
    {
      type: 'section',
      text:
      {
        type: 'mrkdwn',
        text: '*command format*: \n`/nc corona_stats` \n`/nc corona_stats <Country Name | Abbreviation>` \n`/nc corona_stats <Country Name | Abbreviation> -r <State Name | Abbreviation>` \n`/nc corona_stats <Country Name | Abbreviation> -r <District Name>`',
      },
    },
    {
      type: 'section',
      text:
      {
        type: 'mrkdwn',
        text: '*examples:*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '`/nc corona_stats` : Worldwide stats',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '`/nc corona_stats in` : stats for India',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '`/nc corona_stats in -r up` : stats for Uttar Pradesh, India',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '`/nc corona_stats in -r agra` : stats for Agra District, India',
      },
    },
    ],
  };

  response.blocks.push({
    type: 'context',
    elements: [{
      type: 'mrkdwn',
      text: 'add _corona_stats_ to your Slack with <https://nimbella.com/blog/get-live-coronavirus-stats-in-slack-with-nimbella-commander/ | Commander> | data sources: <https://www.worldometers.info/coronavirus/|worldometers>, <https://www.covid19india.org/|covid19india>',
    }],
  });

  return response;
};

async function getHTMLData(url) {
  const response = await getData(url);
  return cheerio.load(response);
}

async function getData(url) {
  let response;
  try {
    response = await axios.get(url);
    if (response.status !== 200) {
      return;
    }
  } catch (err) {
    fail(err.message);
    return;
  }
  if (!response) return;
  return response.data;
}

const getDetails = (name, html) => {
  const fields = {};
  try {
    tableParser(html);
    const stats = html(`#main_${countryDomId}`).parsetable(false, false, true);
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

const getDetailsForUS = (name, html) => {
  const fields = {};
  try {
    tableParser(html);
    const stats = html(`#usa_${countryDomId}`).parsetable(false, false, true);
    if (stats.length === 0) {
      return;
    }
    const recordIndex = stats[0].indexOf(name);
    if (recordIndex > 0) {
      fields['Total Cases'] = stats[1][recordIndex];
      fields['New Cases'] = stats[2][recordIndex];
      fields['Total Fatalities'] = stats[3][recordIndex];
      fields['New Fatalities'] = stats[4][recordIndex];
      fields['Active Cases'] = stats[5][recordIndex];
    }
  } catch (e) {
    fail(e.message);
  }
  return fields;
};

const getDetailsForIndia = async (name) => {
  if (!inStatesData) {
    const stateData = await getData(`${covid19India}data.json`);
    inStatesData = stateData.statewise;
  }
  const fields = {};
  try {
    const stats = inStatesData;
    if (!stats) {
      return;
    }
    let record = stats.find((o) => o.state === name);
    if (record) {
      fields.Active = record.active;
      fields['New Active'] = record.delta.active;
      fields.Confirmed = record.confirmed;
      fields['New Confirmed'] = record.delta.confirmed;
      fields.Fatalities = record.deaths;
      fields['New Fatalities'] = record.delta.deaths;
      fields.Recovered = record.recovered;
      fields['New Recovered'] = record.delta.recovered;
    } else {
      if (!inDistrictData) {
        inDistrictData = await getData(`${covid19India}state_district_wise.json`);
      }
      record = Object.values(inDistrictData).find((e) => e.districtData[name]);
      if (record) {
        fields.Confirmed = record.districtData[name].confirmed;
      }
    }
  } catch (e) {
    fail(e.message);
  }
  return fields;
};

/**
 * @description Live stats for the pandemic, worldwide or in a specific country
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params) {
  let fields = {};
  let header;
  let footer;
  if (params.h || params.countryName === 'help') {
    return help();
  }
  const country = getCountryName((params.countryName || '').toUpperCase());
  let state = params.region;
  if (params.region) {
    if (country === 'USA') {
      state = getUSStateName(params.region.toUpperCase());
      if (!usStatesHtml) {
        usStatesHtml = await getHTMLData(`${coronaMeter}country/us/`);
        if (!usStatesHtml) { return fail(undefined, `Couldn't get stats for ${state}.`); }
      }
      fields = getDetailsForUS(state, usStatesHtml);
    }
    if (country === 'India') {
      state = getIndianStateName(params.region.toUpperCase());
      fields = await getDetailsForIndia(state);
    }
    header = `CoronaVirus :mask: Stats in ${state}, ${country} ${getFlag(country)} :`;
    if (Object.keys(fields).length === 0 && fields.constructor === Object) { return fail(undefined, `Couldn\'t get stats for ${state}`); }
    return success(header, fields, footer);
  }
  if (!countryHtml) {
    countryHtml = await getHTMLData(coronaMeter);
    if (!countryHtml) { return fail(undefined, 'Couldn\'t get the stats'); }
  }
  if (country) {
    if (country === 'USA') {
      footer = 'to see stats for a state, type `corona_stats us -r <stateName>` e.g. `/nc corona_stats us -r ny`';
    }
    if (country === 'India') {
      footer = 'to see stats for a state, type `corona_stats in -r <stateName>` e.g. `/nc corona_stats in -r up`';
    }
    header = `CoronaVirus :mask: Stats in ${country} ${getFlag(country)} :`;
    fields = getDetails(country, countryHtml);
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
module.exports.main = main;
