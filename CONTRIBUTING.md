### Contributing to the Nimbella Command Set Registry

We are thankful that you're taking the time to read this contribution guide, and we are excited to work with you toward a positive contribution to the project.
This document outlines the process for contributing to the project. It also provides some guidance for creating and contributing a new Nimbella Command Set.

### We welcome all contributions.

Contributions come in many different forms, not just code. Here are some quick tips:
- **Improving project documentation**: If you found a typo, just make a pull request with the fix. If you are planning to write new documentation for a command set or a command, please [open an issue first](../../issues/new/choose). This gives us a chance to provide guidance when necessary.
- **Requesting a new feature or command**: [Open a "Feature Request"](../../issues/new?template=feature_request.md) and fill out details appropriately.
- **Changing existing commands**: Please open an appropriate [issue](../../issues/new/choose) describing your proposed change before you create a pull request. This ensures consensus and allows us to work together toward positive outcomes.

### Contribution guidelines.

Please review and keep the following guidelines in mind. _If this is your first time contributing to an open source project on GitHub, we recommend this [video series](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github) to learn how to contribute._
- We have a [Code of Conduct](CODE_OF_CONDUCT.md), please review it so you are familiar with the project values.
- You agree that your contributions will be licensed under the [Apache 2.0 License](LICENSE).
- When you open a pull request with your contributions, **you are certifying that you wrote the code** in the corresponding patch pursuant to the [Developer Certificate of Origin](#developer-certificate-of-origin) included below for your reference.
- If you're contributing a new Command Set, the [guide below](#creating-a-new-command-set) wil help you get started.

### Contact us.

We're always happy to help you with any issues you encounter. You may want to [join our Slack community](https://nimbella-community.slack.com/) to engage with us for a more rapid response.

---

### Creating a new command set

Let's create a small `greetings` command set to understand the flow.

##### 1. Fork this repo & clone it.

```sh
$ git clone https://github.com/<username>/command-sets
```

##### 2. Create a new directory named `greetings` inside the `command-sets` repository.

```sh
$ cd command-sets && mkdir -p greetings/packages/default
```

##### 3. Create two new files inside `greetings` to greet in Spanish & French.

```sh
$ cd greetings/packages/default && touch {hola,bonjour}.js
```

Here each file represents a command.

##### 4. Create a `commands.yaml` file inside `greetings`

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
    description: Greet in Spanish. # Small description of the command.
    parameters:
      - name: name
        optional: true # The name parameter is not strictly required by our code.
  bonjour:
    description: Greet in French.
    parameters:
      - name: name
```

##### 5. Write code.

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
const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;

This is the code in `hola.js`.

##### 6. Specify your command set in `command_sets.yaml` file.

This will help commander install your command set by using its name. Like: `/nc csm_install greetings`.

Append this to `command_sets.yaml`:

```yaml
greetings:
  description: Greet in different languages.
```

---

### Developer Certificate of Origin

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
