'use strict';

/**
 * A small function that converts slack elements `context` and `section` to mattermost compatible markdown.
 * @param {object} element - Slack element
 * @param {string} client - name of the client
 */
const mui = (element, client) => {
  const output = [];
  if (client === 'slack') {
    return element;
  } else {
    if (element.type === 'context') {
      for (const item of element.elements) {
        output.push(item.text.replace(/\*/g, '**'));
      }
    } else if (element.type === 'section') {
      output.push(element.text.text.replace(/\*/g, '**'));
    }
  }

  return output.join(' ');
};

/**
 * Makes an https GET request.
 * @param {string} url - The request URL
 * @param {{}} headers - Headers that need to be set while making a request.
 * @returns {Promise} - The result wrapped in a promise object.
 * @see {@link https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies/}
 */
const getContent = (url, headers) => {
  // Return new pending promise
  return new Promise((resolve, reject) => {
    const request = require('https').get(url, {headers}, response => {
      // Handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(
          new Error('Failed to load page, status code: ' + response.statusCode)
        );
      }

      // Temporary data holder
      const body = [];
      // On every content chunk, push it to the data array
      response.on('data', chunk => body.push(chunk));
      // We are done, resolve promise with those joined chunks
      response.on('end', () => resolve(body.join('')));
    });
    // Handle connection errors of the request
    request.on('error', err => reject(err));
  });
};

/**
 * Calculates current page and total pages of a list
 * @param  {Object} links - links object returned by api
 * @returns {Object} An Object containing totalPages and currentPage values
 */
const calculatePages = links => {
  let totalPages = 1;
  let currentPage = 1;

  if (links && links.pages) {
    if (links.pages.next) {
      const nextPage = new URL(links.pages.next).searchParams.get('page');
      currentPage = Number(nextPage) - 1;
    } else if (links.pages.prev && !links.pages.next) {
      const prevPage = new URL(links.pages.prev).searchParams.get('page');
      currentPage = Number(prevPage) + 1;
    }

    if (links.pages.last) {
      const lastPage = new URL(links.pages.last).searchParams.get('page');
      totalPages = Number(lastPage);
    } else if (links.pages.prev && !links.pages.last) {
      const prevPage = new URL(links.pages.prev).searchParams.get('page');
      totalPages = Number(prevPage) + 1;
    }
  }

  return {totalPages, currentPage};
};

/**
 * @description undefined
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {digitaloceanApiKey} = secrets;
  const {page = 1, __client} = params;
  if (!digitaloceanApiKey) {
    return {
      text:
        'You need `digitaloceanApiKey` secret to run this command. Create one by running `/nc secret_create`.'
    };
  }

  const client = __client ? __client.name : 'slack';

  const result = [];
  const BASE_URL = 'https://api.digitalocean.com/v2';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${digitaloceanApiKey}`
  };

  try {
    const {droplets, links} = JSON.parse(
      await getContent(BASE_URL + `/droplets?per_page=10&page=${page}`, headers)
    );

    if (droplets.length > 0) {
      for (const droplet of droplets) {
        const IPv4 = droplet.networks.v4[0]
          ? droplet.networks.v4[0].ip_address
          : 'not available';

        result.push(
          mui(
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `ID: ${droplet.id}`
                },
                {
                  type: 'mrkdwn',
                  text: `IP: \`${IPv4}\``
                },
                {
                  type: 'mrkdwn',
                  text: `Status: *${droplet.status}*`
                },
                {
                  type: 'mrkdwn',
                  text: `*${droplet.name}*`
                }
              ]
            },
            client
          )
        );
      }

      const {totalPages, currentPage} = calculatePages(links);
      if (totalPages > 1) {
        result.push(
          mui(
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Current Page: *${currentPage}* Total Pages: *${totalPages}*`
                }
              ]
            },
            client
          )
        );
      }
    } else {
      result.push(
        mui(
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `No droplets under your account.`
              }
            ]
          },
          client
        )
      );
    }
  } catch (error) {
    result.push(
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*ERROR:* ${error.message}`
          }
        },
        client
      )
    );
  }

  return {
    response_type: 'in_channel', // eslint-disable-line camelcase
    [client === 'slack' ? 'blocks' : 'text']:
      client === 'slack' ? result : result.join('\n')
  };
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async ({__secrets = {}, commandText, ...params}) => ({
  body: await _command(params, commandText, __secrets)
});
module.exports = main;
