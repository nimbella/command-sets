# Vultr Command Set

Vultr Server Command set

## Available Commands

- `vultr_list`- Lists Vultr server instances.
- `vultr_reboot`- Reboot Vultr server instance.
- `vultr_snap`- Create a snapshot of Vultr server instance.

## Requirements

To run this command set, we need a secret named `vultrApiKey`. This can be obtained by following this [guide](https://docs.ansible.com/ansible/latest/scenario_guides/guide_vultr.html#authentication).

## Usage

To list all the instances under your Vultr account:
```sh
/nc vultr_list
```

To reboot Vultr server instance with your server id:
```sh
/nc vultr_reboot <subid>
```
where subid is the id of your server.

To create a snapshot of Vultr server instance:
```sh
/nc vultr_snap <subid>
```
Where `subid` is the id of your server.
