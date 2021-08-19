const axios = require('axios');

const headers = {
  'Content-Type': 'application/json',
};
const RequestThreshold = 3
const baseURL = 'https://api.github.com'


async function Request(url, action, method, data, token) {
  if (!token && !['list', 'get'].includes(action)) {
    return fail('*please run /nc oauth_create github. See <https://nimbella.com/docs/commander/slack/oauth#adding-github-as-an-oauth-provider | github as oauth provider>*')
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return axios({
    method: method,
    url,
    headers,
    data
  })
}


const UpdateURL = (url) => {
  if (url.includes('|')) {
    url = (url.split('|')[1] || '').replace('>', '')
  } else {
    url = url.replace('<', '').replace('>', '')
  }
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }
  if (!url.includes('api')) {
    url += '/api/v3';
  }
  return url
}


const GetErrorMessage = (error) => {
  console.error(error)
  if (error.response && error.response.status === 403) {
    return `:warning: *The api rate limit has been exhausted.*`
  } else if (error.response && error.response.status && error.response.data) {
    return `Error: ${error.response.status} ${error.response.data.message}`
  } else {
    return error.message
  }
};

const GetHeader = (res, token) => {
  if (res && res.headers) {
    const tokenMessage = token ? '' : '*For greater limits you can add <https://nimbella.com/docs/commander/slack/oauth#adding-github-as-an-oauth-provider | github as oauth provider>';
    const currReading = parseInt(res.headers['x-ratelimit-remaining']);
    let header = `\nAssignee *${action.charAt(0).toUpperCase() + action.substr(1)}* Request Result:`;
    if (currReading < RequestThreshold) {
      header = `:warning: *You are about to reach the api rate limit.* ${tokenMessage}`;
    }
    if (currReading === 0) {
      header = `:warning: *The api rate limit has been exhausted.* ${tokenMessage}`;
    }
    return { header, currReading }
  }
}

const GetFooter = () => {
  return {
    type: 'context',
    elements: [
      Text('add _github command-set_ to your Slack with <https://nimbella.com/product/commander/ | Commander>'),
    ],
  }
}

const Fail = (msg, err) => {
  let errMsg
  if (err) errMsg = GetErrorMessage(err)
  const response = {
    response_type: 'in_channel',
    blocks: [section(`${msg || errMsg || '*couldn\'t get action results*'}`)],
  };
  return response
};

const GetRepository = (github_repos, repository) => {
  const default_repos = repository ? repository : github_repos;
  if (default_repos) {
    repository = default_repos.split(',').map(repo => repo.trim())[0];
  }
  return repository
}

const GetBaseUrl = (host, secrets) => {
  return UpdateURL(host || secrets.github_host || baseURL)
}

const Image = (source, alt) => ({
  type: 'image',
  image_url: source,
  alt_text: alt,
});

const Text = (text) => ({
  type: 'mrkdwn',
  text: text
    // Convert markdown links to slack format.
    .replace(/!*\[(.*)\]\((.*)\)/g, '<$2|$1>')
    // Replace markdown headings with slack bold
    .replace(/#+\s(.+)(?:R(?!#(?!#)).*)*/g, '*$1*'),
});

const Section = (text) => ({
  type: 'section',
  text: Text(text),
});

const GetPrettyDate = (date) => {
  return `<!date^${Math.floor(new Date(date).getTime() / 1000)}^{date_pretty} at {time}|${date}>`
}

exports = {
  GetHeader,
  GetFooter,
  GetRepository,
  GetPrettyDate,
  GetBaseUrl,
  Fail,
  Request,
  Image,
  Text,
  Section
}
