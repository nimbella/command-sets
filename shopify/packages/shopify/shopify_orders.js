// jshint esversion: 9

/**
 * @description Get a detailed list of orders.
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

function formatReturnText(orders) {

	let text = '';
	const pagination = 10;

	for (let i = 0; i < orders.length && i < pagination; i++) {
		text += `\`\`\`ID: ${orders[i].id}
Email: ${orders[i].email ? orders[i].email : 'N/A'}
Items: ${orders[i].line_items.map(item => { return item.name;}).join(' , ')}
Status: ${orders[i].financial_status}
Subtotal: ${orders[i].subtotal_price}
Tax: ${orders[i].total_tax}
Total price: ${orders[i].total_price}
Note: ${orders[i].note ? orders[i].note : 'N/A'}\`\`\`\n`;
	}
	return text ? text : 'No orders found';
}

async function _command(params, commandText, secrets = {}) {

	const error = isSecretMissing(secrets);

	if (error) {
		return {
			response_type: 'in_channel', // or `ephemeral` for private response
			text: error
		};
	}

	const url = `https://${secrets.shopify_api_key}:${secrets.shopify_secret}@${secrets.shopify_store_name}/admin/api/2020-01/orders.json`;
	const data = await getRequest(url);

	if (data.errors) {
		return {
			response_type: 'in_channel', // or `ephemeral` for private response
			text: data.errors
		};
	}

	return {
		response_type: 'in_channel', // or `ephemeral` for private response
		text: formatReturnText(data.orders)
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
