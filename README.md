# Nimbella Command Set Registry

[Nimbella Commander](https://nimbella.com/product/commander) is the best, fastest and easiest way to build bots and commands for messaging platforms such as [Slack](https://slack.com/apps/AS833QXL0-nimbella-commander), Microsoft Teams, and Mattermost. Commander requires no new accounts to setup, no command line tools to start, and you will create your first command in seconds. The development experience can extend from your browser, to your terminal, so that you can develop, test, run and integrate bots and commands where it is most convenient for your workflow.

Unique features of Nimbella Commander:

1. **Command Sets:** a convenient way to bundle, share, and install commands into your messaging platform.
2. **Access Control:** control which users can run, edit, or administer commands
3. **Secrets Management:** securly bind API keys to commands
4. **Audit Logs and Operator Dashboard:** monitor and administer usage.

Learn more on how Commander can you help [here](https://nimbella.com/resources-commander/overview#what-is-commander).

- [Installation instructions](#Installation)
  - [Slack (<img alt="slack"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" />)](#Slack)
  - [Teams (<img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/microsoftteams.svg" />)](#Teams) (coming soon)
  - [Mattermost (<img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />)](#Mattermost) (coming soon)
- [Command Sets](#Command-Sets)
  - [Installing a command set](Installing a Command Set)
  - [Catalog of command sets](#Catalog-of-Command-Sets)
- [Support](#support)
- [License](#license)
- Additional resources
  - [Commander reference manual](https://nimbella.com/resources-commander/reference)

## Installation

### Slack

Click on the below to install Nimbella Commander on your Slack workspace.

<a href="https://slack.com/oauth/authorize?client_id=876870346995.892105847680&scope=commands"><img alt=""Add to Slack"" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>

### Teams

Coming soon.

### Mattermost

Coming soon.

## Commmand Sets

### Installing a Command Set

After having Nimbella Commander installed, you can install a command-set by running the following slash command.

```sh
/nc csm_install <command-set>
```

Replace `<command-set>` with any of the command-sets available.

Example:

To install [AWS Command Set](aws), we have to run the below command.

```
/nc csm_install aws
```

You can use the same `/nc` slash app to run all commands under `aws`.

To list EC2 instances under your AWS account:

```
/nc ec2_list
```

### Catalog of Command Sets

- [`billing`](billing) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Commands to show cloud service bills.
- [`gcloud`](gcloud) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Google Cloud commands (right now, just billing).
- [`echo`](echo) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Simple echo test.
- [`do`](do) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - DigitalOcean commands.
- [`aws`](aws) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - AWS commands.
- [`vultr`](vultr) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Vultr commands.
- [`run`](run) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Command to run slash commands.
- [`dig`](dig) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Command to lookup DNS.
- [`translate`](translate) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Translates text to a given language.
- [`bluejeans`](bluejeans) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Bluejeans commands.
- [`corona_stats`](corona_stats) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Live stats for the pandemic, worldwide or in a specific country.
- [`times`](times) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Displays current time in AM/PM format for the given cities.
- [`gitlab`](gitlab) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Command set for interfacing with GitLab.
- [`shopify`](shopify) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Command set for interfacing with Shopify.
- [`github`](github) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Command set for interfacing with GitHub.
- [`ibm`](ibm) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Commands to interact with IBM Cloud Functions & IBM Watson services.
- [`weather`](weather) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Get weather conditions for a city.
- [`utils`](utils) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Set of utility commands for Commander
- [`jira`](jira) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Commands to interact with Jira Cloud.
- [`netlify`](netlify) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Commands to interact with Netlify.
- [`awsbill`](awsbill) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Fetch AWS billing information.
- [`datadogbill`](datadogbill) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Fetch Datadog billing information from Slack using Nimbella Commander.
- [`dobill`](dobill) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Fetch DigitalOcean billing information from Slack using Nimbella Commander.

## Support

We're always happy to help you with any issues you encounter. You may want to [join our Slack community](https://nimbella-community.slack.com/) to engage with us for a more rapid response.

## License

Apache-2.0. See [LICENSE](LICENSE) to learn more.
