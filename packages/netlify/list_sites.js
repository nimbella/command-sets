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

  let {skip} = params;
  skip = skip === false ? 0 : Number(skip);

  const axios = require('axios');
  const result = [];

  try {
    const URL = `https://api.netlify.com/api/v1/sites?access_token=${netlifyToken}`;
    const {data} = await axios.get(URL);

    const loopLength = data.length < skip + 5 ? data.length : skip + 5;
    for (let i = skip; i < loopLength; i++) {
      const site = data[i];
      const body = [
        `*<${site.ssl_url}|${
          site.custom_domain ? site.custom_domain : site.name
        }>*`,
        `Site ID: \`${site.site_id}\``,
        `Managed DNS: \`${site.managed_dns}\``
      ];

      if (site.published_deploy && site.published_deploy.commit_url) {
        body.push(
          `Deploy commit: \`<${
            site.published_deploy.commit_url
          }|${site.published_deploy.commit_ref.slice(0, 7)}>\``
        );
      }

      if (site.deploy_id) {
        body.push(`Deploy ID: \`${site.deploy_id}\``);
      }

      if (site.published_deploy) {
        body.push(`Deploy URL: \`${site.published_deploy.deploy_ssl_url}\``);
        body.push(
          `Last deployed ${
            site.committer
              ? 'by ' +
                `<https://github.com/${site.committer}|${site.committer} `
              : ''
          }on *<!date^${new Date(site.published_deploy.published_at)
            .getTime()
            .toString()
            .slice(0, -3)}^{date_short} at {time}|${
            site.published_deploy.published_at
          }>*`
        );
      }

      result.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: body.join('\n')
        },
        accessory: {
          type: 'image',
          image_url: site.screenshot_url,
          alt_text: site.name
        }
      });
    }

    result.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Showing: ${skip + 1}-${loopLength} Total: ${data.length}`
      }
    });
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
