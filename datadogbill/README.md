# Datadog Bill Command Set

Fetch Datadog billing information from Slack using Nimbella Commander.

## Installation

```sh
/nc csm_install datadogbill
```

## Requirements

We need two secrets named `datadogApiKey` with your Datadog API key and `datadogApplicationKey` with your Datadog Application key to run this command. You can learn about them [here](https://docs.datadoghq.com/account_management/api-app-keys/).

## Usage

To see projected cost of this month and next month:

```sh
/nc datadogbill
```

To see a detailed breakdown of costs, pass `-detail` flag.

```sh
/nc datadogbill -detail
```
