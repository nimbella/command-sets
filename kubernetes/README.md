# kubernetes Command Set

Interact with your Kubernetes cluster from Messaging platforms like Slack, Mattermost, & Teams using [Nimbella Commander](https://nimbella.com/product/commander).

## Requirements

The Command Set is intended to be used with Nimbella Commander. So please make sure you've it installed on your messaging platform.

For the Command Set to communicate with your Kubernetes cluster, you need to setup secrets named `K8_TOKEN`, `K8_APISERVER`, and `K8_CA` with the auth token, your cluster IP address, and a CA certificate respectively.

**Note:** The CA certificate should be in `base64` encoded form.

## Commands

- [`get`](#get) - Get information about objects (pods, nodes, services, deployments).
- [`logs`](#log) - Get logs of a pod.

## Usage

### [`get`](packages/kubernetes/get/index.js)

Get information about objects (pods, nodes, services, deployments).

```sh
/nc get <objectName> [-n <namespace>] [-skip <skip>]
```

By default only 10 items are shown. The command supports pagination so you can skip through the list using `-skip` flag.

### [`logs`](packages/kubernetes/logs.js)

Get logs of a pod.

```sh
/nc logs <podName> [-n <tailLines>]
```

By default last 25 lines of logs are shown which you can modify the number of lines per request using `-n` flag.
