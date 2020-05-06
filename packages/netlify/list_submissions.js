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
        'A secret named `netlifyToken` is required to run this command. Grab your Netlify token and run `/nc secret_create` to get a link to the secret creator.',
    };
  }

  const axios = require('axios');
  const result = [];
  let {skip = false, filter = false} = params;
  skip = skip === false ? 0 : skip;

  try {
    const URL = `https://api.netlify.com/api/v1/submissions?access_token=${netlifyToken}`;
    const {data} = await axios.get(URL);

    const totalForms =
      data.length - Number(skip) > 10 ? Number(skip) + 10 : data.length;
    result.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Showing: ${skip}-${totalForms} Total: *${data.length}*`,
      },
    });

    for (let i = skip; i < totalForms; i++) {
      const submission = data[i];
      const body = [];

      for (const [key, value] of Object.entries(submission.human_fields)) {
        if (value) body.push(`${key}: \`${value}\``);
      }

      body.push(`Form: \`${submission.form_name}\``);
      body.push(`Site: \`${submission.site_url}\``);

      if (filter) {
        if (body.join('\n').includes(filter)) {
          result.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: body.join('\n'),
            },
          });
          continue;
        }
      } else {
        result.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: body.join('\n'),
          },
        });
      }
    }
  } catch (error) {
    result.push({
      color: 'danger',
      text: `Error: ${error.message}`,
    });
  }

  return {
    response_type: 'in_channel',
    blocks: result,
  };
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */
const main = async (args) => ({
  body: await _command(
    args.params,
    args.commandText,
    args.__secrets || {}
  ).catch((error) => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`,
  })),
});
module.exports = main;
