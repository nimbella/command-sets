// jshint esversion: 9

// This code is from: https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies/
// it allows us to do a promise https request without any dependencies

const getContent = function(url, headers) {
  // return new pending promise
  return new Promise((resolve, reject) => {
    const request = require('https').get(url, {headers}, response => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(
          new Error('Failed to load page, status code: ' + response.statusCode)
        );
      }
      // temporary data holder
      const body = [];
      // on every content chunk, push it to the data array
      response.on('data', chunk => body.push(chunk));
      // we are done, resolve promise with those joined chunks
      response.on('end', () => resolve(body.join('')));
    });
    // handle connection errors of the request
    request.on('error', err => reject(err));
  });
};

/**
 * Calculates the difference between Date.now() and date provided in hours.
 * @param {Date} date - Provide the date object
 */
const calcHours = date => {
  return Math.ceil(Math.abs(Date.now() - date) / 36e5);
};

/**
 * Calculates the cost incurred for running all the droplets under an account.
 * @param {array} droplets - An array containing all the droplets under an account.
 */
function calcDropletsCost(droplets = []) {
  let currentCost = 0;
  let projectedCost = 0;
  const today = new Date();
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  for (let i = 0; i < droplets.length; i++) {
    const dropletCreatedDate = new Date(droplets[i].created_at);
    // Hourly price of the droplet.
    const hourlyPrice = droplets[i].size.price_hourly;
    let hoursRun = 0;

    // If the droplet is created after 1st of a month, then calculate price based on the created date.
    if (dropletCreatedDate > firstOfThisMonth) {
      hoursRun = calcHours(dropletCreatedDate);
    } else {
      hoursRun = calcHours(firstOfThisMonth);
    }

    // During billing, DigitalOcean caps the number of hours ran to 672.
    hoursRun = hoursRun > 672 ? 672 : hoursRun;

    currentCost += Number((hoursRun * hourlyPrice).toFixed(2));
    projectedCost += Number((672 * hourlyPrice).toFixed(2));
  }

  return {current: currentCost, projected: projectedCost};
}

async function main(params) {
  const {digitaloceanApiKey} = params.__secrets;
  if (!digitaloceanApiKey) {
    return {
      text:
        'You need `digitaloceanApiKey` secret to run this command. Create one by running `/nc secret_create`.'
    };
  }

  let result = '';
  let error = '';
  const BASE_URL = 'https://api.digitalocean.com/v2';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${digitaloceanApiKey}`
  };

  try {
    const data = await getContent(BASE_URL + '/droplets?per_page=50', headers);
    const {droplets} = JSON.parse(data);

    const dropletsCost = calcDropletsCost(droplets);

    const totalCurrentCosts = dropletsCost.current;
    const totalProjectedCosts = dropletsCost.projected;

    result = `
    Total Costs so far: $${totalCurrentCosts}\nProjected Costs for this month: $${totalProjectedCosts}
    *Droplets*
     Current: $${dropletsCost.current}
     Projected: $${dropletsCost.projected}
    `;
  } catch (err) {
    error = `*ERROR:* ${err.message}`;
  }

  return {
    body: {response_type: 'in_channel', text: error ? error : result}
  };
}
