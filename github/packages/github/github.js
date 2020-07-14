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
      \n• Label an issue/pull request\
      \n• Request someone to review a pull request\
      \n• View repository community statistics\
      \n• Search repositories, commits, code, issues, pull requests, users, topics matching given words\
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
        '*Labeling an issue or pull request:* \n`/nc github_label <repo> <number> <labels>`'
      ),
      image(`${baseUrl}/label.png`, 'github label command'),
      //
      section('*Getting repository statistics:* \n`/nc github_stats <repo>`'),
      image(`${baseUrl}/stats.png`, 'github stats command'),
      //
      section('*Searching repositories, commits, code, issues, pull requests, users and topics using keywords:* \n`/nc github_search <entity> <keywords> [-q <query>] [-r <repositories>] [-l <language>] [-s <pageSize>] [-n <pageNumber>]`\nEntity can be passed in as an abbreviation:\
      \n r  - repositories\
      \n cm - commits\
      \n c  - code \
      \n i  - issues\
      \n p  - pull requests\
      \n u  - users \
      \n t  - topics\
      \nMultiple search words can be combined using `+` sign. e.g. `atom+design`\
      \n\nOptionally following options can be provided for more specific search\
      \n- [-q <query>] query can be formed using <https://help.github.com/en/github/searching-for-information-on-github/understanding-the-search-syntax | github search syntax>\. In order to avoid having to type in repository names every time command needs to run, default repositories can be specified using `\\nc secret_create`\
      \n- [-r <repositories>] specific repositories can be given e.g. `-r microsoft/vscode,nimbella/command-sets`\
      \n- [-l <language>] specific language can be mentioned e.g. `-l python`\
      \n- [-s <pageSize>] number of records to be fetched in one go e.g. `-s 10`\
      \n- [-n <pageNumber>] next set of records can be fetched using e.g. `-n 2`\
      '),
      image(`${baseUrl}/search.png`, 'github search command'),
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
              '❓Get help on these commands with `/nc github`'
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
