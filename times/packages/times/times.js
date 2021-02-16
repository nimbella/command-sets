/* eslint-disable global-require */
/* eslint-disable no-underscore-dangle */
// jshint esversion: 9

const makeStringOfLength = (string, length) => {
  while (string.length < length) {
    string += ' ';
  }
  return string;
};

/**
 * A small function that converts slack `section` to mattermost compatible markdown.
 * @param {object} element - Slack element
 * @param {string} client - name of the client
 * @returns {string}
 */
const mui = (element, client) => {
  if (client === 'mattermost') {
    const output = [];
    switch (element.type) {
      case 'context': {
        for (const item of element.elements) {
          output.push(item.text.replace(/\*/g, '**'));
        }
        break;
      }
      case 'section': {
        if (element.fields && element.fields.length > 0) {
          let longestColumn = 0;
          for (let i = 0; i < element.fields.length; i++) {
            element.fields[i].text = element.fields[i].text.replace(
              /\*/g,
              '**'
            );
            if (element.fields[i].text.length > longestColumn) {
              longestColumn = element.fields[i].text.length;
            }
          }
          // Customized for this command to append two fields into one string of equal length
          for (let i = 0; i < element.fields.length; i += 2) {
            const cityName = makeStringOfLength(
              element.fields[i].text,
              longestColumn
            );
            const cityTime = element.fields[i + 1].text;

            output.push(cityName + ' ' + cityTime + '\n');
          }
        } else if (element.text) {
          // Convert single text element to h4 in mattermost.
          output.push('#### ' + element.text.text.replace(/\*/g, '**'));
        }
        break;
      }
    }
    return output.join('');
  }
  return element;
};

const defaultCities = 'delhi, rome, new york, los angeles';

const worldClock1 = 'https://24timezones.com/current_world_time.php/';
const worldClock2 = 'https://www.timeanddate.com/worldclock/full.html/';
const axios = require('axios');
const cheerio = require('cheerio');
const tableparser = require('cheerio-tableparser');

const toTitleCase = phrase =>
  phrase
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const abbrExpand = shortName => {
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

const fail = err => {
  console.log(err);
  return {
    response_type: 'in_channel',
    text: err || "Couldn't get times."
  };
};

const success = (fields, client) => {
  const response = {
    response_type: 'in_channel',
    blocks: []
  };
  const body = {
    type: 'section',
    fields: []
  };
  Object.keys(fields).forEach(key => {
    body.fields.push(
      {
        type: 'mrkdwn',
        text: `*${key}*: ${fields[key].split('\n')[0]}`
      }
    );
  });
  const footer = {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `add _times_ to your ${client === 'msteams' ? 'Microsoft Teams' : client} with <${
          client === 'slack'
            ? 'https://nimbella.com/blog/see-the-time-in-different-cities-on-slack-with-nimbella-commander/'
            : 'https://github.com/nimbella/command-sets/tree/master/times'
        }|Commander>.`
      }
    ]
  };
  response.blocks.push(mui(body, client));
  response.blocks.push(mui(footer, client));
  if (client === 'mattermost') {
    response.text = response.blocks.join('\n');
    delete response.blocks;
  }
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
    response = await axios
      .get(worldClock1, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9'
        }
      })
      .catch(error => {
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
  const {cities = defaultCities} = params;
  const cityList = cities.split(',');
  try {
    tableparser(html);
    const times = html('table').parsetable(false, false, true);
    let allTimes = [];
    let allCities = [];
    if (times.length > 0) {
      for (let index = 0; index < times.length; index += 1) {
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
      const recordIndex = allCities.findIndex(e => e.startsWith(city));
      if (recordIndex > 0) {
        time = allTimes[recordIndex];
      } else {
        time = 'NA';
      }
      fields[city] = time;
    }
    return success(fields, params.__client.name);
  } catch (e) {
    return fail(e.message);
  }
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
