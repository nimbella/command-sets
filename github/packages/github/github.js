// jshint esversion: 9

/**
 * @description View GitHub command set documentation
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
const axios = require('axios');

async function _command(params, commandText, secrets = {}) {

  return {
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Nimbella Commander GitHub Command Set.\
          \n_A Nimbella Commander command set for interfacing with GitHub._\
          \n\n*Features*:\
          \n• Create an issue\
          \n• Close an issue\
          \n• Reopen an issue\
          \n• Find pull requests by date\
          \n• Label an issue/pull request\
          \n• Request someone to review a pull request\
          \n• View repository community statistics\
          \n• View recent pull requests\
          \n• View GitHub command set documentation\
          \n\n*Requirements*:\
          \nYou need to set up a Personal Access Token on GitHub with repo access. And save the token as a secret with the key `github_token`\
          \ntype `/nc secret_create` to create secrets.\
          \n<https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line|Click> to learn how to setup a Personal Access Token on GitHub\
          \n\n*Usage*:"
        }
      },
      // 
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Creating an issue:* /n`/nc github_create_issue <repo> <title> <body>`"
        }
      },
      {
        "type": "image",
        "title": {
          "type": "plain_text",
          "text": "github create issue command",
          "emoji": true
        },
        "image_url": "https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/create_issue.png",
        "alt_text": "github create issue command"
      },
      // 
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Closing an issue:* /n`/nc github_close_issue <repo> <issue_number>`"
        },
      },
      {
        "type": "image",
        "title": {
          "type": "plain_text",
          "text": "github close issue command",
          "emoji": true
        },
        "image_url": "https://raw.githubusercontent.com/bhageena/command-sets/github/github/screenshots/close_issue.png",
        "alt_text": "github close issue command"
      },
      
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Reopening an issue:* /n`/nc github_reopen_issue <repo> <issue_number>`"
        }
      },
      {
        "type": "image",
        "title": {
          "type": "plain_text",
          "text": "github reopen issue command",
          "emoji": true
        },
        "image_url": "https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/reopen_issue.png",
        "alt_text": "github reopen issue command"
      },
      // 
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Finding a pull request by date:* /n`/nc github_find_pr <repo> <date>`"
        }
      },
      {
        "type": "image",
        "title": {
          "type": "plain_text",
          "text": "github find_pr command",
          "emoji": true
        },
        "image_url": "https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/find_pr.png",
        "alt_text": "github find_pr command"
      },
      // 
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Labeling an issue or pull request:* /n`/nc github_label <repo> <number> <labels>`"
        }
      },
      {
        "type": "image",
        "title": {
          "type": "plain_text",
          "text": "github label command",
          "emoji": true
        },
        "image_url": "https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/label.png",
        "alt_text": "github label command"
      },
      // 
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Getting repository statistics:* /n`/nc github_stats <repo>`"
        }
      },
      {
        "type": "image",
        "title": {
          "type": "plain_text",
          "text": "github stats command",
          "emoji": true
        },
        "image_url": "https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/stats.png",
        "alt_text": "github stats command"
      },
      //      
      {
        "type": "divider"
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": "👀 View recent pull requests with `/nc github_view_pr <repo>`\n❓Get help on these commands with `/nc github`"
          }
        ]
      }
    ]
  };
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
