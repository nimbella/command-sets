'use strict';

/**
 * @description undefined
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets) {
  const {bluejeansAppKey, bluejeansAppSecret} = secrets;
  if (!bluejeansAppKey || !bluejeansAppSecret) {
    return {
      response_type: 'ephemeral',
      text: `You need secrets \`bluejeansAppKey\` & \`bluejeansAppSecret\` to be able to run this command.`
    };
  }

  const {userId = ''} = params;
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

  // Fetch all meetings using the first user.
  const {data: meetings} = await axios.get(
    baseURL +
      `/v1/user/${
        userId ? userId : users[0].id
      }/scheduled_meeting?access_token=${data.access_token}`
  );

  if (meetings.length > 0) {
    result.push(`### Upcoming meetings`);
    result.push(`---`);

    for (const meeting of meetings) {
      // Skip this meeting if its end time is in the past.
      if (meeting.end < Date.now()) {
        continue;
      }

      result.push(`#### ${meeting.title}`);
      result.push(`${meeting.description}`);
      result.push(`**Meeting ID**: ${meeting.id}`);
      result.push(
        `**Start**: ${new Date(
          meeting.start
        ).toUTCString()} **End:** ${new Date(meeting.end).toUTCString()}`
      );

      let attendeesOutput = '**Attendees:**';
      for (const attendee of meeting.attendees) {
        attendeesOutput += `\`${attendee.email}\` `;
      }

      result.push(attendeesOutput);
      result.push(
        `**Link:** https://bluejeans.com/${meeting.numericMeetingId}`
      );
    }
  } else {
    result.push(`No upcoming meetings found.`);
  }

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
