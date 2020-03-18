// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
const axios = require('axios');

async function getRequest(url) {

	return await axios.get(url)
		.then((response) => { return response.data; })
		.catch((error) => { return error.response.data; });
}

function isSecretMissing(secrets) {

	let ret = '';

	if (!secrets.shopify_api_key) {
		ret += 'Shopify API key not found!\n';
	} if (!secrets.shopify_secret) {
		ret += 'Shopify password not found!\n';
	} if (!secrets.shopify_store_name) {
		ret += 'Shopify hostname not found!\n';
	}
	return ret;
}

function parseOrdersForItemNames(orders) {

	const itemsCount = [];

	for (var i = 0; i < orders.length; i++) {
		for (var j = 0; j < orders[i].line_items.length; j++) {
			if (!itemsCount[orders[i].line_items[j].name]) {
				itemsCount[orders[i].line_items[j].name] = 1;
			} else {
				itemsCount[orders[i].line_items[j].name] += 1;
			}
		}
	}
	return itemsCount;
}

function filterItems(search_terms, itemsCount) {

	let filteredItems = [];
	let keys = Object.keys(itemsCount);

	for (let i = 0; i < keys.length; i++) {
		for (let j = 0; j < search_terms.length; j++) {
			if (keys[i].toLowerCase().includes(search_terms[j].toLowerCase())) {
				filteredItems.push(keys[i]);
			}
		}
	}
	return [...new Set(filteredItems)];
}

function formatReturnText(filteredItems, itemsCount) {

	const itemsArray = [];
	if (!filteredItems) {
		itemNames = Object.keys(itemsCount);
		for (let i = 0; i < itemNames.length; i++) {
			itemsArray.push(`Product: ${itemNames[i]}\t# Sold: ${itemsCount[itemNames[i]]}`);
		}
	} else {
		for (let j = 0; j < filteredItems.length; j++) {
			itemsArray.push(`Product: ${filteredItems[j]}\t#Sold: ${itemsCount[filteredItems[j]]}`);
		}
	}
	return itemsArray.join('\n');
}

async function _command(params, commandText, secrets = {}) {

	const error = isSecretMissing(secrets);
	if (error) {
		return {
			response_type: 'in_channel', // or `ephemeral` for private response
			text: error
		};
	}

	var {
		search_terms = ''
	} = params;

	const url = `https://${secrets.shopify_api_key}:${secrets.shopify_secret}@${secrets.shopify_store_name}/admin/api/2020-01/orders.json`;
	const data = await getRequest(url);

	if (data.errors) {
		return {
			response_type: 'in_channel', // or `ephemeral` for private response
			text: data.errors
		};
	}

	const itemsCount = parseOrdersForItemNames(data.orders);

	if (search_terms) {
		search_terms = search_terms.split(', ');
		const filteredItems = filterItems(search_terms, itemsCount);
		return {
			response_type: 'in_channel', // or `ephemeral` for private response
			text: filteredItems.length ? `\`\`\`${formatReturnText(filteredItems, itemsCount)}\`\`\`\n` : 'No matches found!'
		};
	}

	return {
		response_type: 'in_channel', // or `ephemeral` for private response
		text: `\`\`\`${formatReturnText(0, itemsCount)}\`\`\`\n`
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
