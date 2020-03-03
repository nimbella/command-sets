// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */

var XMLHttpRequest;

async function install(pkgs) {
  
  pkgs = pkgs.join(' ');
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec(`npm install ${pkgs}`, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Performs GET requests on provided url and returns results as JSON
function fetchStats(url) {
  
  XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", url, false );
  xmlHttp.send( null );
  return JSON.parse(xmlHttp.responseText);
}

async function _command(params, commandText, secrets = {}) {
  
  if (!XMLHttpRequest) {
    let packages = [ 'xmlhttprequest' ];
    await install(packages);
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  }
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
  var fetches = fetchStats(urlKey.fetches);
  try {
    fetches = fetchStats(urlKey.fetches).fetches.total;
  } catch (error) {
    return {
      response_type: 'in_channel',
      text: fetches.message
    };
  }
  const commits = fetchStats(urlKey.commits).length;
  const issuesOpened = fetchStats(urlKey.issuesOpened).length;
  const issuesClosed = fetchStats(urlKey.issuesClosed).length;
  const mergeRequestsOpened = fetchStats(urlKey.mergeRequestsOpened).length;
  const mergeRequestsClosed = fetchStats(urlKey.mergeRequestsClosed).length;
  const mergeRequestsLocked = fetchStats(urlKey.mergeRequestsLocked).length;
  const mergeRequestsMerged = fetchStats(urlKey.mergeRequestsMerged).length;

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: `\`\`\`${repo} Community Contribution Stats
Fetches: ${fetches}
Commits: ${commits}
Issues (Opened): ${issuesOpened}
Issues (Closed): ${issuesClosed}
Issues (Total): ${issuesClosed + issuesOpened}
Merge Requests (Opened): ${mergeRequestsOpened}
Merge Requests (Closed): ${mergeRequestsClosed}
Merge Requests (Locked): ${mergeRequestsLocked}
Merge Requests (Merged): ${mergeRequestsMerged}
Merge Requests (Total): ${mergeRequestsOpened+mergeRequestsClosed+mergeRequestsLocked+mergeRequestsMerged}\`\`\`\n`
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