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
 * Formats 'A' records into slack blocks or mattermost markdown.
 * @param {array} records - Array returned by the resolve func.
 * @param {string} hostname - The hostname for which the request is made.
 * @returns {array} - An array of formatted slack blocks.
 */
const formatARecords = (records, {hostname, client}) => {
  const output = [];
  for (const record of records) {
    output.push(
      mui(
        {
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
        },
        client
      )
    );
  }

  return output;
};

/**
 * Format 'AAAA' records into slack blocks.
 * @param {array} records - Array returned by the resolve func.
 * @param {string} hostname - The hostname to which the request is made.
 * @returns {array} - An array of formatted slack blocks.
 */
const formatAAAARecords = (records, {hostname, client}) => {
  const output = [];
  for (const record of records) {
    output.push(
      mui(
        {
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
        },
        client
      )
    );
  }

  return output;
};

/**
 * Format 'MX' records into slack blocks.
 * @param {array} records - Array returned by the resolve func.
 * @param {string} hostname - The hostname to which the request is made.
 * @returns {array} - An array of formatted slack blocks.
 */
const formatMXRecords = (records, {hostname, client}) => {
  const output = [];
  for (const record of records) {
    output.push(
      mui(
        {
          type: 'context',
          elements: [
            {type: 'mrkdwn', text: `${hostname}`},
            {type: 'mrkdwn', text: `\`${record.exchange}\``},
            {type: 'mrkdwn', text: `Priority: \`${record.priority}\``}
          ]
        },
        client
      )
    );
  }

  return output;
};

/**
 * Format 'TXT' records into slack blocks.
 * @param {array} records - Array returned by the resolve func.
 * @param {string} hostname - The hostname to which the request is made.
 * @returns {array} - An array of formatted slack blocks.
 */
const formatTXTRecords = (records, {hostname, client}) => {
  const output = [];
  for (const record of records) {
    output.push(
      mui(
        {
          type: 'context',
          elements: [
            {type: 'mrkdwn', text: `${hostname}`},
            {type: 'mrkdwn', text: `Type: *TXT*`},
            {type: 'mrkdwn', text: `\`${record[0]}\``}
          ]
        },
        client
      )
    );
  }

  return output;
};

/**
 * Format 'NS' records into slack blocks.
 * @param {array} records - Array returned by the resolve func.
 * @param {string} hostname - The hostname to which the request is made.
 * @returns {array} - An array of formatted slack blocks.
 */
const formatNSRecords = (records, {hostname, client}) => {
  const output = [];
  for (const record of records) {
    output.push(
      mui(
        {
          type: 'context',
          elements: [
            {type: 'mrkdwn', text: `${hostname}`},
            {type: 'mrkdwn', text: `Type: *NS*`},
            {type: 'mrkdwn', text: `\`${record}\``}
          ]
        },
        client
      )
    );
  }

  return output;
};

const formatSoaRecord = (record, {hostname, client}) => {
  const block = {
    type: 'context',
    elements: [{type: 'mrkdwn', text: `*${hostname}*`}]
  };

  for (const [key, value] of Object.entries(record)) {
    block.elements.push({type: 'mrkdwn', text: `${key}: \`${value}\``});
  }

  return [mui(block, client)];
};

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params) {
  const {__client} = params;

  const client = __client ? __client.name : 'slack';

  let {type = 'A', hostname} = params;
  type = type.toUpperCase();
  hostname = hostname.startsWith('<')
    ? hostname.split('|')[1].slice(0, -1)
    : hostname;

  const result = [];
  const dns = require('dns');
  const {promisify} = require('util');

  try {
    switch (type) {
      case 'A': {
        const resolve4Async = promisify(dns.resolve4);
        const records = await resolve4Async(hostname, {ttl: true});
        result.push(...formatARecords(records, {hostname, client}));
        break;
      }

      case 'AAAA': {
        const resolve6Async = promisify(dns.resolve6);
        const records = await resolve6Async(hostname, {ttl: true});
        result.push(...formatAAAARecords(records, {hostname, client}));
        break;
      }

      case 'TXT': {
        const resolveTXTAsync = promisify(dns.resolveTxt);
        const records = await resolveTXTAsync(hostname);
        result.push(...formatTXTRecords(records, {hostname, client}));
        break;
      }

      case 'MX': {
        const resolveMXAsync = promisify(dns.resolveMx);
        const records = await resolveMXAsync(hostname);
        result.push(...formatMXRecords(records, {hostname, client}));
        break;
      }

      case 'NS': {
        const resolveNSAsync = promisify(dns.resolveNs);
        const records = await resolveNSAsync(hostname);
        result.push(...formatNSRecords(records, {hostname, client}));
        break;
      }

      case 'SOA': {
        const resolveSoaAsync = promisify(dns.resolveSoa);
        const records = await resolveSoaAsync(hostname);
        result.push(...formatSoaRecord(records, {hostname, client}));
        break;
      }

      default: {
        result.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `\`${type}\` is not supported. Supported records are \`A\`, \`AAAA\`, \`TXT\`, \`MX\`, \`NS\` & \`SOA\`.`
            }
          ]
        });
        break;
      }
    }
  } catch (error) {
    if (error.code === 'ENODATA') {
      result.push(
        mui(
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `No records of type *${type}* found for ${hostname}.`
              }
            ]
          },
          client
        )
      );
    } else if (error.code === 'ENOTFOUND') {
      result.push(
        mui(
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Domain ${hostname} not found.`
              }
            ]
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
              text: `*ERROR:* ${error.message}`
            }
          },
          client
        )
      );
    }
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
