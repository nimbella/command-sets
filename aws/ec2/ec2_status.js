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
      response_type: 'ephemeral', // eslint-disable-line camelcase
      text:
        'You need `awsAccessKey`, `awsSecretKey` and `awsRegion` secrets to use this command. Create one by running `/nc secret_create`.'
    };
  }

  const {id: instanceId} = params;
  const result = [];
  const aws = require('aws-sdk');
  const ec2 = new aws.EC2({
    apiVersion: '2016-11-15',
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
    region: awsRegion
  });

  try {
    const {promisify} = require('util');
    const describeInstanceStatusAsync = promisify(
      ec2.describeInstanceStatus
    ).bind(ec2);

    const {InstanceStatuses} = await describeInstanceStatusAsync({
      DryRun: false,
      InstanceIds: [instanceId]
    });

    for (const instance of InstanceStatuses) {
      result.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `ID: \`${instance.InstanceId}\``
          },
          {
            type: 'mrkdwn',
            text: `State: \`${instance.InstanceState.Name}\``
          },
          {
            type: 'mrkdwn',
            text: `InstanceStatus: \`${instance.InstanceStatus.Status}\``
          },
          {
            type: 'mrkdwn',
            text: `SystemStatus: \`${instance.SystemStatus.Status}\``
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
