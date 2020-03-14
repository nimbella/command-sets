# Nimbella Commander GitLab Command Set
A Nimbella Commander command set for viewing GitLab project statistics, creating tickets, and assigning issues.

## Commands
`gitlab` - View gitlab command set documentation.
`gitlab_assign` - Assign issues for a GitLab project.
`gitlab_create` - Create a ticket for a GitLab project.
`gitlab_issues` - View issues on a GitLab project.
`gitlab_stats` - View community contribution stats for GitLab projects.
`gitlab_users` - View list of users in project repository.

## Install
```
/nc csm_install gitlab
```

## Requirements
```
In order to use this command set, you must set up a Personal Access Token on GitLab with API access. And save the token as a secret with the key 'gitlabToken'
Use /nc secret_create to create keys
Visit https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html to learn how to setup a Personal Access Token on GitLab
```

## Usage
Viewing community contributions for a GitLab project.
```
/dapp gitlab_stats <repo>
```
![](https://raw.githubusercontent.com/Maljean/command-sets/master/gitlab/screenshots/statsCommandScreenshot.PNG)

Creating a ticket for a GitLab project.
```
/dapp gitlab_create <repo> <title> <description>
```
![](https://raw.githubusercontent.com/Maljean/command-sets/master/gitlab/screenshots/createCommandScreenshot.PNG)

Viewing list of users in project repository.
```
/dapp gitlab_users <repo> [<name>]
```
![](https://raw.githubusercontent.com/Maljean/command-sets/master/gitlab/screenshots/usersCommandScreenshot.PNG)

Viewing GitLab command set documentation.
```
/dapp gitlab_gitlab
```