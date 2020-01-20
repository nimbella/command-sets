'use strict';

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

  // This array is used to store slack blocks.
  const result = [];
  const {subid} = params;

  const Vultr = require('@vultr/vultr-node');

  const {snapshot} = Vultr.initialize({apiKey: vultrApiKey});

  const {SNAPSHOTID} = await snapshot.create({SUBID: subid});

  result.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Snapshot with ID \`${SNAPSHOTID}\` is initiated for \`${subid}\``
      }
    ]
  });

  return {
    // Or `ephemeral` for private response
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
