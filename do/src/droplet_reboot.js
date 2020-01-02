'use strict';

/**
 * Makes an https POST request.
 * @param {string} url - The request URL
 * @param {{}} headers - Headers that need to be set while making a request.
 * @param {{}} body - Body to post.
 * @returns {Promise} - The result wrapped in a promise object.
 */
const postContent = (url, headers, body) => {
  // Return new pending promise
  return new Promise((resolve, reject) => {
    const request = require('https').request(
      url,
      {headers, method: 'POST'},
      response => {
        // Handle http errors
        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(
            new Error(
              'Failed to load page, status code: ' + response.statusCode
            )
          );
        }

        // Temporary data holder
        const body = [];
        // On every content chunk, push it to the data array
        response.on('data', chunk => body.push(chunk));
        // We are done, resolve promise with those joined chunks
        response.on('end', () => resolve(body.join('')));
      }
    );
    // Post data.
    request.write(body);
    // Handle connection errors of the request
    request.on('error', err => reject(err));
    // End the request.
    request.end();
  });
};

/**
 * @description undefined
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const programStart = Date.now();
  const {digitaloceanApiKey} = secrets;
  const {id: dropletID} = params;

  const result = [];
  const BASE_URL = 'https://api.digitalocean.com/v2';
  const body = JSON.stringify({
    type: 'reboot'
  });
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': body.length,
    Authorization: `Bearer ${digitaloceanApiKey}`
  };

  try {
    const {action} = JSON.parse(
      await postContent(
        BASE_URL + `/droplets/${dropletID}/actions`,
        headers,
        body
      )
    );

    result.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Reboot initiated for ${dropletID}. Started at: ${new Date(
          action.started_at
        ).toUTCString()}\n Reboot status: ${action.status}`
      }
    });

    result.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Time taken: ~${Date.now() - programStart}ms`
        }
      ]
    });
  } catch (error) {
    result.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*ERROR:* ${error.message}`
      }
    });
  }

  return {
    response_type: 'in_channel', // eslint-disable-line camelcase
    blocks: result
  };
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async ({__secrets = {}, commandText, ...params}) => ({
  body: await _command(params, commandText, __secrets)
});
module.exports = main;
