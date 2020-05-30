## DigitalOcean

Fetch DigitalOcean billing information from Slack using Nimbella Commander.

## Installation

```sh
/nc csm_install dobill
```

## Requirements

We need a Nimbella Commander secret named `digitaloceanApiKey` with your DigitalOcean Personal Access Token to able to run this command. Follow [this](https://www.digitalocean.com/docs/apis-clis/api/create-personal-access-token/) guide to obtain your Personal Access Token.

To create the secret, you need to type `/nc secret_create` inside your Slack workspace and follow the instructions.

## Usage

```sh
/nc dobill
```
