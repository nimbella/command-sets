// jshint esversion: 9

/**
 * @description Show help for Shopify Command Set.
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const axios = require('axios');
  const {data} = await axios.get(
    'https://raw.githubusercontent.com/nimbella/command-sets/master/shopify/README.md'
  );

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: data
      // Remove TOC and Installation section
      .replace(/\n-\s\[Installation.*csm_install\sshopify\n\`\`\`\n/gs, '')
      // Remove Images
      .replace(/\!\[(.*)\]\((.*)\)/g, '')
      // Remove internal links
      .replace(/\[(.*)\]\(#(.*)\)/g, '$1')
      // Convert markdown links to slack format.
      .replace(/\[(.*)\]\((.*)\)/g, '<$2|$1>')
      // Replace markdown headings with slack bold
      .replace(/#+\s(.+)(?:\R(?!#(?!#)).*)*/g, '*$1*')
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
