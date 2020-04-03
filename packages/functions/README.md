# IBM Cloud Functions

Commands related to IBM Cloud Functions.

## Requirements

Create a secret named `ibmApiKey` using `/nc secret_create` with the value being an IBM API key which can be obtained at https://cloud.ibm.com/iam/apikeys.

The default region is London (`eu-gb`). You can set your region by creating a secret named `ibmRegionCode`.

## Available Commands

- `namespaces` - List your IBM IAM and Cloud Foundry-based namespaces.

- `activations` - List activation records in a namespace.

- `act_log` - Get the logs for an activation.

- `act_result` - Get the results of an activation.

- `actions` -  List all actions, web actions, and action sequences in a namespaces.

- `invoke` - Invoke an action, web action, or action sequence.

## Usage

#### namespaces

```sh
/nc namespaces [-skip <skip>]
```

By default, first 20 namespaces are shown. You can skip through the list by using `-skip`.

#### activations

```sh
/nc activations [<namespaceId>] [-skip <skip>]
```

You can create a secret named `ibmNamespaceId` to avoid passing the same id on every invocation. And the parameter is given precedence when both are present.

By default, first 20 activation records are shown. You can skip through the list by using `-skip`.

#### act_log

```sh
/nc act_log <activationId> [<namespaceId>]
```

#### act_result

```sh
/nc act_result <activationId> [<namespaceId>]
```

#### invoke

```sh
/nc invoke <actionName> [<namespaceId>]
```

#### actions

```sh
/nc actions [<namespaceId>] [-skip <skip>]
```

By default, first 20 actions are shown. You can skip through the list by using `-skip`.