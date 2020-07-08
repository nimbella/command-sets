// jshint esversion: 9

/**
 * @description Run the user command
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {K8_TOKEN, K8_APISERVER, K8_CA} = secrets;
  if (!K8_TOKEN || !K8_APISERVER || !K8_CA) {
    return {
      response_type: 'ephemeral',
      text:
        `Secrets named \`K8_TOKEN\`, \`K8_APISERVER\` & \`K8_CA\` with the ` +
        `access token, the address of your kubernetes cluster, and certificate ` +
        `authority data respectively are required to run this command set.`
    };
  }

  const result = [];
  const {objectName = 'pods', namespace = 'default'} = params;
  const https = require('https');
  const prettyMS = require('pretty-ms');
  const axios = require('axios');
  let requestURL = `${K8_APISERVER}/api/v1/namespaces/${namespace}/${objectName}`;

  if (objectName.trim() === 'nodes') {
    requestURL = `${K8_APISERVER}/api/v1/nodes`;
  }

  const {data} = await axios.get(requestURL, {
    httpsAgent: new https.Agent({
      ca: Buffer.from(K8_CA, 'base64')
    }),
    headers: {
      Authorization: `Bearer ${K8_TOKEN}`
    }
  });

  if (data.items.length === 0) {
    result.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `No resources found.`
      }
    });
  }

  for (const item of data.items) {
    if (objectName.trim() === 'pods') {
      let containerReady = 0;
      let restartCount = 0;
      const podAge = prettyMS(
        Date.now() - new Date(item.metadata.creationTimestamp).getTime(),
        {secondsDecimalDigits: 0}
      );

      for (const container of item.status.containerStatuses) {
        if (container.ready) {
          containerReady++;
        }
        restartCount += container.restartCount;
      }

      result.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `\`${item.metadata.name}\` \`READY: ${containerReady}/${item.status.containerStatuses.length}\` \`STATUS: ${item.status.phase}\` \`AGE: ${podAge}\` \`RESTARTS: ${restartCount}\``
          }
        ]
      });
    } else if (objectName.trim() === 'nodes') {
      const nodeAge = prettyMS(
        Date.now() - new Date(item.metadata.creationTimestamp).getTime(),
        {secondsDecimalDigits: 0}
      )
        .split(' ')
        .join('');
      let nodeStatus = '';
      for (const condition of item.status.conditions) {
        if (condition.status === 'True') {
          nodeStatus = condition.type;
          break;
        }
      }

      result.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `\`${item.metadata.name}\` \`STATUS: ${nodeStatus}\` \`AGE: ${nodeAge}\` \`VERSION: ${item.status.nodeInfo.kubeletVersion}\``
          }
        ]
      });
    }
  }

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    blocks: result
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
    // To get more info, run `/nc activation_log` after your command executes
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports.main = main;
