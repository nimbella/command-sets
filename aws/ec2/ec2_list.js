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

  const result = [];
  const {substr = ''} = params;
  const aws = require('aws-sdk');
  const ec2 = new aws.EC2({
    apiVersion: '2016-11-15',
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
    region: awsRegion
  });

  try {
    const {promisify} = require('util');
    const describeInstancesAsync = promisify(ec2.describeInstances).bind(ec2);

    const data = await describeInstancesAsync({DryRun: false});

    const {Instances} = data['Reservations'][0];
    for (const instance of Instances) {
      if (substr.length > 0) {
        // Retrieve the instance name.
        let instanceName = '';
        for (const tag of instance.Tags) {
          if (tag.Key === 'Name') {
            instanceName = tag.Value;
            break;
          }
        }

        if (instanceName.includes(substr)) {
          result.push({
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `ID: \`${instance.InstanceId}\``
              },
              {
                type: 'mrkdwn',
                text: `Type: \`${instance.InstanceType}\``
              },
              {
                type: 'mrkdwn',
                text: `State: \`${instance.State.Name}\``
              },
              {
                type: 'mrkdwn',
                text: `IP: \`${instance.PublicIpAddress}\``
              },
              {
                type: 'mrkdwn',
                text: `Name: ${instanceName}`
              }
            ]
          });
        }
      } else {
        result.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `ID: \`${instance.InstanceId}\``
            },
            {
              type: 'mrkdwn',
              text: `Type: \`${instance.InstanceType}\``
            },
            {
              type: 'mrkdwn',
              text: `State: \`${instance.State.Name}\``
            },
            {
              type: 'mrkdwn',
              text: `IP: \`${instance.PublicIpAddress}\``
            }
          ]
        });
      }
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
