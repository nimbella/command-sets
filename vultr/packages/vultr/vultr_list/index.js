'use strict';

/**
 * A small function that converts slack elements `context` and `section` to mattermost compatible markdown.
 * @param {object} element - Slack element
 * @param {string} client - name of the client
 */
const mui = (element, client) => {
  if (client !== 'mattermost') {
    return element;
  }

  const output = [];
  if (element.type === 'context') {
    for (const item of element.elements) {
      output.push(item.text.replace(/\*/g, '**'));
    }
  } else if (element.type === 'section') {
    output.push(element.text.text.replace(/\*/g, '**'));
  }

  return output.join(' ');
};

/**
 * @description Says "Hello, world!" or "Hello, <name>" when the name is provided.
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {vultrApiKey} = secrets;
  if (!vultrApiKey) {
    return {
      text:
        'You need `vultrApiKey` secret to run this command. Create one by running `/nc secret_create`.'
    };
  }

  const {__client} = params;
  const client = __client.name;

  // This array is used to store slack blocks.
  const result = [];

  try {
    let Vultr;
    Vultr = require('@vultr/vultr-node');

    const {server} = Vultr.initialize({apiKey: vultrApiKey});

    const data = await server.list();
    if (data.length === 0) {
      result.push({
        type: 'section',
        text: {type: 'mrkdwn', text: `No servers found under your account. `}
      });
    } else if (data.error) {
      result.push({
        type: 'section',
        text: {type: 'mrkdwn', text: `*Error*: ${data.message}`}
      });
    } else {
      for (const [key, value] of Object.entries(data)) {
        const {main_ip, status, label} = value;

        const output = {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `ID: ${key}`
            },
            {
              type: 'mrkdwn',
              text: `IP: \`${main_ip}\``
            },
            {
              type: 'mrkdwn',
              text: `Status: *${status}*`
            }
          ]
        };

        if (label) {
          output.elements.push({
            type: 'mrkdwn',
            text: `${label}`
          });
        }

        result.push(mui(output, client));
      }
    }
  } catch (error) {
    result.push(
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Error*: ${error.message}`
          }
        },
        client
      )
    );
  }

  return {
    // Or `ephemeral` for private response
    response_type: 'in_channel', // eslint-disable-line camelcase
    [client !== 'mattermost' ? 'blocks' : 'text']:
      client !== 'mattermost' ? result : result.join('\n')
  };
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
module.exports.main = main;
