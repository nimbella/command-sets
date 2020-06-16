// jshint esversion: 9

let OAuth;
async function install(pkgs) {
  pkgs = pkgs.join(' ');
  return new Promise((resolve, reject) => {
    const {exec} = require('child_process');
    exec(`npm install ${pkgs}`, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

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

  if (!OAuth) {
    await install(['oauth-1.0a']);
  }

  let {usernames} = params;
  usernames = usernames.split(',').map(username => username.trim());

  const result = [];
  const axios = require('axios');
  const crypto = require('crypto');
  OAuth = require('oauth-1.0a');

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

  for (const username of usernames) {
    result.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Tweets of <https://twitter.com/${username}|@${username}>:*`
      }
    });

    const url = `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${username}`;
    const {data} = await axios.get(url, {
      headers: oauth.toHeader(oauth.authorize({url, method: 'GET'}, token))
    });

    for (let i = 0; i < (data.length > 5 ? 5 : data.length); i++) {
      const tweet = data[i];
      const created = new Date(tweet.created_at);
      result.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*${tweet.text}*`
          },
          {
            type: 'mrkdwn',
            text: `_Tweeted on <!date^${
              created.getTime() / 1000
            }^{date_short} at {time}|${tweet.created_at}>_`
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
    text: `Error: ${error}`
  }))
});
module.exports = main;
