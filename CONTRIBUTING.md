# Contributing to Command Set Registry

Thanks for taking the time to contribute. We're thankful and will do our best to make progress with you.

_If this your first time contributing to an open source project on GitHub, you can watch this [series](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github) to learn how to contribute._

We have a [Code of Conduct](CODE_OF_CONDUCT), please take a look before you proceed.

# Contributing to docs

If you found a typo, just make a pull request with the fix. But if you're planning to write docs for a command set or a command, please raise an issue first and then proceed. This gives us a chance to provide guidance when necessary.

# Requesting for a new feature/command

Raise an issue using "Feature Request" template and fill details appropriately.

# Making changes to existing commands

First, please raise an issue describing your change. After discussion, you can make a pull request.

# Creating a new command set

Let's create a small `greetings` command set to understand the flow.

### 1. Fork this repo & clone it.

```sh
$ git clone https://github.com/<username>/command-sets
```

### 2. Create a new directory named `greetings` inside the `command-sets` repository.

```sh
$ cd command-sets && mkdir -p greetings/packages/default
```

### 3. Create two new files inside `greetings` to greet in Spanish & French.

```sh
$ cd greetings/packages/default && touch {hola,bonjour}.js
```

Here each file represents a command.

### 4. Create a `commands.yaml` file inside `greetings`

This is to let Commander know about our commands & their requirements.

```sh
$ cd ../../greetings && touch commands.yaml
```

Copy & paste the below into `commands.yaml`.

```yaml
# We need to provide the raw resource link since commander fetches the code directly from here.
sourceBasePath: https://raw.githubusercontent.com/nimbella/command-sets/master/greetings
commands:
  hola:
    sourcePath: /packages/default/hola.js # Path of the command relative to sourceBasePath
    description: Greet in Spanish. # Small description of the command.
    parameters:
      - name: name
        optional: true # The name parameter is not strictly required by our code.
  bonjour:
    sourcePath: /packages/default/bonjour.js
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

# Developer Certificate of Origin

```
Developer Certificate of Origin
Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.
1 Letterman Drive
Suite D4700
San Francisco, CA, 94129

Everyone is permitted to copy and distribute verbatim copies of this
license document, but changing it is not allowed.


Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

# Contact us

We're always happy to help you with any issues you've contributing to this repo. [Join](https://nimbella-community.slack.com/) our community Slack channel to engage with us.
