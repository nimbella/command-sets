// jshint esversion: 9

// connect this workspace to the portal given a workspace name
// and an account token. The account token can be found in the portal
// user-interface under Settings and Services
async function _command(params, commandText, secrets = {}) {
  const {
    name,
    account_token
  } = params;

  const axios = require('axios');
  const { data } = await axios.post('https://accounts-api.nimbella.io:3400/v1/service', {
    commander: {
      workspaceName: name,
      accountToken: account_token,
      teamName: params.__client.team_id
   }
  });

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: "Connect: " + JSON.stringify(data.result)
  };
}

const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    // To get more info, run `/nc activation_log` after your command executes
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
