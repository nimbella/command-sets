# Nimbella Commander GitHub Command Set

Interact with GitHub from messaging platforms like Slack, Mattermost & Microsoft Teams using [Nimbella Commander](https://nimbella.com/product/commander).

- [Features](#Features)
- [Installation](#Installation)
- [Requirements](#Requirements)
- [Commands](#Commands)
- [Usage](#Usage)
- [Support](#support)

## Features

- Create an issue.
- Close an issue.
- Reopen an issue.
- Label an issue/pull request.
- Request someone to review a pull request.
- View repository community statistics.
- Searching repositories, commits, code, issues, pull requests, users and topics using given words.

## Installation

Please make sure Commander is installed in your [Slack workspace](https://slack.com/apps/AS833QXL0-nimbella-commander) or [other messaging platforms](../README.md#installation) before executing this Slash command.

```
/nc csm_install github
```

## Requirements

In order to use this command set, you need to set up a Personal Access Token on GitHub with repo access. And save the token as a secret with `github_token` as the key name. Use `/nc secret_create` to create secrets.

Visit [this page](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) to learn how to setup a Personal Access Token on GitHub.

Create a secret named `github_repos` to avoid passing repository (`-r`) to commands.

![Secret Creator](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/secret_creator.png)

For commands that only work with single repository the first repository in `github_repos` is used.

## Commands

- [`github`](#github) - View GitHub command set documentation.
- [`github_close_issue`](#github_close_issue) - Close an issue.
- [`github_create_issue`](#github_create_issue) - Create an issue.
- [`github_find_pr`](#github_find_pr) - Find pull requests by last update date.
- [`github_label`](#github_label) - Label an issue/pull request.
- [`github_reopen_issue`](#github_reopen_issue) - Reopen an issue.
- [`github_request_review`](#github_request_review) - Request someone to review a pull request.
- [`github_search`](#github_search) - Search repositories, commits, code, issues, pull requests, users and topics using keywords.
- [`github_stats`](#github_stats) - View repository community statistics.
- [`github_view_pr`](#github_view_pr) - View recent pull requests.

## Usage

### [`github`](https://github.com/nimbella/command-sets/blob/master/github/packages/github/github.js)

View GitHub command set documentation

```sh
/nc github
```

### [`github_close_issue`](https://github.com/nimbella/command-sets/blob/master/github/packages/github/github_close_issue.js)

Close an issue.

```sh
/nc github_close_issue <issueNumber> [-r <repo>]
```

![GitHub close_issue command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/close_issue.png)

### [`github_create_issue`](https://github.com/nimbella/command-sets/blob/master/github/packages/github/github_create_issue.js)

Create an issue.

```sh
/nc github_create_issue <title> <body> [-r <repo>]
```

![GitHub create_issue command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/create_issue.png)

### [`github_find_pr`](https://github.com/nimbella/command-sets/blob/master/github/packages/github/github_find_pr.js)

Find pull requests by last update date.

```sh
/nc github_find_pr <date> [-r <repo>] [-state <state>]
```

### [`github_label`](https://github.com/nimbella/command-sets/blob/master/github/packages/github/github_label.js)

Label an issue/pull request.

```sh
/nc github_label <issueNumber> <labels> [-r <repo>]
```

![GitHub label command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/label.png)

### [`github_reopen_issue`](https://github.com/nimbella/command-sets/blob/master/github/packages/github/github_reopen_issue.js)

Reopen an issue.

```sh
/nc github_reopen_issue <issueNumber> [-r <repo>]
```

![GitHub reopen_issue command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/reopen_issue.png)

### [`github_request_review`](https://github.com/nimbella/command-sets/blob/master/github/packages/github/github_request_review.js)

Request someone to review a pull request

```sh
/nc github_request_review <prNumber> <reviewers> [-r <repo>]
```

### [`github_search`](https://github.com/nimbella/command-sets/blob/master/github/packages/github/github_search.js)

> **Note:** Mattermost support for this command is yet to be added.

Search repositories, commits, code, issues, pull requests, users and topics using keywords.

```sh
/nc github_search <entity> [<keywords>] [-q <query>] [-r <repositories>] [-l <language>] [-s <pageSize>] [-n <pageNumber>]
```

![GitHub search command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/search.png)

Entity can be passed in as an abbreviation:

- `r` - repositories
- `cm` - commits
- `c` - code
- `i` - issues
- `p` - pull requests
- `u` - users
- `t` - topics

Multiple keywords can be combined using `+` sign. e.g. `atom+design`

Optionally the following options can be provided for more specific search.

- `[-q <query>]` query can be formed using [github search syntax](https://help.github.com/en/github/searching-for-information-on-github/understanding-the-search-syntax).
- `[-r <repositories>]` specific repositories can be given (e.g. `-r microsoft/vscode,nimbella/command-sets`).
- `[-l <language>]` specific language can be mentioned (e.g. `-l python`).
- `[-s <pageSize>]` number of records to be fetched in one go (e.g. `-s 10`).
- `[-n <pageNumber>]` next set of records can be fetched using (e.g. `-n 2`).

### [`github_stats`](https://github.com/nimbella/command-sets/blob/master/github/packages/github/github_stats.js)

View repository community statistics.

```sh
/nc github_stats [<repo>]
```

![GitHub stats command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/stats.png)

### [`github_view_pr`](https://github.com/nimbella/command-sets/blob/master/github/packages/github/github_view_pr.js)

View recent pull requests.

```sh
/nc github_view_pr [<repo>] [-state <state>]
```

## Support

We're always happy to help you with any issues you encounter. You may want to [join our Slack community](https://nimbella-community.slack.com/) to engage with us for a more rapid response.
