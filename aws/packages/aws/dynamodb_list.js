'use strict';

/**
 * A small function that converts slack elements `context` and `section` to mattermost compatible markdown.
 * @param {object} element - Slack element
 * @param {string} client - name of the client
 */
const mui = (element, client) => {
  const output = [];
  if (client === 'slack' || client === 'msteams') {
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
  const {awsAccessKey, awsSecretKey, awsRegion} = secrets;

  if (!awsAccessKey || !awsSecretKey || !awsRegion) {
    return {
      response_type: 'ephemeral',
      text:
        'You need `awsAccessKey`, `awsSecretKey` and `awsRegion` secrets to use this command. Create one by running `/nc secret_create`.'
    };
  }

  const {startTable = null, __client} = params;

  const client = __client.name;

  const result = [];
  const aws = require('aws-sdk');
  const ddb = new aws.DynamoDB({
    apiVersion: '2012-08-10',
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
    region: awsRegion
  });

  try {
    const {promisify} = require('util');
    const listTablesAsync = promisify(ddb.listTables).bind(ddb);

    const {TableNames} = await listTablesAsync({
      Limit: 10,
      ExclusiveStartTableName: startTable
    });

    if (TableNames.length > 0) {
      result.push(
        mui(
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `\`${TableNames.join('`\n`')}\``
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
              text: `No tables available.`
            }
          },
          client
        )
      );
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
    response_type: 'in_channel',
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
module.exports = main;
