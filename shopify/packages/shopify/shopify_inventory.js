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

function parseItemInfo(item) {

	let variants = item.variants.map(variant => {
		return {
			title: variant.title,
			inventory_quantity: variant.inventory_quantity,
		};
	});

	let totalCount = variants.map(variant => {
		return variant.inventory_quantity;
	}).reduce((a,b) => a + b, 0);

	variants = variants.map(variant => {
		return `${variant.title} (${variant.inventory_quantity})`;
	});

	return `Title: ${item.title}
Inventory count: ${totalCount}
Variants: ${variants.join(', ')}`;
}

function filterItems(items, search_terms) {

	const ret = [];

	for (let i = 0; i < items.length; i++) {
		for (let j = 0; j < search_terms.length; j++) {
			if (items[i].toLowerCase().includes(search_terms[j].toLowerCase())) {
				ret.push(items[i]);
			}
		}
	}
	return ret ? ret : items;
}

function isSecretMissing(secrets) {

	let ret = '';
	if (!secrets.shopifyKey) {
		ret += 'Shopify API key not found!\n';
	} if (!secrets.shopifyPassword) {
		ret += 'Shopify password not found!\n';
	} if (!secrets.shopifyHostname) {
		ret += 'Shopify hostname not found!\n';
	}
	return ret;
}

async function _command(params, commandText, secrets = {}) {

	const error = isSecretMissing(secrets);

	if (error) {
		return {
			response_type: 'in_channel', // or `ephemeral` for private response
			text: error
		};
	} 

	let {
		search_words = ''
	} = params;

	const url = `https://${secrets.shopifyKey}:${secrets.shopifyPassword}@${secrets.shopifyHostname}/admin/api/2020-01/products.json`;
	const data = await getRequest(url);

	if (data.errors) {
		return {
			response_type: 'in_channel', // or `ephemeral` for private response
			text: data.errors
		};
	}

	let items = data.products.map(item => {
		return parseItemInfo(item);
	});

	if (search_words) {
		search_words = search_words.split(', ');
		items = filterItems(items, search_words);
	}

	if (typeof items == 'object') {
		items = items.join('``` ```');
	}

	return {
		response_type: 'in_channel', // or `ephemeral` for private response
		text: items ? `\`\`\`${items}\`\`\`` : 'No matches found'
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
