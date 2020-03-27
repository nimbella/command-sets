# Nimbella Commander Github Command Set
A Nimbella Commander command set for interfacing with GitHub.


## Features
- Create an issue
- Close an issue
- Reopen an issue
- Find pull requests by date
- Label an issue/pull request
- Request someone to review a pull request
- View repository community statistics
- View recent pull requests
- View Github command set documentation

## Install
```
/nc csm_install github
```

## Requirements
```
In order to use this command set, you must set up a Personal Access Token on Github with repo access. And save the token as a secret with the key 'github_token'
Use /nc secret_create to create secrets
Visit https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line to learn how to setup a Personal Access Token on Github
```

## Usage
Creating an issue.
```
/nc github_create_issue <repo> <title> <body>
```
![Github create_issue command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/create_issue.PNG)

Closing an issue.
```
/nc github_close_issue <repo> <issue_number>
```
![Github close_issue command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/close_issue.PNG)

Reopening an issue
```
/nc github_reopen_issue <repo> <issue_number>
```
![Github reopen_issue command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/reopen_issue.PNG)

Finding a pull request by date.
```
/nc github_find_pr <repo> <date>
```
![Github find_pr command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/find_pr.PNG)

Labeling an issue or pull request.
```
/nc github_label <repo> <number> <labels>
```
![Github label command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/label.PNG)

Getting repository statistics
```
/nc github_stats <repo>
```
![Github stats command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/stats.PNG)

Viewing recent pull requests
```
/nc github_view_pr <repo>
```
![Github view_pr command](https://raw.githubusercontent.com/nimbella/command-sets/master/github/screenshots/view_pr.PNG)

Viewing Github command set documentation
```
/nc github
```
