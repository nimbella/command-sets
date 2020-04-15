# Jira Command Set

A command set to interact with Jira Cloud right from your Slack workspace using [Nimbella Commander](https://nimbella.com/product/commander).

## Requirements

We need the following secrets to run this command set:

- `jiraApiKey` - The API Key of Jira which can be obtained from [here](https://id.atlassian.com/manage-profile/security/api-tokens).

- `jiraUserEmail` - The email of the user who created the API key.

- `jiraOrgUrl` - The organisation URL. Ex: `https://nimbella.atlassian.net`

## Installation

Assuming that you've [Nimbella Commander](https://nimbella.com/product/commander) installed, you can run the below command to install this command set.

```
/nc csm_install jira
```

## Usage

#### `assign_issue`

Assign an issue to a user

```sh
/nc assign_issue <issueId> <userName>
```

#### `create_issue`

Create an issue.

```sh
/nc create_issue -type <issueType> -title <issueTitle> -desc <issueDescription> -project <jiraProjectKey>
```

You can avoid `-project` by creating `jiraDefaultProject` secret with the value being your project key.
