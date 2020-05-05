// jshint esversion: 9

/**
 * @description Access all deploys of a site.
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {netlifyToken} = secrets;
  if (!netlifyToken) {
    return {
      response_type: 'ephemeral',
      text:
        'A secret named `netlifyToken` is required to run this command. Grab your Netlify token and run `/nc secret_create` to get a link to the secret creator.'
    };
  }

  let {site = '', skip = 0} = params;
  // Handle slack escaping
  site = site.startsWith('<') ? site.split('|')[1].slice(0, -1) : site;

  const axios = require('axios');
  const result = [];

  try {
    let URL = `https://api.netlify.com/api/v1/forms?access_token=${netlifyToken}`;
    if (site) {
      URL = `https://api.netlify.com/api/v1/sites/${site}/forms?access_token=${netlifyToken}`;
    }

    const {data} = await axios.get(URL);

    if (data.length === 0) {
      result.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Couldn't find any forms.`
        }
      });
    }

    for (const form of data) {
      const body = [
        `Form: *${form.name}*`,
        `Total Submissions: ${form.submission_count}`,
        `Last submission on *<!date^${Number(
          new Date(form.last_submission_at).getTime().toString().slice(0, -3)
        )}^{date_short} at {time}|${form.last_submission_at}>*`
      ];

      result.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: body.join('\n')
        }
      });
    }
  } catch (error) {
    result.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Error: ${error.message}`
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
