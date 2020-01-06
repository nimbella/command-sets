/**
 * @description undefined
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {awsAccessKey, awsSecretKey, awsRegion} = secrets;
  const {id: instanceID} = params;
  if (!awsAccessKey || !awsSecretKey || !awsRegion) {
    return {
      response_type: 'ephemeral',
      text:
<<<<<<< HEAD
        'You need `awsAccessKey`, `awsSecretKey` and `awsRegion` secrets to use this command. Create one by running `/nc secret_create`.'
=======
        'You must create secrets for `awsAccessKey`, `awsSecretKey` and `awsRegion` to use this command '
>>>>>>> refactor: restructure aws commands
    };
  }

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
    const rebootInstancesAsync = promisify(ec2.rebootInstances).bind(ec2);

    const data = await rebootInstancesAsync({
      DryRun: false,
      InstanceIds: [instanceID]
    });

    if (data !== null) {
      result.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Reboot request successful for \`${instanceID}\``
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
