// jshint esversion: 9

/**
 * @description View GitHub command set documentation
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const baseUrl =
    'https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots';

  const image = (source, alt) => ({
    type: 'image',
    title: {
      type: 'plain_text',
      text: alt,
      emoji: true
    },
    image_url: source,
    alt_text: alt
  });

  const section = text => ({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text
    }
  });

  return {
    response_type: 'in_channel',
    blocks: [
      section(
        'Nimbella Commander GitHub Command Set.\
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
      \nSet up a Personal Access Token on GitHub with repo access.\
      \nSave the token as a secret with the key `github_token`\
      \nCreate secrets using.\
      \n `/nc secret_create`\
      \n<https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line|Click> to learn how to setup a Personal Access Token on GitHub\
      \n\n\n*Usage*:'
      ),
      //
      section(
        '*Creating an issue:* \n`/nc github_create_issue <repo> <title> <body>`'
      ),
      image(`${baseUrl}/create_issue.png`, 'github create issue command'),
      //
      section(
        '*Closing an issue:* \n`/nc github_close_issue <repo> <issue_number>`'
      ),
      image(`${baseUrl}/close_issue.png`, 'github close issue command'),

      section(
        '*Reopening an issue:* \n`/nc github_reopen_issue <repo> <issue_number>`'
      ),
      image(`${baseUrl}/reopen_issue.png`, 'github reopen issue command'),
      //
      section(
        '*Finding a pull request by date:* \n`/nc github_find_pr <repo> <date>`'
      ),
      image(`${baseUrl}/find_pr.png`, 'github find_pr command'),
      //
      section(
        '*Labeling an issue or pull request:* \n`/nc github_label <repo> <number> <labels>`'
      ),
      image(`${baseUrl}/label.png`, 'github label command'),
      //
      section('*Getting repository statistics:* \n`/nc github_stats <repo>`'),
      image(`${baseUrl}/stats.png`, 'github stats command'),
      //
      {
        type: 'divider'
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text:
              '👀 View recent pull requests with `/nc github_view_pr <repo>`\n❓Get help on these commands with `/nc github`'
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
