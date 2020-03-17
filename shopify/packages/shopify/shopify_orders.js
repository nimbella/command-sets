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

	var ret = '';
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

	const url = `https://${secrets.shopifyKey}:${secrets.shopifyPassword}@${secrets.shopifyHostname}/admin/api/2020-01/orders.json`;
	var data = await getRequest(url);

	if (data.errors) {
		return {
			response_type: 'in_channel', // or `ephemeral` for private response
			text: data.errors
		};
	}

	var text = '';
	data.orders.forEach(order => {
		text += `\`\`\`ID: ${order.id}
		Email: ${order.email ? order.email : 'N/A'}
		Items: ${order.line_items.map(item => { return item.name;}).join(' , ')}
		Status: ${order.financial_status}
		Subtotal: ${order.subtotal_price}
		Tax: ${order.total_tax}
		Total price: ${order.total_price}
		Note: ${order.note ? order.note : 'N/A'}\`\`\`\n`;
	});

	return {
		response_type: 'in_channel', // or `ephemeral` for private response
		text: text
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
