# Twitter Command Set

Interact with Twitter directly from Slack using [Nimbella Commander](https://nimbella.com/product/commander).

## Requirements

> We're working to provide you an option to authorize this command set using your Twitter account instead of using a developer account, but it'll take time. So please use the below method for now.

We need secrets named `twitter_consumer_key`, `twitter_consumer_secret`, `twitter_access_token_key`, and `twitter_access_token_secret` to run this command set.

You can obtain them by creating an app in your [Twitter developer portal](https://developer.twitter.com/en/apps).

## Commands

- [`mentions`](#mentions)
- [`follow`](#follow)
- [`unfollow`](#unfollow)
- [`tweets`](#tweets)

## Usage

### `mentions`

Show recent mentions.

```sh
/nc mentions
```

### `follow`

Follow a user.

```sh
/nc follow <usernames> # /nc follow nimbella
```

### `unfollow`

Unfollow a user.

```sh
/nc unfollow <usernames> # /nc unfollow twitter
```

### `tweets`

Show recent tweets of users.

```sh
/nc tweets <usernames> # /nc tweets "nimbella, rabbah"
```
