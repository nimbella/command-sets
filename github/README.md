# Nimbella Commander GitHub Command Set

A Nimbella Commander command set for interfacing with GitHub

## Features

- Create an issue
- Close an issue
- Reopen an issue
- Label an issue/pull request
- Request someone to review a pull request
- View repository community statistics
- Searching repositories, commits, code, issues, pull requests, users and topics using given words
- View GitHub command set documentation

## Install

```
/nc csm_install github
```

## Requirements

In order to use this command set, you need to set up a Personal Access Token on GitHub with repo access. And save the token as a secret with the key 'github_token'
Use `/nc secret_create` to create secrets.
Visit https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line to learn how to setup a Personal Access Token on GitHub

Create a secret named `github_repos` to avoid passing repository (`-r`) to commands.

![Secret Creator](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/secret_creator.png)

For commands that only work with single repository the first repository in `github_repos` is used.

## Usage

**Note:** The repository (-r) flag should include both owner name and repository name. Example: `-r nimbella/command-sets`

Creating an issue.

```
/nc github_create_issue <title> <body> [-r <repository>]
```

![GitHub create_issue command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/create_issue.png)

Closing an issue.

```
/nc github_close_issue <issue_number> [-r <repository>]
```

![GitHub close_issue command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/close_issue.png)

Reopening an issue

```
/nc github_reopen_issue <issue_number> [-r <repository>]
```

![GitHub reopen_issue command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/reopen_issue.png)

Labeling an issue.

```
/nc github_label <issueNumber> <labels> [-r <repository>]
```

![GitHub label command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/label.png)

Getting repository statistics

```
/nc github_stats [<repository>]
```

![GitHub stats command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/stats.png)


Finding repositories, commits, code, issues, pull requests, users and topics using keywords

```
/nc github_search <entity> <keywords> [-q <query>] [-r <repositories>] [-l <language>] [-s <pageSize>] [-n <pageNumber>]
```

![GitHub search command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/search.png)

Entity can be passed in as an abbreviation:

- r - repositories
- cm - commits
- c - code
- i - issues
- p - pull requests
- u - users
- t - topics

Multiple keywords can be combined using `+` sign. e.g. `atom+design`

Optionally following options can be provided for more specific search 

- [-q <query>] query can be formed using [github search syntax](https://help.github.com/en/github/searching-for-information-on-github/understanding-the-search-syntax)
- [-r <repositories>] specific repositories can be given e.g. `-r microsoft/vscode,nimbella/command-sets`. In order to avoid having to type in repository names every time command needs to run, default repositories can be specified using `\nc secret_create` ![](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/secret_creator.png)   
- [-l <language>] specific language can be mentioned e.g. `-l python`
- [-s <pageSize>] number of records to be fetched in one go e.g. `-s 10`
- [-n <pageNumber>] next set of records can be fetched using e.g. `-n 2`

Viewing GitHub command set documentation

```
/nc github
```
