# Command-sets

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![Join Slack](https://img.shields.io/badge/join-slack-9B69A0.svg)](https://nimbella-community.slack.com/)
[![Twitter](https://img.shields.io/twitter/follow/nimbella.svg?style=social&logo=twitter)](https://twitter.com/intent/follow?screen_name=nimbella)

A bunch of command-sets that can be installed using [Nimbella Commander](https://nimbella.com/product/commander) to run on messaging platforms like Slack and Mattermost.

## Installation

Make sure you've Nimbella Commander installed. If not, click [here](https://slack.com/oauth/authorize?client_id=876870346995.892105847680&scope=commands) to install it on your slack workspace.

After having Nimbella Commander installed, you can install a command-set by running the following slash command.

```sh
/nc csm_install <command-set>
```

Replace `<command-set>` with any of the command-sets available.

Example:

To install AWS command-set, we have to run the below command.

```
/nc csm_install aws
```

You can use the same `/nc` slash app to run all commands under `aws`.

To list EC2 instances under your account:

```
/nc ec2_list
```

## Available commands

### AWS (`aws`)

`ec2_list` - Lists EC2 instances.

`ec2_reboot` - Reboots an EC2 instance.

`ec2_status` - Shows the current status of an EC2 instance.

`dynamodb_list` - Lists DynamoDB tables under an account.

`rds_list` - Lists RDS instances under an account.

`route53_add` - Adds an AWS route53 hostname.

`route53_list` - Lists AWS route53 managed hostnames.

### DigitalOcean (`do`)

`droplet_ip` - List IP addresses of a droplet.

`droplet_list` - Lists the droplets under your account.

`droplet_status` - Shows the current status of a droplet.

`droplet_snap` - Snapshots a droplet.

`droplet_power` - Command to turn a droplet on and off.

`droplet_reboot` - Command to reboot a droplet.

### Google Cloud Platform (`gcloud`)

`gcloudbill` - Shows your GCP bill.

### Vultr (`vultr`)

`vultr_list` - Lists vultr server instances.

`vultr_reboot` - Reboot Vultr server instance.

`vultr_snap` - Create a snapshot of Vultr server instance.

### Billing (`billing`)

`awsbill` - Shows your AWS bill.

`datadogbill` - Calculates your DataDog bill based on usage.

`dobill` - Calculates DigitalOcean bill based on usage.

### BlueJeans (`bluejeans`)

`bluejeans_create` - Create a meeting.

`bluejeans_list` - List meetings of a user.

### GitLab (`gitlab`)

`gitlab_stats` - View community contribution stats for GitLab projects.

`gitlab_create` - Create a ticket for a GitLab project.

`gitlab_issues` - Assign issues for a GitLab project.

`gitlab_users` - View list of users in project repository.

`gitlab` - View GitLab command set documentation.

### Shopify (`shopify`)

`orders` - Get a detailed list of orders.

`add_note` - Add a note to an existing order.

`inventory` - Get inventory numbers for products.

`products_sold` - Get sale numbers for products in shop.

`shopify` - View command set documentation.

### GitHub (`github`)

`github_close_issue` - Close an issue.

`github_create_issue` - Create an issue.

`github_find_pr` Find pull requests by date.

`github_label` - Label an issue/pull request.

`github_reopen_issue` - Reopen an issue.

`github_request_review` - Request someone to review a pull request.

`github_stats` - View repository community statistics.

`github_view_pr` - View recent pull requests.

`github` - View GitHub command set documentation.

### Misc

`dig` - A clone of dig that works on nimbella commander. (To install: `/nc csm_install dig`)

`run` - Mattermost slash command to execute other slash commands. (To install: `/nc csm_install run`)

`corona_stats` - Live stats for the pandemic, worldwide or in a specific country/state/district. (To install: `/nc csm_install corona_stats`)

`times` - Displays current time in AM/PM format for the given cities.  (To install: `/nc csm_install times`)

`translate` - Translates text to a specified language.  (To install: `/nc csm_install translate`)

`weather` - Get weather conditions for a city.  (To install: `/nc csm_install weather`)
