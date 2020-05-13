# AWS Command Set

Interact with Amazon Web Services directly from Slack using Nimbella Commander.

## Installation

Please make sure you've Commander in your [Slack team](https://slack.com/apps/AS833QXL0-nimbella-commander) before executing this Slash command.

```
/nc csm_install aws
```

## Requirements

We need three secrets named `awsAccessKey`, `awsSecretKey`, and `awsRegion` for all commands excluding route53.

Watch [this](https://youtu.be/665RYobRJDY) tutorial to learn how to create AWS access keys. And while creating the keys, please make sure they have **permissions** to interact with EC2, DynamoDB, and RDS services.

The values of `awsAccessKey`, `awsSecretKey`, and `awsRegion` should be your Access Key ID, Secret access key and your AWS region code respectively.

To use `route53` commands, create three secrets named `route53AccessKey`, `route53SecretKey`, `route53ZoneId` with values being your Access Key ID, Secret access key and Route 53 Zone Identifier respectively.

## Commands

- [`ec2_list`](#ec2_list)
- [`ec2_reboot`](#ec2_reboot)
- [`ec2_status`](#ec2_status)
- [`dynamodb_list`](#dynamodb_list)
- [`rds_list`](#rds_list)
- [`route53_list`](#route53_list)
- [`route53_add`](#route53_add)

## Usage

### `ec2_list`

Lists your EC2 instances in the provided region.

```sh
/nc ec2_list [<substr>]
```

### `ec2_reboot`

Reboot your EC2 instance.

```sh
/nc ec2_reboot <id>
```

### `ec2_status`

Know the status of your EC2 instances.

```sh
/nc ec2_status <id>
```

### `dynamodb_list`

List DB Tables under your account.

```sh
/nc dynamodb_list [<startTable>]
```

### `rds_list`

List Amazon RDS (Relational Database Service) instances under your account.

```sh
/nc rds_list
```

### `route53_list`

Lists AWS route53 managed hostnames

```sh
/nc route53_list [-type <record_type>] [-match <match_string>]
```

### `route53_add`

Adds an AWS route53 hostname

```sh
/nc route53_add <hostname> <ip_address>
```
