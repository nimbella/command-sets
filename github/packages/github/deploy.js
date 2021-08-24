// jshint esversion: 9

const axios = require('axios');
/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
 async function _command(params, commandText, secrets = {}) {
    const {
        // event here is the event type specified under github action.
        // See https://docs.github.com/en/actions/reference/events-that-trigger-workflows#repository_dispatch for more info
        event
    } = params;

    var options = {
        headers: {
            Authorization: 'token ' + secrets.github_token,
            Accept: 'application/vnd.github.everest-preview+json'
        },
    };
    try {
        await axios.post(`https://api.github.com/repos/${secrets.user}/${secrets.repo}/dispatches`,
            { event_type: event }, options);
        return {
            response_type: 'in_channel',
            text: "Deployed github action having the event: " + event
        };
    } catch (e) {
        return {
            response_type: 'in_channel',
            text: e.message
        };
    }
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async (args) => ({
    body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
        // To get more info, run `/nc activation_log` after your command executes
        response_type: 'ephemeral',
        text: `Error: ${error.message}`
    }))
});

module.exports = main;


// repository_dispatch:
// branches: [ master ]
// types: [ accounts-prod ]