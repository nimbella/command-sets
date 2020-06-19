# Nimbella Command Set Registry

[Nimbella Commander]() is the best, fastest and easiest way to build bots and commands for messaging platforms such as [Slack](), [Microsoft Teams](), and [Mattermost](). Commander requires no new accounts to setup, no command line tools to start, and you will create your first command in seconds. The development experience can extend from your browser, to your terminal, so that you can develop, test, run and integrate bots and commands where it is most convenient for your workflow.

Unique features of Nimbella Commander:

1. **Command Sets:** a convenient way to bundle, share, and install commands into your messaging platform.
2. **Access Control:** control which users can run, edit, or administer commands
3. **Secrets Management:** securly bind API keys to commands
4. **Audit Logs and Operator Dashboard:** monitor and administer usage.

- Installation instructions
  - Slack (<img alt="slack"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" />)
  - Teams (coming soon)
  - Mattermost (<img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) (coming soon)
- Command Sets
  - [Installing a command set]()
  - Catalog of command sets
    - [AWS]()
- [Develop your own command set]()
- Additional resources
  - [Commander reference manual](https://nimbella.com/resources-commander/reference)

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

### AWS (`aws`) <img alt="slack" width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost" width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />

`ec2_list` - Lists EC2 instances.

`ec2_reboot` - Reboots an EC2 instance.

`ec2_status` - Shows the current status of an EC2 instance.

`dynamodb_list` - Lists DynamoDB tables under an account.

`rds_list` - Lists RDS instances under an account.

`route53_add` - Adds an AWS route53 hostname.

`route53_list` - Lists AWS route53 managed hostnames.

### DigitalOcean (`do`) <img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />

`droplet_ip` - List IP addresses of a droplet.

`droplet_list` - Lists the droplets under your account.

`droplet_status` - Shows the current status of a droplet.

`droplet_snap` - Snapshots a droplet.

`droplet_power` - Command to turn a droplet on and off.

`droplet_reboot` - Command to reboot a droplet.

### Google Cloud Platform (`gcloud`) <img alt="slack" width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" />

`gcloudbill` - Shows your GCP bill.

### Vultr (`vultr`) <img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />

`vultr_list` - Lists vultr server instances.

`vultr_reboot` - Reboot Vultr server instance.

`vultr_snap` - Create a snapshot of Vultr server instance.

### Billing (`billing`) <img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />

`awsbill` - Shows your AWS bill.

`datadogbill` - Calculates your DataDog bill based on usage.

`dobill` - Calculates DigitalOcean bill based on usage.

### BlueJeans (`bluejeans`) <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />

`bluejeans_create` - Create a meeting.

`bluejeans_list` - List meetings of a user.

### GitLab (`gitlab`) <img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />

`gitlab_stats` - View community contribution stats for GitLab projects.

`gitlab_create` - Create a ticket for a GitLab project.

`gitlab_issues` - Assign issues for a GitLab project.

`gitlab_users` - View list of users in project repository.

`gitlab` - View GitLab command set documentation.

### Shopify (`shopify`) <img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />

`orders` - Get a detailed list of orders.

`add_note` - Add a note to an existing order.

`inventory` - Get inventory numbers for products.

`products_sold` - Get sale numbers for products in shop.

`shopify` - View command set documentation.

### GitHub (`github`) <img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" />

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

`dig` - A clone of dig that works on nimbella commander. (To install: `/nc csm_install dig`) <img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />

`run` - Mattermost slash command to execute other slash commands. (To install: `/nc csm_install run`) <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />

`corona_stats` - Live stats for the pandemic, worldwide or in a specific country/state/district. (To install: `/nc csm_install corona_stats`) <img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />

`times` - Displays current time in AM/PM format for the given cities. (To install: `/nc csm_install times`) <img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />

`translate` - Translates text to a specified language. (To install: `/nc csm_install translate`) <img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />

`weather` - Get weather conditions for a city. (To install: `/nc csm_install weather`) <img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" />

`utils` - Utitility commands for Commander <img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />
