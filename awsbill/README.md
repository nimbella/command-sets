# AWS Bill Command Set

Fetch AWS billing information from Slack using Nimbella Commander.

## Installation

```sh
/nc csm_install awsbill
```

## Requirements

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

## Usage

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
