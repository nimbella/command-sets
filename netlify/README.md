# Netlify Command Set

Interact with Netlify directly from Slack using Nimbella Commander.

## Requirements

Create a secret named `netlifyToken` with your [Netlify Personal Access](https://app.netlify.com/user/applications/personal) token.

## Usage

### `list_sites`

Access all sites under your account.

```sh
/nc list_sites [-skip <skip>]
```

The output contains only 5 or less sites, you can skip through the list using `-skip` flag.

### `list_deploys`

Access all deploys of a site.

```sh
/nc list_deploys <site>
```

Deploys shows only last 20 deploys, you can skip through them by using `-skip` flag.

Example:

```sh
/nc list_deploys <site> [-skip <skip>]
```

### `list_forms`

Access all forms under your account/site.

```sh
/nc list_forms [<site>]
```

You can also access forms of a site by providing the name of the site.

### `list_submissions`

Access all form submissions under your account or submissions of a specific site or form.

```sh
/nc list_submissions [-filter <filter>] [-skip <skip>]
```

You can search for submissions that includes a specific keyword using `-filter` flag.

### `cancel_deploy`

Cancel a deploy.

```sh
/nc cancel_deploy <deployId>
```
