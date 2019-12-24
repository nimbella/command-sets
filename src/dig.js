'use strict';

const formattedARecords = (records, hostname) => {
  const output = [];
  for (const record of records) {
    output.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${hostname}`
        },
        {
          type: 'mrkdwn',
          text: `Type: *A*`
        },
        {
          type: 'mrkdwn',
          text: `TTL: ${record.ttl}`
        },
        {
          type: 'mrkdwn',
          text: `IP: \`${record.address}\``
        }
      ]
    });
  }

  return output;
};

const formattedAAAARecords = (records, hostname) => {
  const output = [];
  for (const record of records) {
    output.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${hostname}`
        },
        {
          type: 'mrkdwn',
          text: `Type: *AAAA*`
        },
        {
          type: 'mrkdwn',
          text: `TTL: ${record.ttl}`
        },
        {
          type: 'mrkdwn',
          text: `IP: \`${record.address}\``
        }
      ]
    });
  }

  return output;
};

const formattedMXRecords = (records, hostname) => {
  const output = [];
  for (const record of records) {
    output.push({
      type: 'context',
      elements: [
        {type: 'mrkdwn', text: `${hostname}`},
        {type: 'mrkdwn', text: `\`${record.exchange}\``},
        {type: 'mrkdwn', text: `Priority: \`${record.priority}\``}
      ]
    });
  }

  return output;
};

const formattedTXTRecords = (records, hostname) => {
  const output = [];
  for (const record of records) {
    output.push({
      type: 'context',
      elements: [
        {type: 'mrkdwn', text: `${hostname}`},
        {type: 'mrkdwn', text: `Type: *TXT*`},
        {type: 'mrkdwn', text: `\`${record[0]}\``}
      ]
    });
  }

  return output;
};

const formattedNSRecords = (records, hostname) => {
  const output = [];
  for (const record of records) {
    output.push({
      type: 'context',
      elements: [
        {type: 'mrkdwn', text: `${hostname}`},
        {type: 'mrkdwn', text: `Type: *NS*`},
        {type: 'mrkdwn', text: `\`${record}\``}
      ]
    });
  }

  return output;
};

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params) {
  const {hostname} = params;

  const result = [];
  const dns = require('dns');
  const {promisify} = require('util');

  try {
    const resolve4Async = promisify(dns.resolve4);
    const records = await resolve4Async(hostname, {ttl: true});
    for (const record of records) {
      result.push({
        type: 'context',
        elements: [
          {type: 'mrkdwn', text: `${hostname}`},
          {type: 'mrkdwn', text: `${record.ttl}`},
          {type: 'mrkdwn', text: `${record.address}`}
        ]
      });
    }
  } catch (error) {
    console.error(error.message);
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
