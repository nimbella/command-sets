# Billing

Fetch Amazon Web Services (AWS), Datadog and DigitalOcean usage directly from Slack using Nimbella Commander.

## Pre-requisite

These commands are intended for use with [Nimbella Commander](https://nimbella.com/product/commander).
Please install Commander in your [Slack team](https://slack.com/apps/AS833QXL0-nimbella-commander) first.
Next, install this command set into your workspace by running the following command.

```sh
/nc csm_install billing
```

To run the below commands, we need API access tokens for respective services. See **Requirements** section of each command to learn more.

## Commands

- [`awsbill`](#aws)
- [`datadogbill`](#datadog)
- [`dobill`](#digitalocean)

## AWS

### Requirements

We need three secrets named `awsCostExplorerAccessKeyId`, `awsCostExplorerSecretAccessKey`, and `awsCostExplorerRegion`.

Watch [this](https://youtu.be/665RYobRJDY) video to learn how to create AWS access keys. And while creating the access keys, create a policy using the below JSON to limit the access to Cost Explorer service.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "ce:DescribeCostCategoryDefinition",
        "ce:GetRightsizingRecommendation",
        "ce:GetCostAndUsage",
        "ce:GetSavingsPlansUtilization",
        "ce:GetReservationPurchaseRecommendation",
        "ce:ListCostCategoryDefinitions",
        "ce:GetCostForecast",
        "ce:GetReservationUtilization",
        "ce:GetSavingsPlansPurchaseRecommendation",
        "ce:GetDimensionValues",
        "ce:GetSavingsPlansUtilizationDetails",
        "ce:GetCostAndUsageWithResources",
        "ce:GetReservationCoverage",
        "ce:GetSavingsPlansCoverage",
        "ce:GetTags",
        "ce:GetUsageForecast"
      ],
      "Resource": "*"
    }
  ]
}
```

The values of `awsCostExplorerAccessKeyId`, `awsCostExplorerSecretAccessKey`, and `awsCostExplorerRegion` should be your Access Key ID, Secret access key and your AWS region code respectively.

### Usage

```sh
/nc awsbill
```

To get notified when the bill exceeds a certain amount, follow the instructions below.

1. Create a secret named `awsCostThreshold` with your budget.

   Run `/nc secret_create` and follow the instructions.

   > The value should be a number without your currency unit. ✅ `100` ❌ `$100`

   **Note**: we recommend you to set the budget a bit lesser than your actual budget since Cost Explorer API is delayed by a day.

2. Setup your Slack channel with Commander

   Follow this [guide](https://nimbella.com/resources-commander/guide#create-add-a-channel).

3. Create a Commander task

   - Run `/nc task_create awsbill #general awsbill -task` to create a task.

     Replace `#general` with the slack channel you added to commander.

   - Run `/nc task_rate awsbill 1 minute` to set your task rate

     This sets the task to run every minute. Learn more [here](https://nimbella.com/resources-commander/guide#view-or-set-the-task-rate).

   - Run `/nc task_start awsbill`

     This will start the task and now whenever the bill exceeds the set threshold, you'll get a message in your channel.

## Datadog

### Requirements

We need two secrets named `datadogApiKey` with your Datadog API key and `datadogApplicationKey` with your Datadog Application key to run this command. You can learn about them [here](https://docs.datadoghq.com/account_management/api-app-keys/).

### Usage

To see projected cost of this month and next month:

```sh
/nc datadogbill
```

To see a detailed breakdown of costs, pass `-detail` flag.

```sh
/nc datadogbill -detail
```

## DigitalOcean

### Requirements

We need a Nimbella Commander secret named `digitaloceanApiKey` with your DigitalOcean Personal Access Token to able to run this command. Follow [this](https://www.digitalocean.com/docs/apis-clis/api/create-personal-access-token/) guide to obtain your Personal Access Token.

To create the secret, you need to type `/nc secret_create` inside your Slack workspace and follow the instructions.

### Usage

```sh
/nc dobill
```
