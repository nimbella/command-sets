// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
const axios = require('axios');

async function _command(params, commandText, secrets = {}) {

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: await axios.get('https://raw.githubusercontent.com/Maljean/command-sets/dev/GitLab/README.md')
    .then(response => { return response.data; })
    .catch(error => { return error.response.data; })
  };
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async ({__secrets = {}, commandText, ...params}) => ({
  body: await _command(params, commandText, __secrets).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;