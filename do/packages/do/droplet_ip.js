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

  const {id: dropletID, __client} = params;
  const client = __client.name;

  const result = [];
  const BASE_URL = 'https://api.digitalocean.com/v2';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${digitaloceanApiKey}`
  };

  try {
    const axios = require('axios');
    const {data} = await axios.get(BASE_URL + `/droplets/${dropletID}`, {
      headers
    });

    const {
      droplet: {networks}
    } = data;

    if (networks.v4.length > 0) {
      for (const address of networks.v4) {
        result.push(
          mui(
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Ipv4: \`${address.ip_address}\` ${
                    address.type !== 'public' ? ':lock:' : ''
                  }`
                }
              ]
            },
            client
          )
        );
      }
    }

    if (networks.v6.length > 0) {
      for (const address of networks.v6) {
        result.push(
          mui(
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Ipv6: \`${address.ip_address}\` ${
                    address.type !== 'public' ? ':lock:' : ''
                  }`
                }
              ]
            },
            client
          )
        );
      }
    }
  } catch (error) {
    result.push(
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Error:* ${error.response.data.message}`
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
