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
 * Makes an https GET request.
 * @param {string} url - The request URL
 * @param {{}} headers - Headers that need to be set while making a request.
 * @returns {Promise} - The result wrapped in a promise object.
 * @see {@link https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies/}
 */
const getContent = (url, headers) => {
  // Return new pending promise
  return new Promise((resolve, reject) => {
    const request = require('https').get(url, {headers}, response => {
      // Handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(
          new Error('Failed to load page, status code: ' + response.statusCode)
        );
      }

      // Temporary data holder
      const body = [];
      // On every content chunk, push it to the data array
      response.on('data', chunk => body.push(chunk));
      // We are done, resolve promise with those joined chunks
      response.on('end', () => resolve(body.join('')));
    });
    // Handle connection errors of the request
    request.on('error', err => reject(err));
  });
};

/**
 * Extracts the public IPv4 address of a droplet.
 * @param {object} networks - Networks object of a droplet.
 * @returns {string} IPv4 - The public IPv4 address of the droplet if available.
 */
const publicIP = networks => {
  return networks.v4[0] ? networks.v4[0].ip_address : 'not available';
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

  const {id: dropletID = '', __client} = params;

  const client = __client.name;

  const result = [];
  const BASE_URL = 'https://api.digitalocean.com/v2';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${digitaloceanApiKey}`
  };

  try {
    if (dropletID) {
      const {droplet} = JSON.parse(
        await getContent(BASE_URL + `/droplets/${dropletID}`, headers)
      );

      result.push(
        mui(
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*${droplet.name}*`
              },
              {
                type: 'mrkdwn',
                text: `Status: *${droplet.status}*`
              },
              {
                type: 'mrkdwn',
                text: `IPv4: ${publicIP(droplet.networks)}`
              }
            ]
          },
          client
        )
      );
    } else {
      const {droplets} = JSON.parse(
        await getContent(BASE_URL + '/droplets?per_page=100', headers)
      );

      const inactiveDroplets = [];

      for (const droplet of droplets) {
        const {status} = droplet;
        if (status !== 'active') {
          inactiveDroplets.push(
            mui(
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `*${droplet.name}*`
                  },
                  {
                    type: 'mrkdwn',
                    text: `Status: *${droplet.status}*`
                  },
                  {
                    type: 'mrkdwn',
                    text: `IPv4: ${publicIP(droplet.networks)}`
                  }
                ]
              },
              client
            )
          );
        }
      }

      if (inactiveDroplets.length === 0) {
        result.push(
          mui(
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `All droplets are active.`
              }
            },
            client
          )
        );
      } else {
        result.push(
          mui(
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `These droplets seems to be inactive.`
              }
            },
            client
          )
        );
        result.push(...inactiveDroplets);
      }
    }
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
const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
