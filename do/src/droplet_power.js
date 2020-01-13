'use strict';

/**
 * A small function that converts slack elements `context` and `section` to mattermost compatible markdown.
 * @param {object} element - Slack element
 * @param {string} client - name of the client
 */
const mui = (element, client) => {
  const output = [];
  if (client === 'slack') {
    return element;
  } else {
    if (element.type === 'context') {
      for (const item of element.elements) {
        output.push(item.text.replace(/\*/g, '**'));
      }
    } else if (element.type === 'section') {
      output.push(element.text.text.replace(/\*/g, '**'));
    }
  }

  return output.join(' ');
};

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
  const {digitaloceanApiKey} = secrets;
  if (!digitaloceanApiKey) {
    return {
      text:
        'You need `digitaloceanApiKey` secret to run this command. Create one by running `/nc secret_create`.'
    };
  }

  const {id: dropletID, cmd, __client_headers: clientHeaders} = params;
  if (!['on', 'off'].includes(cmd)) {
    return {
      response_type: 'in_channel',
      text: `The value of \`cmd\` can only be \`off\` or \`on\`.`
    };
  }

  const getClient = () => {
    if (clientHeaders['user-agent'].includes('Slackbot')) {
      return 'slack';
    }

    return 'mattermost';
  };

  const client = getClient();

  const result = [];
  const BASE_URL = 'https://api.digitalocean.com/v2';
  const body = JSON.stringify({
    type: `power_${cmd}`
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

    result.push(
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Power ${cmd} initiated for ${dropletID}. Started at: ${new Date(
              action.started_at
            ).toUTCString()}\n Status: ${action.status}`
          }
        },
        client
      )
    );
  } catch (error) {
    result.push(
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*ERROR:* ${error.message}`
          }
        },
        client
      )
    );
  }

  return {
    response_type: 'in_channel', // eslint-disable-line camelcase
    [client === 'slack' ? 'blocks' : 'text']:
      client === 'slack' ? result : result.join('\n')
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
