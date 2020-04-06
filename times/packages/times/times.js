/* eslint-disable global-require */
/* eslint-disable no-underscore-dangle */
// jshint esversion: 9

const defaultCities = 'delhi, rome, new york, los angeles';

const worldClock1 = 'https://24timezones.com/current_world_time.php/';
const worldClock2 = 'https://www.timeanddate.com/worldclock/full.html/';
const axios = require('axios');
const cheerio = require('cheerio');
const tableparser = require('cheerio-tableparser');

const toTitleCase = (phrase) => phrase
  .trim()
  .toLowerCase()
  .split(' ')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const abbrExpand = (shortName) => {
  let longName = shortName;
  switch (shortName) {
    case 'Delhi':
      longName = 'New Delhi';
      break;
    default:
      break;
  }
  return longName;
};

const fail = (err, msg) => {
  console.log(err);
  return {
    response_type: 'in_channel',
    text: msg || 'Couldn\'t get times.',
  };
};

const success = (fields) => {
  const response = {
    response_type: 'in_channel',
    blocks: [{
      type: 'section',
      fields: [],
    }],
  };
  Object.keys(fields).forEach((key) => {
    response.blocks[0].fields.push({
      type: 'mrkdwn',
      text: `*${key}*`,

    }, {
      type: 'mrkdwn',
      text: `*${fields[key].split('\n')[0]}*`,
    });
  });

  response.blocks.push({
    type: 'context',
    elements: [{
      type: 'mrkdwn',
      text: 'add _times_ to your Slack with <https://nimbella.com/blog/see-the-time-in-different-cities-on-slack-with-nimbella-commander/ | Commander>'
    }],
  });
  return response;
};

/**
 * @description current time for the given cities
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  let response;
  try {
    response = await axios.get(worldClock1, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }).catch((error) => {
      console.error(error);
      axios.get(worldClock2);
    });
    if (response.status !== 200) {
      return fail(response);
    }
  } catch (err) {
    return fail(err.message);
  }
  const fields = {};
  const html = cheerio.load(response.data);
  const { cities = defaultCities } = params;
  const cityList = cities.split(',');
  try {
    tableparser(html);
    const times = html('table').parsetable(false, false, true);
    let allTimes = [];
    let allCities = [];
    if (times.length > 0) {
      for (let index = 0; index < times.length; index += 1) {
        const element = times[index];
        allCities = allCities.concat(times[index]);
        allTimes = allTimes.concat(times[index + 1]);
        index += 1;
      }
    }
    for (let index = 0; index < cityList.length; index += 1) {
      const element = cityList[index];
      let city = toTitleCase(element);
      city = abbrExpand(city);
      let time;
      const recordIndex = allCities.findIndex((e) => e.startsWith(city));
      if (recordIndex > 0) {
        time = allTimes[recordIndex];
      } else {
        time = 'NA';
      }
      fields[city] = time;
    }
    return success(fields);
  } catch (e) {
    return fail(e.message);
  }
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch((error) => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`,
  })),
});
module.exports.main = main;
