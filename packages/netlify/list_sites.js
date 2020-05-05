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

  try {
    const URL = `https://api.netlify.com/api/v1/sites?access_token=${netlifyToken}`;
    const {data} = await axios.get(URL);

    for (const site of data) {
      // const body = [
      //   `Deploy URL: ${site.published_deploy.deploy_ssl_url}`,
      //   `Deploy commit: <${site.published_deploy.commit_url}|${site.published_deploy.commit_ref}>`,
      //   `Last deployed using ${site.git_provider} on <!date^${
      //     new Date(site.published_deploy.published_at).getTime() / 1000
      //   }^{date_short} at {time}|${site.published_deploy.published_at}>`
      // ];

      result.push({
        color: 'good',
        author_name: site.name,
        author_link: site.ssl_url,
        text: `Deploy URL: \`${site.deploy_url}\``,
        footer: site.name,
        image_url: site.screenshot_url
      });
    }
  } catch (error) {
    result.push({
      color: 'danger',
      text: `Error: ${error.message}`
    });
  }

  return {
    response_type: 'in_channel',
    attachments: result
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
