# Nimbella Commander GitLab Command Set
A Nimbella Commander command set for viewing GitLab project statistics, creating tickets, and assigning issues. Currently supports slack.

**Table of Contents**

[TOCM]

[TOC]

## Features
- View community contribution stats for GitLab projects
- Create a ticket for a GitLab project
- Assign issues for a GitLab project

## Install
```
/nc csm_install xxx
```

## Requirements
```
In order to use this command set, you must set up a Personal Access Token on GitLab with API access. And save the token as a secret with the key 'AcessToken_GitLab'
https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html
```

## Usage
Viewing community contributions for a GitLab project
```
/GitLab stats <repo>
```
![](x.png)

Creating a ticket for a GitLab project
```
/GitLab create <repo> <title> <description>
```
![](x.png)