# IBM Cloud Command Set

Interact with IBM services from Slack using Nimbella Commander.

- [IBM Cloud Functions](#IBM-Cloud-Functions)
- [IBM Watson Visual Recognition](#Watson-Visual-Recognition)
- [IBM Watson Language Translator](#Watson-Language-Translator)
- [IBM Watson Tone Analyzer](#Watson-Tone-Analyzer)

## Pre-requisite

These commands are intended for use with [Nimbella Commander](https://nimbella.com/product/commander).
Please install Commander in your [Slack team](https://slack.com/apps/AS833QXL0-nimbella-commander) first.
Next, install this command set into your workspace by running the following command.

```sh
/nc csm_install ibm
```

## IBM Cloud Functions

Commands related to IBM Cloud Functions.

### Requirements

Create a secret named `ibmApiKey` using `/nc secret_create` with the value being an IBM API key which can be obtained at https://cloud.ibm.com/iam/apikeys.

The default region is London (`eu-gb`). You can set your region by creating a secret named `ibmRegionCode`.

### Commands

- [`namespaces`](#namespaces) - List your IBM IAM and Cloud Foundry-based namespaces.

- [`activations`](#activations) - List activation records in a namespace.

- [`act_log`](#act_log) - Get the logs for an activation.

- [`act_result`](#act_result) - Get the results of an activation.

- [`actions`](#actions) - List all actions, web actions, and action sequences in a namespaces.

- [`invoke`](#invoke) - Invoke an action, web action, or action sequence.

### Usage

#### `namespaces`

```sh
/nc namespaces [-skip <skip>]
```

By default, first 20 namespaces are shown. You can skip through the list by using `-skip`.

#### `activations`

```sh
/nc activations [<namespaceId>] [-skip <skip>]
```

You can create a secret named `ibmNamespaceId` to avoid passing the same id on every invocation. And the parameter is given precedence when both are present.

By default, first 9 activation records are shown. You can skip through the list by using `-skip`.

#### `act_log`

```sh
/nc act_log <activationId> [<namespaceId>]
```

#### `act_result`

```sh
/nc act_result <activationId> [<namespaceId>]
```

#### `actions`

```sh
/nc actions [<namespaceId>] [-skip <skip>]
```

By default, first 20 actions are shown. You can skip through the list by using `-skip`.

#### `invoke`

```sh
/nc invoke <actionName> [-nsId <nsId>]
```

You can pass parameters to your function as flags. To pass namespace ID, use `-nsId` flag. Example: `/nc invoke <actionName> -nsId "aasdfasd2r435232sdgfw25"`

Example:

```sh
/nc invoke <actionName> [<namespaceId>] -name "Nimbella". # { name: "Nimbella" }
```

## Watson Visual Recognition

This command uses the [Watson Visual Recognition service](https://cloud.ibm.com/catalog/services/visual-recognition) to label images.

### Requirements

You need to configure this service with an API key for the [Watson Visual Recognition service](https://cloud.ibm.com/catalog/services/visual-recognition).
If you don't have an instance of this service, please create one first. Then visit the **Service credentials** page for this resource, click on **View credentials** and copy the API key for this service. You will use this API key with the Nimbella Secret Creator to encrypt the API key and use it with the command.

1. Run `/nc secret_create` in your workspace and click the link provided.
2. in the _Name_ field enter `ibmWatsonVisualRecognitionCredentials` and enter the API key in the corresponding _Value_ field.
3. Press **Make Secrets** and follow the instructions shown.

### Usage
```sh
/nc watson-viz <imageUrl>
```

For example:
```sh
/nc watson-viz https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg

```

## Watson Language Translator

Translate text right from your Slack workspace using Nimbella Commander & IBM Watson Language Translator.

> Traducir means 'translate' in Spanish.

### Requirements

First, create a **Language Translator** resource. After the resource is created, head over to **Service credentials** page of the resource and click on **View credentials** and copy everything including the curly braces.

This is how the values might look:

```json
{
  "apikey": "...",
  "iam_apikey_description": "...",
  "iam_apikey_name": "...",
  "iam_role_crn": "...",
  "iam_serviceid_crn": "...",
  "url": "..."
}
```

Head over to the Secret Creator (type `/nc secret_create` in your workspace to get the link) and fill in the _Name_ field with `ibmLanguageTranslatorCredentials` and paste the copied values in the corresponding _Value_ field. Press **Make Secrets** button and follow the instructions.

### Usage

```sh
/nc traducir <text> <targetLanguage>
```

You need to use language code instead of language name for `targetLanguage`.

Example:

```sh
/nc traducir "Hello, Developers!" es # es -> Spanish
```

Refer [this](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) page for language codes.

## Watson Tone Analyzer

Analyze tone of a text right from your Slack workspace using Nimbella Commander and IBM Watson Tone Analyzer.

### Requirements

First, create a **Tone Analyzer** resource. After the resource is created, head over to **Service credentials** page of the resource and click on **View credentials** and copy everything including the curly braces.

This is how the values might look:

```json
{
  "apikey": "...",
  "iam_apikey_description": "...",
  "iam_apikey_name": "...",
  "iam_role_crn": "...",
  "iam_serviceid_crn": "...",
  "url": "..."
}
```

Head over to the Secret Creator (type `/nc secret_create` in your workspace to get the link) and fill in the _Name_ field with `ibmToneAnalyzerCredentials` and paste the copied values in the corresponding _Value_ field. Press **Make Secrets** button and follow the instructions.

### Usage

```sh
/nc tone "How are you doing?"
```

To analyze customer tone:

```sh
/nc tone_cs "Please fix the issue!"
```
