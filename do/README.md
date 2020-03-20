# DigitalOcean (do)

### Install

Running the below command installs the whole DigitalOcean command set.

```
/nc csm_install do
```

### Commands

- `droplet_ip` - List IP addresses of a droplet.
- `droplet_list` - Lists the droplets under your account.
- `droplet_power` - Command to turn a droplet on and off.
- `droplet_snap` - Snapshots a droplet.
- `droplet_reboot` - Command to reboot a droplet.
- `droplet_status` - Shows the current status of a droplet.

### Requirements


To run this command set, we need the value of API key of the user's DigitalOcean Account, named as 'digitaloceanApiKey'.
How to obtain this key, will be added soon.


### Usage


To view the ip addresses of a droplet:
```sh
/nc droplet_ip <name>
```
Here, `name` refers to the id of the droplet.

To view the droplets under your account:
```sh
/nc droplet_list
```


To reboot a droplet
```sh
/nc droplet_reboot <name>
```
Here, name refers to the id of the droplet which you want to reboot.


To power on/off your droplet
```sh
/nc droplet_power <cmd><droplet_id>
```
cmd:- On/Off command
droplet_id:- unique identification id of the droplet

To take a snapshot of your droplet
```sh
/nc droplet_snap <droplet_id><name>
```
`name` is an optional parameter here.

To view the current status of a droplet.
```sh
/nc droplet_status <droplet_id>
``` 
By entering a droplet_id, this command will show the status of that droplet. 

To view the status of all the droplets.
```sh
/nc droplet_status
```
