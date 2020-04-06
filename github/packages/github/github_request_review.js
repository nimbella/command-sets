// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
const axios = require('axios');

async function postRequest(url, secrets, reviewers) {

    return (axios({
        method: "post",
        url: url,
        data: {
            reviewers: reviewers
        },
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
    pr_number,
    reviewers
  } = params;

  const url = `https://api.github.com/repos/${repo}/pulls/${pr_number}/requested_reviewers`;
  const data = await postRequest(url, secrets, reviewers.split(', '));

  if (data.response) {
    return {
      response_type: 'in_channel',
      text: data.response.headers.status
    };
  } else {
    return { attachments: [{
      color: 'good',
      title: data.body && !data.body.includes('http') ? data.body : 'Link',
      title_link: data.html_url,
      pretext: `${reviewers} has been requested to review pull request #${data.number}: ${data.title}`
    }] };
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
