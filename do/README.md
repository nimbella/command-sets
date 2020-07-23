# DigitalOcean (do)

Interact with DigitalOcean from messaging platforms like Slack, Mattermost & Microsoft Teams using [Nimbella Commander](https://nimbella.com/product/commander).

- [Installation](#Installation)
- [Requirements](#Requirements)
- [Commands](#Commands)
- [Usage](#Usage)
- [Support](#support)

## Installation

Please make sure Commander is installed in your [Slack workspace](https://slack.com/apps/AS833QXL0-nimbella-commander) or [other messaging platforms](../README.md#installation) before executing this Slash command.

```
/nc csm_install do
```

## Requirements

We need a Nimbella Commander secret named `digitaloceanApiKey` with your DigitalOcean Personal Access Token to able to run this Command Set. Follow [this](https://www.digitalocean.com/docs/apis-clis/api/create-personal-access-token/) guide to obtain your Personal Access Token.

To create the secret, you need to type `/nc secret_create` inside your messaging platform and follow the instructions.

## Commands

- [`dobill`](#dobill) - Fetch your DigitalOcean usage.
- [`droplet_ip`](#droplet_ip) - List IP addresses of a droplet.
- [`droplet_list`](#droplet_list) - List droplets.
- [`droplet_power`](#droplet_power) - Power on/off a droplet.
- [`droplet_reboot`](#droplet_reboot) - Reboot a droplet.
- [`droplet_snap`](#droplet_snap) - Take a snapshot of a droplet.
- [`droplet_status`](#droplet_status) - Know the status of all droplets or a single droplet.

## Usage

### [`dobill`](packages/do/dobill.js)

Fetch your DigitalOcean usage.

```sh
/nc dobill
```

### [`droplet_ip`](packages/do/droplet_ip.js)

List IP addresses of a droplet.

```sh
/nc droplet_ip <id>
```

### [`droplet_list`](packages/do/droplet_list.js)

List droplets.

```sh
/nc droplet_list [<page>]
```

### [`droplet_power`](packages/do/droplet_power.js)

Power on/off a droplet.

```sh
/nc droplet_power <cmd> <id>
```

### [`droplet_reboot`](packages/do/droplet_reboot.js)

Reboot a droplet.

```sh
/nc droplet_reboot <id>
```

### [`droplet_snap`](packages/do/droplet_snap.js)

Take a snapshot of a droplet.

```sh
/nc droplet_snap <id> [<name>]
```

### [`droplet_status`](packages/do/droplet_status.js)

Know the status of all droplets or a single droplet.

```sh
/nc droplet_status [<id>]
```

## Support

We're always happy to help you with any issues you encounter. You may want to [join our Slack community](https://nimbella-community.slack.com/) to engage with us for a more rapid response.
