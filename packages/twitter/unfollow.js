// jshint esversion: 9

/**
 * @description Run the user command
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {
    twitter_consumer_key,
    twitter_consumer_secret,
    twitter_access_token_key,
    twitter_access_token_secret
  } = secrets;
  if (
    !twitter_consumer_key ||
    !twitter_consumer_secret ||
    !twitter_access_token_key ||
    !twitter_access_token_secret
  ) {
    return {
      response_type: 'ephemeral',
      text: `This command requires the following secrets: \`twitter_consumer_key\`, \`twitter_consumer_secret\`, \`twitter_access_token_key\`, and \`twitter_access_token_secret\`. Please create them by running \`/nc secret_create\``
    };
  }

  const {username} = params;

  const result = [];
  const axios = require('axios');
  const crypto = require('crypto');
  const OAuth = require('oauth-1.0a');

  const oauth = OAuth({
    consumer: {
      key: twitter_consumer_key,
      secret: twitter_consumer_secret
    },
    signature_method: 'HMAC-SHA1',
    hash_function: (baseString, key) =>
      crypto.createHmac('sha1', key).update(baseString).digest('base64')
  });

  const token = {
    key: twitter_access_token_key,
    secret: twitter_access_token_secret
  };

  const url = `https://api.twitter.com/1.1/friendships/destroy.json?screen_name=${username}`;
  const {data} = await axios.post(
    url,
    {},
    {
      headers: oauth.toHeader(oauth.authorize({url, method: 'POST'}, token))
    }
  );

  console.log(data);

  result.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Unfollowed <https://twitter.com/${data.screen_name}|@${data.screen_name}>`
    }
  });

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
    text: `Error: ${error}`
  }))
});
module.exports = main;
