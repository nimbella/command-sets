# BlueJeans Command Set

Only supported on Mattermost for now.

## Available commands

- `bluejeans_create` - Create a meeting.
- `bluejeans_list` - List meetings of a user.

## Usage

To create a meeting with `satya@nimbella.com` & `eric@nimbella.com`:
```sh
/devops bluejeans_create -title "A new beggining" -emails "satya@nimbella.com,eric@nimbella.com" -start "03/01/20 18:00" -end "03/01/20 18:30'
```
