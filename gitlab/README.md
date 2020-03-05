# Nimbella Commander GitLab Command Set
A Nimbella Commander command set for viewing GitLab project statistics, creating tickets, and assigning issues.

## Features
- View community contribution stats for GitLab projects
- Create a ticket for a GitLab project
- Assign issues for a GitLab project
- View list of users in project repository

## Install
```
/nc csm_install github:Maljean/command-sets/tree/dev/gitlab
```

## Requirements
```
In order to use this command set, you must set up a Personal Access Token on GitLab with API access. And save the token as a secret with the key 'AcessToken_GitLab'
Use /nc secret_create to create keys
Visit https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html to learn how to setup a Personal Access Token on GitLab
```

## Usage
Viewing community contributions for a GitLab project.
```
/dapp gitlab_stats <repo>
```
![]()

Creating a ticket for a GitLab project.
```
/dapp gitlab_create <repo> <title> <description>
```
![]()

Viewing list of users in project repository.
```
/dapp gitlab_users <repo> [<name>]
```
![]()

Viewing GitLab command set documentation.
```
/dapp gitlab_gitlab
```