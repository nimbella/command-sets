/**
 * A small function that converts slack elements `context` and `section` to mattermost compatible markdown.
 * @param {object} element - Slack element
 * @param {boolean} isSlack - boolean value
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
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {awsAccessKey, awsSecretKey, awsRegion} = secrets;
  const {__client} = params;

  const client = __client.name;

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

    if (DBInstances.length > 0) {
      for (const instance of DBInstances) {
        result.push(
          mui(
            {
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
            },
            client
          )
        );
      }
    } else {
      result.push(
        mui(
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `No instances under your account.`
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
