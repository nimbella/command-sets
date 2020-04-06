// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
const axios = require('axios');

async function closeIssue(url, secrets) {

    return (axios({
        method: "patch",
        url: url,
        data: {state: 'closed'},
        headers: {
            Authorization: `Bearer ${secrets.github_token}`,
            "Content-Type": "application/json"
        }})
        .then(res => { return res.data; })
        .catch(err => { return err; }));
}

async function _command(params, commandText, secrets = {}) {

  if (!secrets.github_token) {
    return {
      response_type: 'in_channel',
      text: 'Missing GitHub Personal Access Token!'
    };
  }
  const {
    repo,
    issue_number
  } = params;
  const url = `https://api.github.com/repos/${repo}/issues/${issue_number}`;
  const data = await closeIssue(url, secrets);

  if (data.response) {
    return {
      response_type: 'in_channel',
      text: data.response.headers.status
    };
  } else {
    return { attachments: [{
      color: data.state == 'open' ? 'good' : 'danger',
      title: `${repo}\nIssue #${issue_number}\n${data.title}`,
      title_link: data.html_url,
      pretext: `Issue #${issue_number} for ${repo} has been closed.`
    }]};
  }
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports.main = main;
