// jshint esversion: 9

/**
 * @description undefined
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {jiraOrgUrl, jiraApiKey, jiraUserEmail, jiraDefaultProject} = secrets;
  if (!jiraOrgUrl || !jiraApiKey || !jiraUserEmail) {
    return {
      response_type: 'ephemeral',
      text: `We need secrets named \`jiraOrgUrl\`, \`jiraApiKey\`, and \`jiraUserEmail\` to run this command. Create them by running \`/nc secret_create\`.`
    };
  }

  const {
    title = false,
    desc = false,
    project = jiraDefaultProject,
    type = false
  } = params;

  if (!title || !type || !project) {
    return {
      response_type: 'ephemeral',
      text: `-title, -type & -project (ignore if you've created \`jiraDefaultProject\` secret) are required flags to create an issue. `
    };
  }

  const axios = require('axios');
  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${jiraUserEmail}:${jiraApiKey}`
    ).toString('base64')}`,
    Accept: 'application/json'
  };

  let issueTypeId;
  let projectId;

  // Get project ID & issuetype ID
  const {
    data: {projects}
  } = await axios.get(jiraOrgUrl + '/rest/api/3/issue/createmeta', {
    headers
  });
  for (const prj of projects) {
    if (project.toLowerCase() === prj.key.toLowerCase()) {
      for (const issuetype of prj.issuetypes) {
        if (type.toLowerCase() === issuetype.name.toLowerCase()) {
          projectId = prj.id;
          issueTypeId = issuetype.id;
          break;
        }
      }
      break;
    }
  }

  const body = {
    fields: {
      summary: title,
      issuetype: {
        id: issueTypeId
      },
      project: {
        id: projectId
      }
    }
  };

  if (desc) {
    body.fields.description = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              text: desc,
              type: 'text'
            }
          ]
        }
      ]
    };
  }

  // Create issue
  const {data} = await axios.post(jiraOrgUrl + '/rest/api/3/issue', body, {
    headers
  });

  return {
    response_type: 'in_channel',
    text: `Created <${jiraOrgUrl}/browse/${data.key}|${data.key}>.`
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
