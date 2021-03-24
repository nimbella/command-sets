// jshint esversion: 9
/* eslint-disable no-underscore-dangle */
const axios = require('axios');

const fail = (msg) => {
  console.log(msg);
  return {
    response_type: 'in_channel',
    text: msg || 'Couldn\'t get the weather conditions.',
  };
};

const getTime = (epoch, offset) => {
  const date = new Date(epoch * 1000 + offset * 1000);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const getDateTime = (epoch, offset) => (new Date(epoch * 1000 + offset * 1000)).toISOString().slice(0, 19).replace(/-/g, '/')
  .replace('T', ' ');

const toCelsius = (temp) => Number((temp - 273.15).toFixed(1));

const success = (data) => {
  const response = {
    response_type: 'in_channel',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Weather Conditions on ${getDateTime(data.dt, data.timezone)}\n*${data.name} -  ${data.sys.country}:*  ${data.weather[0].main}`,
        },
      },
      {
        type: 'section',
        accessory: {
          type: 'image',
          image_url: `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`,
          alt_text: data.weather[0].description,
        },
        fields: [
          {
            type: 'mrkdwn',
            text: `*Temp.:*🌡\n ${toCelsius(data.main.temp)}°c \n Min. ❄️ ${toCelsius(data.main.temp_min)}°c \n Max. 🔥 ${toCelsius(data.main.temp_max)}°c`,
          }, {
            type: 'mrkdwn',
            text: `*Sunrise:* :city_sunrise: \n${getTime(data.sys.sunrise, data.timezone)} \n*Sunset:*  :city_sunset: \n${getTime(data.sys.sunset, data.timezone)}`,
          },
          {
            type: 'mrkdwn',
            text: `*Humidity:* 💦 \n ${data.main.humidity} %`,
          },
          {
            type: 'mrkdwn',
            text: `*Cloudiness:* :cloud: \n ${data.clouds.all} %`,
          },
          {
            type: 'mrkdwn',
            text: `*Pressure:*\n ${data.main.pressure} hpa`,
          },
          {
            type: 'mrkdwn',
            text: `*Visibility:* 🔭 \n ${data.visibility / 1000} km`,
          },
          {
            type: 'mrkdwn',
            text: `*Wind:* ⛵ \n Speed 💨 ${(data.wind.speed * 3.6).toFixed(1)} km/h \n Direction 🧭 ${data.wind.deg}°`,
          },
          {
            type: 'mrkdwn',
            text: `*Geo coords:* 🌐 \n[${data.coord.lat},${data.coord.lon}]`,
          },
        ],
      },
    ],
  };
  return response;
};

/**
 * @description weather stats
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

async function _command(params, commandText, secrets = {}) {
  let response;
  const { varArgs: city } = params
  if (!city) return fail('Please specify city name');
  try {
    response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURI(city)}&appid=fbbf85ca2d738ae130d6c070c7df7bb7`);
    if (response.status !== 200) {
      return fail(response.status);
    }
  } catch (err) {
    if (err.response && err.response.status === 404)
      return fail();
    return fail(err.message);
  }
  if (!response) return fail();
  return success(response.data);
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
module.exports = main;
