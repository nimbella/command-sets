'use strict';

/**
 * A small function that converts slack elements `context` and `section` to mattermost compatible markdown.
 * @param {object} element - Slack element
 * @param {string} client - name of the client
 */
const mui = (element, client) => {
  if (client === 'slack') {
    return element;
  }

  const output = [];
  if (element.type === 'context') {
    for (const item of element.elements) {
      output.push(item.text.replace(/\*/g, '**'));
    }
  } else if (element.type === 'section') {
    output.push(element.text.text.replace(/\*/g, '**'));
  }

  return output.join(' ');
};

// To enable the platform to cache the module when possible.
let Vultr;

/**
 * Install NPM packages.
 * @param {string} pkgName - The name of the package to be installed.
 */
async function install(pkgName) {
  return new Promise((resolve, reject) => {
    const {exec} = require('child_process');
    exec(`npm install ${pkgName}`, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

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

  const {__slack_headers: clientHeaders} = params;
  const getClient = () => {
    if (clientHeaders['user-agent'].includes('Slackbot')) {
      return 'slack';
    }

    return 'mattermost';
  };

  const client = getClient();

  // This array is used to store slack blocks.
  const result = [];

  try {
    if (!Vultr) {
      await install('@vultr/vultr-node');
      Vultr = require('@vultr/vultr-node');
    }

    const {server} = Vultr.initialize({apiKey: vultrApiKey});

    const data = await server.list();
    for (const [key, value] of Object.entries(data)) {
      const {main_ip, status, label} = value;
      result.push(
        mui(
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `ID: ${key}`
              },
              {
                type: 'mrkdwn',
                text: `IP: \`${main_ip}\``
              },
              {
                type: 'mrkdwn',
                text: `Status: *${status}*`
              },
              {
                type: 'mrkdwn',
                text: `${label}`
              }
            ]
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
            text: `*Error*: ${error.message}`
          }
        },
        client
      )
    );
  }

  return {
    // Or `ephemeral` for private response
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
