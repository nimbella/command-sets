// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

const axios = require('axios');

async function fetchUsers(url) {
	return await axios.get(url)
		.then(response => { return response.data; })
		.catch(error => { return error.response.data; });
}

async function _command(params, commandText, secrets = {}) {

	const {
		repo,
		name = ''
	} = params;

	const repoURL = `https://gitlab.com/api/v4/projects/${repo.replace(/\//g, "%2F")}/users`;
	var users = await fetchUsers(repoURL);
	var text = '';

	if (users.length) {

		// If name is povided parse for users with a matching name
		if (name) {
			users = users.filter((user) => {
				return user.name.toLowerCase().includes(name.toLowerCase());
			});
		}

		// Formatting text
		users.forEach((user) => {
			text += `ID: ${user.id} | Name: ${user.name} | Username: ${user.username} | URL: ${user.web_url}\n`;
		});
		if (!text) {
			text = 'No users found.';
		}
	}
	return {
		response_type: 'in_channel', // or `ephemeral` for private response
		text: text ? `\`\`\`${text}\`\`\`\n` : `\`\`\`${users.message}\`\`\`\n`
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
