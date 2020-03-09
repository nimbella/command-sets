// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

const axios = require('axios');

async function fetchIssues(url) {
	
	return await axios.get(url)
		.then((response) => { return response.data; })
		.catch((error) => { return error.response.data; });
}

function formatIssueText(issues) {

	if (issues.message)
		return issues.message;
	var text = '';
	issues.forEach(issue => {
		text +=
			`\`\`\`Issue ID: ${issue.id}
		Title: ${issue.title}
		Description: ${issue.description}
		Status: ${issue.state}
		Author: ${issue.author ? issue.author.name : 'Unknown'}
		Assignees: ${issue.assignee ? typeof issues.assignee == Array ? issue.assignee.name.join(' | ') : issue.assignee.name : 'None'}
		Issue URL: ${issue.web_url}
		Labels: ${issue.labels.length > 0 ? issue.labels.join(' | ') : 'None'}\`\`\`\n`;
	});
	return text;
}

async function _command(params, commandText, secrets = {}) {
	const {
		repo,
		status = ''
	} = params;

	if (!secrets.gitlabToken) {
		return  {
			response_type: 'in_channel',
			text: 'Incorrect or missing personal access token!'
		};
	}
	if (!params.status || !['all', 'opened', 'closed'].includes(params.status.toLowerCase())) {
		params.status = 'all';
	}

	var url = `https://gitlab.com/api/v4/projects/${repo.replace(/\//g, "%2F")}/issues?access_token=${secrets.gitlabToken}&state=${params.status}`;
	var issues = formatIssueText(await fetchIssues(url));

	return {
		response_type: 'in_channel', // or `ephemeral` for private response
		text: issues
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
