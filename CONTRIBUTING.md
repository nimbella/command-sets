# Contributing to Command Set Registry

Thanks for taking the time to contribute. We're thankful and will do our best to make progress with you.

> In case this your first time contributing on GitHub, you can watch this [series](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github) to learn how to contribute.

We have a [Code of Conduct](CODE_OF_CONDUCT), please take a look before you proceed.

## Contributing to docs

If you found a typo, just make a pull request with the fix. But if you're planning to write docs for a command set or a command, raise an issue and then proceed.

## Requesting for a new feature/command

Raise an issue with a brief description about your problem and in what way a command/feature can solve it.

## Making changes to existing commands

First, raise an issue describing your change. After discussion, you can make a pull request.

## Creating a new command set

Let's create a small `greetings` command set to understand the flow.

### 1. Fork this repo & clone it.

```sh
$ git clone https://github.com/<username>/command-sets
```

### 2. Create a new directory named `greetings` inside the `command-sets` repository.

```sh
$ cd command-sets && md greetings
```

### 3. Create two new files inside `greetings` to greet in Spanish & French.

```sh
$ cd greetings && touch {hola,bonjour}.js
```

Here each file represent a command.

### 4. Create a `commands.yaml` file.

This is to let commander know about our commands & their requirements.

```sh
$ touch commands.yaml
```

Copy & paste the below into `commands.yaml`.

```yaml
# We need to provide the raw resource link since commander fetches the code directly from here.
sourceBasePath: https://raw.githubusercontent.com/nimbella/command-sets/master/greetings
commands:
  hola:
    sourcePath: /hola.js # Path of the command relative to sourceBasePath
    description: Greet in Spanish. # Small description of the command.
    parameters:
      - name: name
        optional: true # The name parameter is not strictly required by our code.
  bonjour:
    sourcePath: /bonjour.js
    description: Greet in French.
    parameters:
      - name: name
```

### 5. Write code.

You can use the below code as a template & put your logic in `__command` function.

```js
/**
 * @description Greet in Spanish.
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {name = 'contributor'} = params;

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: `¡Hola, ${name}!`
  };
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */
const main = async ({__secrets = {}, commandText, ...params}) => ({
  body: await _command(params, commandText, __secrets).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
```

This is the code in `hola.js`.

### 6. Specify your command set in `command_sets.yaml` file.

This will help commander install your command set by using its name. Like: `/nc csm_install greetings`.

Append this to `command_sets.yaml`:

```yaml
greetings:
  sourcePath: https://raw.githubusercontent.com/nimbella/command-sets/master/greetings/commands.yaml
  description: Greet in different languages.
```

## Contact us

We're always happy to help you with any issues you've contributing to this repo. [Join](https://nimbella-community.slack.com/) our community Slack channel to engage with us.
