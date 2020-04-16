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

#### `jira`

Display help for Jira command set.
```
/nc jira
```

#### `jira_assign_issue`

Assign an issue to a user

```
/nc jira_assign_issue <issueId> <userName>
```

The `userName` can be first name of the user or full name.

#### `jira_create_issue`

Create an issue.

```
/nc jira_create_issue -type <issueType> -title <issueTitle> -desc <issueDescription> -project <jiraProjectKey>
```

You can avoid `-project` by creating `jiraDefaultProject` secret with the value being your project key.

Example:
```
/nc jira_create_issue -type story -title "Create Jira Command Set" -desc "Slack slash commands to interact with jira."
```

#### `jira_transition`

Transition an issue.

```
/nc jira_transition <issueId> <columnName>
```

Example:
```
/nc jira_transition JN-5 done
```