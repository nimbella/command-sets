# Nimbella Command Set Registry

![command sets count](https://img.shields.io/endpoint?url=https://apigcp.nimbella.io/api/v1/web/mesatyar-yzpbtecwigu/default/command-sets-count&style=flat)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![Join Slack](https://img.shields.io/badge/join-slack-9B69A0.svg)](https://nimbella-community.slack.com/)
[![Twitter](https://img.shields.io/twitter/follow/nimbella.svg?style=social&logo=twitter)](https://twitter.com/intent/follow?screen_name=nimbella)

[Nimbella Commander](https://nimbella.com/product/commander) is the best, fastest and easiest way to build bots and commands for messaging platforms such as [Slack](https://slack.com/apps/AS833QXL0-nimbella-commander), Microsoft Teams, and Mattermost. Commander requires no new accounts to setup, no command line tools to start, and you will create your first command in seconds. The development experience can extend from your browser, to your terminal, so that you can develop, test, run and integrate bots and commands where it is most convenient for your workflow.

Unique features of Nimbella Commander:

1. **Command Sets:** a convenient way to bundle, share, and install commands into your messaging platform.
2. **Access Control:** control which users can run, edit, or administer commands.
3. **Secrets Management:** securly bind API keys to commands.
4. **Audit Logs and Operator Dashboard:** monitor and administer usage.

Learn more on how Commander can help you by clicking [here](https://nimbella.com/resources-commander/overview#what-is-commander).

- [Installation instructions](#Installation)
  - [Slack](#Slack) (<img alt="slack"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" />)
  - [Teams](#Teams) (<img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/microsoftteams.svg" />) (coming soon)
  - [Mattermost](#Mattermost) (<img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) (coming soon)
- [Installing a command set](#Installing-a-Command-Set)
- [Catalog of command sets](#Catalog-of-Command-Sets)
- [Support](#support)
- [License](#license)
- Additional resources
  - [Commander reference manual](https://nimbella.com/resources-commander/reference)

## Installation

The installation instructions for Commander depend on the platform used. Select the one that works for you.

### Slack

Click the link below to install Nimbella Commander on your Slack workspace.

<a href="https://nimbella.com/commander/slack/install?version=2"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>

### Teams

Coming soon.

### Mattermost

Follow [this quickstart](https://nimbella.com/resources-commander/mattermost/quickstart#quickstart) to install Nimbella Commander on your Mattermost workspace. 

## Installing a Command Set

After having Nimbella Commander installed, you can install a command-set by running the following slash command.

```
/nc csm_install <command-set>
```

Replace `<command-set>` with any of the command-sets available.

Example:

To install the [aws command set](aws), you have to run the command shown below.

```
/nc csm_install aws
```

You can use the same `/nc` slash app to run all commands under `aws`.

To list EC2 instances under your AWS account:

```
/nc ec2_list
```

## Catalog of Command Sets

- [`awsbill`](awsbill) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Fetch AWS billing information.
- [`aws`](aws) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - AWS commands.
- [`bluejeans`](bluejeans) (<img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Bluejeans commands.
- [`billing`](billing) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Commands to show cloud service bills.
- [`corona_stats`](corona_stats) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Live stats for the pandemic, worldwide or in a specific country.
- [`dig`](dig) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Command to lookup DNS.
- [`do`](do) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - DigitalOcean commands.
- [`datadogbill`](datadogbill) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Fetch Datadog billing information from Slack using Nimbella Commander.
- [`dobill`](dobill) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Fetch DigitalOcean billing information from Slack using Nimbella Commander.
- [`echo`](echo) - (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Simple echo test.
- [`gcloud`](gcloud) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" />) - Google Cloud commands (right now, just billing).
- [`github`](github) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Command set for interfacing with GitHub.
- [`gitlab`](gitlab) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Command set for interfacing with GitLab.
- [`ibm`](ibm) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Commands to interact with IBM Cloud Functions & IBM Watson services.
- [`jira`](jira) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" />) - Commands to interact with Jira Cloud.
- [`kubernetes`](kubernetes)(<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" />) - Interact with your Kubernetes cluster from Slack.
- [`netlify`](netlify) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" />) - Commands to interact with Netlify .
- [`run`](run) (<img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Command to run slash commands.
- [`shopify`](shopify) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Command set for interfacing with Shopify.
- [`times`](times) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Displays current time in AM/PM format for the given cities.
- [`twitter`](twitter) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" />) - Execute Twitter related operations
- [`translate`](translate) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Translates text to a given language.
- [`utils`](utils) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Set of utility commands for Commander
- [`vultr`](vultr) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Vultr commands.
- [`weather`](weather) (<img alt="slack"  width="12" height="12" src="https://unpkg.com/simple-icons@latest/icons/slack.svg" /> <img alt="mattermost"  width="13" height="13" src="https://unpkg.com/simple-icons@latest/icons/mattermost.svg" />) - Get weather conditions for a city.

## Support

We're always happy to help you with any issues you encounter. You may want to [join our Slack community](https://nimbella-community.slack.com/) to engage with us for a more rapid response.

## License

Apache-2.0. See [LICENSE](LICENSE) to learn more.
