'use strict';

/**
 * A small function that converts slack elements `context` and `section` to mattermost compatible markdown.
 * @param {object} element - Slack element
 * @param {string} client - name of the client
 */
const mui = (element, client) => {
  if (client === 'slack') {
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
 * @description Take a snapshot of server instance.
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

  const {subid, __client} = params;
  const client = __client.name;

  // This array is used to store slack blocks.
  const result = [];

  try {
    const Vultr = require('@vultr/vultr-node');

    const {snapshot} = Vultr.initialize({apiKey: vultrApiKey});

    const {SNAPSHOTID} = await snapshot.create({SUBID: Number(subid)});

    result.push(
      mui(
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Snapshot with ID \`${SNAPSHOTID}\` is initiated for \`${subid}\``
            }
          ]
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
