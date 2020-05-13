# AWS Command Set

Interact with Amazon Web Services directly from Slack using Nimbella Commander.

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
