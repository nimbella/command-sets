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
        'You must create secrets for `awsAccessKey`, `awsSecretKey` and `awsRegion` to use this command '
    };
  }

  const result = [];
  const {startTable = null} = params;
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
      result.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`${TableNames.join('`\n`')}\``
        }
      });
    } else {
      result.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `No tables available.`
        }
      });
    }
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
    response_type: 'in_channel',
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
