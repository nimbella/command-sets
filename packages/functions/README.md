# IBM Cloud Functions

Commands related to IBM Cloud Functions.

## Requirements

Create a secret named `ibmApiKey` using `/nc secret_create` with the value being an IBM API key which can be obtained at https://cloud.ibm.com/iam/apikeys.

## Available Commands

- `namespaces` - List your IBM IAM and Cloud Foundry-based namespaces.

- `activations` - List activation records in a namespace.

- `act_log` - Get the logs for an activation.

## Usage

#### namespaces

```sh
/nc namespaces
```

#### activations

```sh
/nc activations [<namespaceId>]
```

You can create a secret named `ibmNamespaceId` to avoid passing the same id on every invocation. And the parameter is given precedence when both are present.

#### act_log

```sh
/nc act_log <activationId> [<namespaceId>]
```
