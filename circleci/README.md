# Circle CI
 
### Install
 
Running the below command to install the whole CircleCI command set.
 
```
/nc csm_install circleci
```
 
### Prerequisite:
To be able to run the commands below, you need to create 3 secrets.
 
These are :
`projectToken` - CircleCI allows you to create a Token on a project basis to access API, Make sure you provide the token here which can access all those branches which you want to use via this command.
 
This secret should be created with the following naming convention. `projectName_token`. Where the project name is your circleCi project name. example `webApp_token`.
 
`vcsType` - Version Control System. Either `gh` for GitHub or `bb` BitBucket.
`orgName` - Name of your gh/bb organisation specify the account username if its a personal project.
 
### Available commands:
 
- `circleci_workflow_run`
 
```
   /nc circleci_workflow_run <projectName> [<branch>]
   /nc circleci_workflow_run webApp develop | Default branch will be triggered if not specified.
```

- `circleci_workflow_list`
 
```
   /nc circleci_workflow_list_ <projectName> <workflowName>
   /nc circleci_workflow_list_ webApp Checks
```
