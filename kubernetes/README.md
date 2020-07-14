# kubernetes Command Set

Interact with your Kubernetes cluster from Messaging platforms like Slack, Mattermost, & Teams using [Nimbella Commander](https://nimbella.com/product/commander).

## Requirements

The Command Set is intended to be used with [Nimbella Commander](https://nimbella.com/product/commander). So please make sure you've it installed on your messaging platform.

For the Command Set to communicate with your Kubernetes cluster, we need to setup secrets named `K8S_SERVER`, `K8S_TOKEN`, and `K8S_CA` with the cluster IP address, an auth token and CA cert data respectively.

**Obtaining the required values**

Make sure you have `kubectl` configured to communicate with your cluster. We need it to create a few k8s objects so the Command Set can talk with your cluster with minimum read-only permissions.

Run the below command to create a ClusterRole, ClusterRoleBinding, and a ServiceAccount named `kubernetes-command-set` under `default` namespace.

```sh
kubectl apply -f https://raw.githubusercontent.com/nimbella/command-sets/master/kubernetes/k8s-config.yaml
```

Once the command is successful, list your secrets (`kubectl get secrets`) and grab the name that starts with `kubernetes-command-set`.

Run the below command to get a json contianing an access token and CA data.

```
kubectl get secrets <kubernetes-command-set*> -o json # replace <kubernetes-command-set*> with appropriate value
```

The output will look something similar like below:

```json
{
  "apiVersion": "v1",
  "data": {
    "ca.crt": "...",
    "namespace": "...",
    "token": "..."
  },
  "kind": "Secret",
  "metadata": {
    "annotations": {
      "kubernetes.io/service-account.name": "kubernetes-command-set",
      "kubernetes.io/service-account.uid": "..."
    },
    "creationTimestamp": "2020-07-12T16:16:12Z",
    "name": "kubernetes-command-set-token-jsqnr",
    "namespace": "default",
    "resourceVersion": "2041370",
    "selfLink": "/api/v1/namespaces/default/secrets/kubernetes-command-set-token-jsqnr",
    "uid": "c453057f-6a55-4b85-ad5f-3a3ea77dd692"
  },
  "type": "kubernetes.io/service-account-token"
}
```

Copy the the value of `ca.crt` and `token` and paste them in the value field of `K8S_CA` and `K8S_TOKEN` while creating the secrets.

To obtain your cluster IP address run:

```sh
kubectl config view --minify -o yaml | grep "server"
```

Copy the IP address and paste it in the value field of `K8S_SERVER` while creating the secrets.

## Commands

- [`kube_get`](#kube_get) - Get information about objects (pods, nodes, services, deployments).
- [`kube_logs`](#kube_logs) - Get logs of a pod.

## Usage

### [`kube_get`](packages/kubernetes/kube_get/index.js)

Get information about objects (pods, nodes, services, deployments).

```sh
/nc kube_get <objectName> [-n <namespace>] [-skip <skip>]
```

By default only 10 items are shown. The command supports pagination so you can skip through the list using `-skip` flag.

### [`kube_logs`](packages/kubernetes/kube_logs.js)

Get logs of a pod.

```sh
/nc kube_logs <podName> [-n <namespace>] [-l <tailLines>]
```

By default last 25 lines of logs are shown which you can modify the number of lines per request using `-n` flag.
