# Circle CI

### Install

Run the command below to install the whole CircleCI command set. 

```
/nc csm_install circleci
```

### Prerequisite:
You will need to create the following 3 secrets to use this command set.

Those are :
`projectToken` - This is your CircleCI API access token, Get yours here https://circleci.com/docs/2.0/managing-api-tokens/#creating-a-personal-api-token

This secret should be created with the following naming convention. `projectName_token`. Where the project name is your circleCi project name. example `webApp_token`.

`vcsType` - Version Control System i.e. either `gh` for GitHub or `bb` BitBucket. This is optional and will be assumed as `gh` by default.
`orgName` - Name of your GitHub or BitBucket organization or else account username if its a personal project. Creating a secret is optional and can be passed in command parameters, But, passing it in the parameter has a higher priority than a secret.

### Available commands:
- `circleci_workflow_run`
```
   /nc circleci_workflow_run <projectName> [<branch>] [-orgName <orgName>]
   /nc circleci_workflow_run webApp develop -orgName programmersstudio | Default branch will be triggered if not specified.
```

- `circleci_workflow_list`
```
   /nc circleci_workflow_list <projectName> <workflowName> [-orgName <orgName>]
   /nc circleci_workflow_list webApp Checks -orgName programmersstudio
```