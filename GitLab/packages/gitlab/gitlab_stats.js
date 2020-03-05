// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

const axios = require('axios');

async function fetchStats(url) {
    return await axios.get(url)
    .then(response => { return response.data; })
    .catch(error => { return error.response.data; });
}

async function _command(params, commandText, secrets = {}) {
  const {
    repo
  } = params;
  
  // The gitLab api endpoint for viewing information on projects
  const repoURL = `https://gitlab.com/api/v4/projects/${repo.replace(/\//g, "%2F")}`;
  
  // A dictionary of api urls for each statistic
  const urlKey = {
    fetches: `${repoURL}/statistics?access_token=${secrets.AcessToken_GitLab}`,
    commits: `${repoURL}/repository/commits?access_token=${secrets.AcessToken_GitLab}`,
    issuesOpened: `https://gitlab.com/api/v4/issues?state=opened&access_token=${secrets.AcessToken_GitLab}`,
    issuesClosed: `https://gitlab.com/api/v4/issues?state=closed&access_token=${secrets.AcessToken_GitLab}`,
    mergeRequestsOpened: `${repoURL}/merge_requests?state=opened&access_token=${secrets.AcessToken_GitLab}`,
    mergeRequestsClosed: `${repoURL}/merge_requests?state=closed&access_token=${secrets.AcessToken_GitLab}`,
    mergeRequestsLocked: `${repoURL}/merge_requests?state=locked&access_token=${secrets.AcessToken_GitLab}`,
    mergeRequestsMerged: `${repoURL}/merge_requests?state=closed&access_token=${secrets.AcessToken_GitLab}`,
  };
  
  // If the first GET request returns an error message stop everything and return it
  var fetches = await fetchStats(urlKey.fetches);
  try {
    fetches = fetches.fetches.total;
  } catch (error) {
    return {
      response_type: 'in_channel',
      text: fetches.message
    };
  }
  const commits = await fetchStats(urlKey.commits);
  const issuesOpened = await fetchStats(urlKey.issuesOpened);
  const issuesClosed = await fetchStats(urlKey.issuesClosed);
  const mergeRequestsOpened = await fetchStats(urlKey.mergeRequestsOpened);
  const mergeRequestsClosed = await fetchStats(urlKey.mergeRequestsClosed);
  const mergeRequestsLocked = await fetchStats(urlKey.mergeRequestsLocked);
  const mergeRequestsMerged = await fetchStats(urlKey.mergeRequestsMerged);
  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: `\`\`\`${repo} Community Contribution Stats
Fetches: ${fetches}
Commits: ${commits.length}
Issues Opened: ${issuesOpened.length}
Issues Closed: ${issuesClosed.length}
Total Issues: ${issuesClosed.length + issuesOpened.length}
Merge Requests Opened: ${mergeRequestsOpened.length}
Merge Requests Closed: ${mergeRequestsClosed.length}
Merge Requests Locked: ${mergeRequestsLocked.length}
Merge Requests Merged: ${mergeRequestsMerged.length}
Merge Requests Total: ${mergeRequestsOpened.length+mergeRequestsClosed.length+mergeRequestsLocked.length+mergeRequestsMerged.length}\`\`\`\n`
  };
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async ({__secrets = {}, commandText, ...params}) => ({
  body: await _command(params, commandText, __secrets).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
