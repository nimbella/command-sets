# Nimbella Commander Shopify Command Set

A [Nimbella Commander](https://nimbella.com/product/commander) Command Set for viewing orders, adding notes to orders, getting numbers of products sold, and getting inventory numbers of a Shopify store.

- [Installation](#Installation)
- [Requirements](#Requirements)
- [Commands](#Commands)
- [Usage](#Usage)
- [Support](#support)

## Installation

Please make sure Commander is installed in your [Slack workspace](https://slack.com/apps/AS833QXL0-nimbella-commander) or [other messaging platforms](https://github.com/nimbella/command-sets#installation) before executing this Slash command.

```
/nc csm_install shopify
```

## Commands

- [`shopify`](#shopify) - View command set documentation
- [`shopify_add_note`](#shopify_add_note) - Add a note to an existing order.
- [`shopify_inventory`](#shopify_inventory) - Get inventory numbers for products.
- [`shopify_orders`](#shopify_orders) - Get a detailed list of orders.
- [`shopify_products_sold`](#shopify_products_sold) - Get number of products sold.

## Requirements

In order to use this command set, you need to set up an app on Shopify with the following scopes

```
Inventory (Read access)
Orders (Read and write)
Products (Read)
```

Using /nc secret_create create the following keys

```
Key: shopify_api_key / Value: API Key
Key: shopify_secret / Value: Password
Key: shopify_store_name / Value: Hostname
```

## Usage

### [`shopify`](https://github.com/nimbella/command-sets/blob/master/shopify/packages/shopify/shopify.js)

View Command Set documentation.

```sh
/nc shopify
```

### [`shopify_add_note`](https://github.com/nimbella/command-sets/blob/master/shopify/packages/shopify/shopify_add_note.js)

Add a note to an existing order.

```sh
/nc shopify_add_note <order_id> <note>
```

Params: order_id (Unique ID of an order), note (Text to attach to order)

> _Note_: order_id can be found using /nc shopify_orders

![Shopify add note command](https://raw.githubusercontent.com/nimbella/command-sets/master/shopify/screenshots/addNote.PNG)

### [`shopify_inventory`](https://github.com/nimbella/command-sets/blob/master/shopify/packages/shopify/shopify_inventory.js)

Get inventory numbers for products.

```sh
/nc shopify_inventory [<search_words>]
```

Params: search_words (Comma delimited list of text to filter by) EX: "textone, text two, text three four"

![Shopify inventory command](https://raw.githubusercontent.com/nimbella/command-sets/master/shopify/screenshots/inventory.PNG)

### [`shopify_orders`](https://github.com/nimbella/command-sets/blob/master/shopify/packages/shopify/shopify_orders.js)

Get a detailed list of orders.

```sh
/nc shopify_orders
```

![Shopify orders command](https://raw.githubusercontent.com/nimbella/command-sets/master/shopify/screenshots/orders.PNG)

### [`shopify_products_sold`](https://github.com/nimbella/command-sets/blob/master/shopify/packages/shopify/shopify_products_sold.js)

Get number of products sold.

```sh
/nc shopify_products_sold [<search_terms>]
```

Params: search_terms (Comma delimited list of text to filter by) EX: "textone, text two, text three four"

![Shopify products sold command](https://raw.githubusercontent.com/nimbella/command-sets/master/shopify/screenshots/productsSold.PNG)

## Support

We're always happy to help you with any issues you encounter. You may want to [join our Slack community channel](https://nimbella-community.slack.com/) to engage with us for a more rapid response.
