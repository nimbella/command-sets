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

```
/nc assign_issue <issueId> <userName>
```

The `userName` can be first name of the user or full name.

#### `create_issue`

Create an issue.

```
/nc create_issue -type <issueType> -title <issueTitle> -desc <issueDescription> -project <jiraProjectKey>
```

You can avoid `-project` by creating `jiraDefaultProject` secret with the value being your project key.

Example:
```
/nc create_issue -type story -title "Create Jira Command Set" -desc "Slack slash commands to interact with jira."
```

#### `transition`

Transition an issue.

```
/nc transition <issueId> <columnName>
```

Example:
```
/nc transition JN-5 done
```