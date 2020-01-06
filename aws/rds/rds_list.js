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
        'You need `awsAccessKey`, `awsSecretKey` and `awsRegion` secrets to use this command. Create them by running `/nc secret_create`.'
    };
  }

  const result = [];
  const aws = require('aws-sdk');
  const rds = new aws.RDS({
    apiVersion: '2014-10-31',
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
    region: awsRegion
  });

  try {
    const {promisify} = require('util');
    const describeDBInstancesAsync = promisify(rds.describeDBInstances).bind(
      rds
    );

    const {DBInstances} = await describeDBInstancesAsync();

    for (const instance of DBInstances) {
      result.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Identifier: \`${instance.DBInstanceIdentifier}\``
          },
          {
            type: 'mrkdwn',
            text: `Class: \`${instance.DBInstanceClass}\``
          },
          {
            type: 'mrkdwn',
            text: `Status: \`${instance.DBInstanceStatus}\``
          },
          {
            type: 'mrkdwn',
            text: `Engine: \`${instance.Engine}\``
          },
          {
            type: 'mrkdwn',
            text: `Storage: \`${instance.AllocatedStorage} GiB\``
          },
          {
            type: 'mrkdwn',
            text: `Endpoint: \`${instance.Endpoint.Address}\``
          }
        ]
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
