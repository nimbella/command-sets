# AWS Command Set

Interact with Amazon Web Services from messaging platforms like Slack, Mattermost & Microsoft Teams using [Nimbella Commander](https://nimbella.com/product/commander).

- [Installation](#Installation)
- [Requirements](#Requirements)
- [Commands](#Commands)
- [Usage](#Usage)
- [Support](#support)

## Installation

Please make sure you've Commander installed in your [Slack workspace](https://slack.com/apps/AS833QXL0-nimbella-commander) before executing this Slash command.

```
/nc csm_install aws
```

## Requirements

We need three secrets named `awsAccessKey`, `awsSecretKey`, and `awsRegion` for all commands excluding `route53` and `awsbill`.

Watch [this](https://youtu.be/665RYobRJDY) tutorial to learn how to create AWS access keys. And while creating the keys, please make sure they have **permissions** to interact with EC2, DynamoDB, and RDS services.

The values of `awsAccessKey`, `awsSecretKey`, and `awsRegion` should be your Access Key ID, Secret access key and your AWS region code respectively.

**`route53`**

To use `route53` commands, create three secrets named `route53AccessKey`, `route53SecretKey`, `route53ZoneId` with values being your Access Key ID, Secret access key and Route 53 Zone Identifier respectively.

**`awsbill`**

To use `awsbill`, We need three secrets named `awsCostExplorerAccessKeyId`, `awsCostExplorerSecretAccessKey`, and `awsCostExplorerRegion`.

While creating the access keys, create a policy using the below JSON to limit the access to Cost Explorer service.

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

## Commands

- [`awsbill`](#awsbill) - Fetch AWS bill.
- [`ec2_list`](#ec2_list) - List EC2 instances in the provided region.
- [`ec2_reboot`](#ec2_reboot) - Reboot an EC2 instance.
- [`ec2_status`](#ec2_status) - Know the status of EC2 instances.
- [`dynamodb_list`](#dynamodb_list) - List Database tables.
- [`rds_list`](#rds_list) - List Amazon RDS (Relational Database Service) instances under your account.
- [`route53_list`](#route53_list) - List AWS route53 managed hostnames.
- [`route53_add`](#route53_add) - Add AWS route53 hostname.

## Usage

### [`awsbill`](packages/aws/awsbill.js)

Shows your AWS bill.

```sh
/nc awsbill [<monthYear>] [-task <task>]
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

     Replace `#general` with the slack channel you've added to commander.

   - Run `/nc task_rate awsbill 1 minute` to set your task rate

     This sets the task to run every minute. Learn more [here](https://nimbella.com/resources-commander/guide#view-or-set-the-task-rate).

   - Run `/nc task_start awsbill`

     This will start the task and now whenever the bill exceeds the set threshold, you'll get a message in your channel.

### [`ec2_list`](packages/aws/ec2_list.js)

Lists your EC2 instances in the provided region.

```sh
/nc ec2_list [<substr>]
```

### [`ec2_reboot`](packages/aws/ec2_reboot.js)

Reboot your EC2 instance.

```sh
/nc ec2_reboot <id>
```

### [`ec2_status`](packages/aws/ec2_status.js)

Know the status of your EC2 instances.

```sh
/nc ec2_status <id>
```

### [`dynamodb_list`](packages/aws/dynamodb_list.js)

List DB Tables under your account.

```sh
/nc dynamodb_list [<startTable>]
```

### [`rds_list`](packages/aws/rds_list.js)

List Amazon RDS (Relational Database Service) instances under your account.

```sh
/nc rds_list
```

### [`route53_list`](packages/aws/route53_list.js)

Lists AWS route53 managed hostnames

```sh
/nc route53_list [-type <record_type>] [-match <match_string>]
```

### [`route53_add`](packages/aws/route53_add.js)

Adds an AWS route53 hostname

```sh
/nc route53_add <hostname> <ip_address>
```

## Support

We're always happy to help you with any issues you encounter. You may want to [join our Slack community](https://nimbella-community.slack.com/) to engage with us for a more rapid response.
