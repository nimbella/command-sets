// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

const axios = require('axios');

async function putRequest(url, request) {

	return await axios.put(url, request)
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

async function _command(params, commandText, secrets = {}) {

	const error = isSecretMissing(secrets);

	if (error) {
		return {
			response_type: 'in_channel', // or `ephemeral` for private response
			text: error
		};
	}

	const {
		order_id,
		note
	} = params;
	const request = {
		order: {
			note: params.note ? params.note : 'N/A'
		}
	};
	const url = `https://${secrets.shopify_api_key}:${secrets.shopify_secret}@${secrets.shopify_store_name}/admin/api/2020-01/orders/${order_id}.json`;
	const data = await putRequest(url, request);

	if (data.errors) {
		return {
			response_type: 'in_channel', // or `ephemeral` for private response
			text: data.errors
		};
	}

	return {
		response_type: 'in_channel', // or `ephemeral` for private response
		text: `\`\`\`ID: ${data.order.id}
Email: ${data.order.email ? data.order.email : 'N/A'}
Items: ${data.order.line_items.map(item => { return item.name;}).join(' , ')}
Status: ${data.order.financial_status}
Subtotal: ${data.order.subtotal_price}
Tax: ${data.order.total_tax}
Total price: ${data.order.total_price}
Note: ${data.order.note ? data.order.note : 'N/A'}\`\`\`\n`
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
module.exports.main = main;
