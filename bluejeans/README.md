# BlueJeans Command Set

Only supported on Mattermost for now.

## Available commands

- `bluejeans` - Displays help.
- `bluejeans_create` - Create a meeting.
- `bluejeans_list` - List meetings of a user.
- `bluejeans_cancel` - Cancel a meeting.

## Requirements

We need App Key and App Secret that can be created under **ADMIN > OAUTH ACCESS** in your BlueJeans dashboard. Follow ["Client Grant Type"](https://support.bluejeans.com/s/article/Authentication-Methods-for-BlueJeans-Meetings-API-Endpoints) section to create them.

After you've the credentials, we need two secrets named `bluejeansAppKey` & `bluejeansAppSecret` with your credentials as their values. You can create them by running `/nc secret_create`.

## Usage

To create a meeting with `joe@example.com` & `judy@example.com`:
```sh
/dapp bluejeans_create -title "A new beginning" -emails "joe@example.com,judy@example.com" -start "03/01/20 18:00" -end "03/01/20 18:30'
```
Where date is in `mm/dd/yy` format and time is in UTC.

To cancel a meeting:
```sh
/dapp bluejeans_cancel <meetingId> <cancellationMessage>
```
Both `meetingId` and `cancellationMessage` are required.

To list all meetings of admin:
```sh
/dapp bluejeans_list
```

To include respective meeting id in the list, pass `-detail` option.
```sh
/dapp bluejeans_list -detail
```

You can also list meetings of a specific user by passing in their user id:
```sh
/dapp bluejeans_list <userId>
```
This isn't practical, but it's there if you need it until we have a better version.
