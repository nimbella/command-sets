// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
const axios = require('axios');

async function getRequest(url, secrets) {

  return (axios({
    method: "get",
    url: url,
    headers: {
      // Authorization: `Bearer ${secrets.github_token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3.text-match+json'
    }
  })
    .then(res => { return res.data; })
    .catch(err => { return err; }));
}

async function _command(params, commandText, secrets = {}) {
  let {
    entity, //repositories, commits, code, issues and pull requests, users, topics, labels
    keywords
  } = params;

  switch (entity) {
    case 'p':
    case 'pr':
    case 'prs':
    case 'i':
    case 'is':
    case 'issue':
      entity = 'issues'
      break;
    case 'r':
    case 'rep':
    case 'repo':
    case 'repos':
      entity = 'repositories'
      break;
    case 'u':
    case 'user':
      entity = 'users'
      break;
    default:
      break;
  }
  const url = `https://api.github.com/search/${entity}?q=${keywords}`;
  const data = await getRequest(url, secrets);

  if (data.response) {
    return {
      response_type: 'in_channel',
      text: data.response.headers.status
    };
  } else {
    return success(`${entity} with keywords ${keywords}`, data.items);
  }
}

const success = (header, items) => {

  const response = {
    response_type: 'in_channel',
    blocks: [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${header}*`,
      },
    },
    ],
  };

  items.forEach(item => {
    response.blocks.push(
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `<${item.html_url}|${item.full_name}>`,
          },
          {
            type: 'mrkdwn',
            text: `:star: ${item.stargazers_count} \n :mag: ${item.watchers_count} \n :fork_and_knife: ${item.forks_count}`,
          },
          {
            type: 'mrkdwn',
            text: `${item.description}`,
          },

        ],
      },

    );
  })

  response.blocks.push({
    type: 'context',
    elements: [{
      type: 'mrkdwn',
      text: 'add _github command-set_ to your Slack with <https://nimbella.com/product/commander/ | Commander>',
    }],
  })
  return response;
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
module.exports = main;
