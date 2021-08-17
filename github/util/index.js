const axios = require('axios');

const requestThreshold = 3
const headers = {
  'Content-Type': 'application/json',
};


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

module.module.exports = {
  UpdateURL,
  Request,
  GetErrorMessage
}