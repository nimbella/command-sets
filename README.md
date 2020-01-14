# Command-sets

A bunch of command-sets that can be installed using [Nimbella Commander](https://nimbella.com/product/commander) to run on messaging platforms like Slack and Mattermost.

## Installation

Make sure you've Nimbella Commander installed. If not, click [here](https://slack.com/oauth/authorize?client_id=876870346995.892105847680&scope=commands) to install it on your slack workspace.

After having Nimbella Commander installed, you can install these command-sets by running the following slash command.

```sh
/nc csm_install <command-set>
```

Replace `<command-set>` with any of the command-set available here.

Example:

To install AWS command-set, we have to run the below command.

```
/nc csm_install aws
```

Now, you can access all commands available under `aws` command-set using the default app `dapp`.

To list EC2 instances under your account:

```
/dapp ec2_list
```

### Available commands

### AWS (`aws`)

`ec2_list` - Lists EC2 instances.

`ec2_reboot` - Reboots an EC2 instance.

`ec2_status` - Shows the current status of an EC2 instance.

`dynamodb_list` - Lists DynamoDB tables under an account.

`rds_list` - Lists RDS instances under an account.

`addhost` - Adds an AWS route53 hostname.

`listhosts` - Lists AWS route53 managed hostnames.

### DigitalOcean (`do`)

`droplet_list` - Lists the droplets under your account.

`droplet_status` - Shows the current status of a droplet.

`droplet_snap` - Snapshots a droplet.

`droplet_power` - Command to turn a droplet on and off.

`droplet_reboot` - Command to reboot a droplet.

### Billing (`billing`)

`awsbill` - Shows your AWS bill.

`datadogbill` - Calculates your DataDog bill based on usage.

`dobill` - Calculates DigitalOcean bill based on usage.

### Misc

`dig` - A clone of dig that works on nimbella commander. (To install: `/nc csm_install dig`)

## License

Apache License, version 2.0
