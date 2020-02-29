'use strict';

/**
 * @description undefined
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {bluejeansAppKey, bluejeansAppSecret} = secrets;
  if (!bluejeansAppKey || !bluejeansAppSecret) {
    return {
      response_type: 'ephemeral',
      text: `You need secrets \`bluejeansAppKey\` & \`bluejeansAppSecret\` to be able to run this command.`
    };
  }

  const {title = '', desc = '', emails = '', start = '', end = ''} = params;
  const result = [];
  const baseURL = `https://api.bluejeans.com`;
  const axios = require('axios');

  // Fetch access_token
  const {data} = await axios.post(baseURL + '/oauth2/token?Client', {
    grant_type: 'client_credentials',
    client_id: bluejeansAppKey,
    client_secret: bluejeansAppSecret
  });

  // Fetch users
  const {
    data: {users}
  } = await axios.get(
    baseURL +
      `/v1/enterprise/${data.scope.enterprise}/users?access_token=${data.access_token}`
  );

  // Create a meeting
  let requestURL =
    baseURL +
    `/v1/user/${users[0].id}/scheduled_meeting?access_token=${data.access_token}?personal_meeting=true`;

  const attendees = [];
  for (const email of emails.split(',')) {
    attendees.push({email});
  }

  const {data: meeting} = await axios.post(requestURL, {
    title: title,
    description: desc,
    timezone: 'America/New_York',
    start: Math.round(new Date(start).getTime()),
    end: Math.round(new Date(end).getTime()),
    attendees: attendees,
    endPointType: 'WEB_APP',
    endPointVersion: '2.10'
  });

  result.push(`#### ${meeting.title}`);
  result.push(`${meeting.description}`);

  // TODO: Show proper timings.
  result.push(
    `**Start**: ${new Date(meeting.start).toLocaleString(
      'en-US'
    )} **End:** ${new Date(meeting.end).toLocaleString('en-US')}`
  );

  let attendeesOutput = '**Attendees:**';
  for (const attendee of meeting.attendees) {
    attendeesOutput += `\`${attendee.email}\` `;
  }

  result.push(attendeesOutput);

  return {
    response_type: 'in_channel', // eslint-disable-line camelcase
    text: result.join('\n')
  };
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */
const main = async ({params, commandText, __secrets}) => ({
  body: await _command(params, commandText, __secrets || {}).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
