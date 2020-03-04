'use strict';

/**
 * @description undefined
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params = {}, commandText, secrets = {}) {
  const {bluejeansAppKey, bluejeansAppSecret} = secrets;
  if (!bluejeansAppKey || !bluejeansAppSecret) {
    return {
      response_type: 'ephemeral',
      text: `You need secrets \`bluejeansAppKey\` & \`bluejeansAppSecret\` to be able to run this command.`
    };
  }

  const {title = '', desc = '', emails = '', start = '', end = ''} = params;
  if (!title || !emails || !start || !end) {
    return {
      response_type: 'ephemeral',
      text: `Params \`-title\`, \`-emails\`, \`-start\` and \`-end\` are essential to schedule a meeting.`
    };
  }

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (endTime <= startTime) {
    return {
      response_type: 'ephemeral',
      text: `Meeting \`-end\` time cannot be before or same as \`-start\` time.`
    };
  }

  const result = [];
  const baseURL = `https://api.bluejeans.com`;
  const axios = require('axios');

  // Fetch access token
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
  const requestURL =
    baseURL +
    users[0].uri +
    `/scheduled_meeting?email=true&access_token=${data.access_token}`;

  const attendees = [];
  for (const email of emails.split(',')) {
    attendees.push({email});
  }

  const {data: meeting} = await axios.post(requestURL, {
    title: title,
    description: desc ? desc : '',
    timezone: 'America/New_York',
    start: startTime,
    end: endTime,
    attendees: attendees,
    endPointType: 'WEB_APP',
    endPointVersion: '2.10'
  });

  result.push(`#### ${meeting.title}`);
  result.push(`${meeting.description}`);

  result.push(
    `**Start**: ${new Date(meeting.start).toUTCString()} **End:** ${new Date(
      meeting.end
    ).toUTCString()}`
  );

  let attendeesOutput = '**Attendees:** ';
  for (const attendee of meeting.attendees) {
    attendeesOutput += `\`${attendee.email}\` `;
  }

  result.push(attendeesOutput);
  result.push(`**Link:** https://bluejeans.com/${meeting.numericMeetingId}`);

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
const main = async ({__secrets = {}, commandText, ...params}) => ({
  body: await _command(params, commandText, __secrets).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
