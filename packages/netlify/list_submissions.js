// jshint esversion: 9

/**
 * @description null
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

  const axios = require('axios');
  const result = [];
  let {skip = false, filter = false} = params;
  skip = skip === false ? 0 : Number(skip);

  try {
    const URL = `https://api.netlify.com/api/v1/submissions?access_token=${netlifyToken}`;
    const {data} = await axios.get(URL);

    if (filter) {
      const filterResults = [];
      // Filter the results
      for (const submission of data) {
        const body = [];
        for (const [key, value] of Object.entries(submission.human_fields)) {
          if (value) body.push(`${key}: \`${value}\``);
        }
        body.push(`Form: \`${submission.form_name}\``);
        body.push(`Site: \`${submission.site_url}\``);

        if (body.join('\n').includes(filter)) {
          filterResults.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: body.join('\n')
            }
          });
          continue;
        }
      }

      const loopLength =
        filterResults.length < skip + 5 ? filterResults.length : skip + 5;
      // Push them to output based on skip
      for (let i = skip; i < loopLength; i++) {
        result.push(filterResults[i]);
      }

      if (filterResults.length > 0) {
        result.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Showing: ${skip + 1}-${loopLength} Found: *${
              filterResults.length
            }*`
          }
        });
      } else {
        result.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Couldn't find \`${filter}\`.`
          }
        });
      }
    } else {
      const loopLength = data.length < skip + 5 ? data.length : skip + 5;
      for (let i = skip; i < loopLength; i++) {
        const submission = data[i];
        const body = [];

        for (const [key, value] of Object.entries(submission.human_fields)) {
          if (value) body.push(`${key}: \`${value}\``);
        }

        body.push(`Form: \`${submission.form_name}\``);
        body.push(`Site: \`${submission.site_url}\``);

        result.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: body.join('\n')
          }
        });
      }

      if (data.length > 0) {
        result.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Showing: ${skip + 1}-${loopLength} Total: *${data.length}*`
          }
        });
      } else {
        result.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Couldn't find any submissions under your account.`
          }
        });
      }
    }
  } catch (error) {
    result.push({
      color: 'danger',
      text: `Error: ${error.message}`
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
