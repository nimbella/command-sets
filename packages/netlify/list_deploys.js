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

  let {site, skip = 0} = params;
  // Handle slack escaping
  site = site.startsWith('<') ? site.split('|')[1].slice(0, -1) : site;
  skip = skip === false ? 0 : skip;

  const axios = require('axios');
  const result = [];

  try {
    const URL = `https://api.netlify.com/api/v1/sites/${site}/deploys?access_token=${netlifyToken}`;
    const {data} = await axios.get(URL);

    for (
      let i = skip > data.length ? 0 : skip;
      i < (data.length < 20 ? data.length : 20);
      i++
    ) {
      const site = data[i];
      const body = [
        `Build ID: \`${site.build_id}\``,
        `State: \`${site.state}\``,
        `Commit: \`<${site.commit_url}|${site.commit_ref.slice(0, 7)}>\``,
        `Deploy Time: ${site.deploy_time + 's' || 'not available'}`,
        `Deployed on <!date^${Number(
          new Date(site.updated_at).getTime().toString().slice(0, -3)
        )}^{date_short} at {time}|${site.updated_at}>`
      ];

      result.push({
        color: site.state === 'error' ? 'danger' : 'good',
        title: site.title,
        text: body.join('\n')
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
