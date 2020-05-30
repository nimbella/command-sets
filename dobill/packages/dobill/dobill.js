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
 * Calculates the difference between date1 and date2 in hours.
 * Or calculates the difference between Date.now() and date1 when date2 is not provided.
 * @param {Date} date1 - A valid minuend date object.
 * @param {Date} [date2] - A valid subtrahend date object.
 * @returns {number} - The difference in hours.
 */
const calcHours = (date1, date2) => {
  if (!date2) {
    return Math.ceil(Math.abs(Date.now() - date1) / 36e5);
  }

  return Math.ceil(Math.abs(date1 - date2) / 36e5);
};

/**
 * Calculates the difference between date1 and date2 in weeks.
 * Or calculates the difference between Date.now() and date1 when date2 is not provided.
 * @param {Date} date1 - A valid minuend date object.
 * @param {Date} [date2] - A valid subtrahend date object.
 * @returns {number} - The difference in weeks.
 */
const calcWeeks = (date1, date2) => {
  if (!date2) {
    return Math.ceil(Math.abs(Date.now() - date1) / 6048e5);
  }

  return Math.ceil(Math.abs(date1 - date2) / 6048e5);
};

/**
 * Calculates the costs of currently running droplets under an account.
 * @param {array} droplets - The droplets array returned by the DO API.
 * @returns {{current: number, projected: number}} - An object containing the projected and current costs of droplets.
 */
const calcDropletsCost = (droplets = []) => {
  let currentCost = 0;
  let projectedCost = 0;
  const today = new Date();
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstOfNextMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1
  );

  for (const droplet of droplets) {
    const dropletCreatedDate = new Date(droplet.created_at);
    // Hourly price of the droplet.
    const hourlyPrice = droplet.size.price_hourly;
    let hoursRun = 0;

    // If the droplet is created after 1st of a month, then calculate price based on the created date.
    if (dropletCreatedDate > firstOfThisMonth) {
      hoursRun = calcHours(dropletCreatedDate);
      // Total hours from the creation of droplet to the end of the month.
      let projectedHours = calcHours(firstOfNextMonth, dropletCreatedDate);
      projectedHours = projectedHours < 672 ? projectedHours : 672;
      projectedCost += Number((projectedHours * hourlyPrice).toFixed(2));
    } else {
      hoursRun = calcHours(firstOfThisMonth);
      projectedCost += Number((672 * hourlyPrice).toFixed(2));
    }

    // During billing, DigitalOcean caps the number of hours ran to 672.
    hoursRun = hoursRun > 672 ? 672 : hoursRun;
    currentCost += Number((hoursRun * hourlyPrice).toFixed(2));
  }

  return {current: currentCost, projected: projectedCost};
};

/**
 * Calculates the cost of currently running databases under an account.
 * @param {array} databases - The databases array returned by the DO API.
 * @returns {{current: number, projected: number}} - An object containing the projected and current costs of databases.
 */
const calcDBCosts = (databases = []) => {
  // DigitalOcean doesn't provide hourly rates of database clusters via API, so we need to hardcode them.
  const dbPriceIndex = {
    'db-s-1vcpu-1gb': {1: 0.022},
    'db-s-1vcpu-2gb': {1: 0.045, 2: 0.074, 3: 0.104},
    'db-s-2vcpu-4gb': {1: 0.089, 2: 0.149, 3: 0.208},
    'db-s-4vcpu-8gb': {1: 0.179, 2: 0.298, 3: 0.417},
    'db-s-6vcpu-16gb': {1: 0.357, 2: 0.595, 3: 0.833},
    'db-s-8vcpu-32gb': {1: 0.714, 2: 1.19, 3: 1.667},
    'db-s-16vcpu-64gb': {1: 2.381, 2: 3.333}
  };

  let currentCost = 0;
  let projectedCost = 0;
  const today = new Date();
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstOfNextMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1
  );

  for (const database of databases) {
    let hoursRun = 0;
    // Retrieve the hourly price based on size slug and number of nodes running.
    const hourlyPrice = dbPriceIndex[database.size][database.num_nodes];
    const databaseCreatedDate = new Date(database.created_at);
    // If the database cluster is created after 1st of a month, then calculate price based on the created date.
    if (databaseCreatedDate > firstOfThisMonth) {
      hoursRun = calcHours(databaseCreatedDate);
      // Total hours from the creation of db to the end of the month.
      let projectedHours = calcHours(firstOfNextMonth, databaseCreatedDate);
      projectedHours = projectedHours < 672 ? projectedHours : 672;
      projectedCost += Number((projectedHours * hourlyPrice).toFixed(2));
    } else {
      hoursRun = calcHours(firstOfThisMonth);
      projectedCost += Number((672 * hourlyPrice).toFixed(2));
    }

    // During billing, DigitalOcean caps the number of hours ran to 672.
    hoursRun = hoursRun > 672 ? 672 : hoursRun;
    currentCost += Number((hoursRun * hourlyPrice).toFixed(2));
  }

  return {current: currentCost, projected: projectedCost};
};

/**
 * Calculates the costs of currently active volumes under an account.
 * @param {array} volumes - The volumes array returned by the DO API.
 * @returns {{current: number, projected: number}} - An object containing the projected and current costs of volumes.
 */
const calcVolumesCost = (volumes = []) => {
  let currentCost = 0;
  let projectedCost = 0;
  const today = new Date();
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstOfNextMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1
  );

  for (const volume of volumes) {
    let hoursRun = 0;
    // DO charges $0.10/GB per month (672 hours). So calculate an approximate hourly price based on it.
    const hourlyPrice = (volume.size_gigabytes * 0.1) / 672;
    const volumeCreatedDate = new Date(volume.created_at);
    // If the volume is created after 1st of a month, then calculate price based on the created date.
    if (volumeCreatedDate > firstOfThisMonth) {
      hoursRun = calcHours(volumeCreatedDate);
      // Total hours from the creation of volume to the end of the month.
      let projectedHours = calcHours(firstOfNextMonth, volumeCreatedDate);
      projectedHours = projectedHours < 672 ? projectedHours : 672;
      projectedCost += Number((projectedHours * hourlyPrice).toFixed(2));
    } else {
      hoursRun = calcHours(firstOfThisMonth);
      projectedCost += Number((672 * hourlyPrice).toFixed(2));
    }

    // During billing, DigitalOcean caps the number of hours ran to 672.
    hoursRun = hoursRun > 672 ? 672 : hoursRun;
    currentCost += Number((hoursRun * hourlyPrice).toFixed(2));
  }

  return {current: currentCost, projected: projectedCost};
};

/**
 * Calculates the costs of snapshots under an account.
 * @param {array} snapshots - The snapshots array returned by the DO API.
 * @returns {{current: number, projected: number}} - An object containing the projected and current costs of snapshots.
 */
const calcSnapshotsCost = (snapshots = []) => {
  let currentCost = 0;
  let projectedCost = 0;
  const today = new Date();
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstOfNextMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1
  );

  for (const snapshot of snapshots) {
    let hoursRun = 0;
    // DO charges $0.05/GB per month (672 hours) for snapshots.
    const hourlyPrice = (snapshot.size_gigabytes * 0.05) / 672;
    const snapshotCreatedDate = new Date(snapshot.created_at);
    // If the snapshot is taken after 1st of a month, then calculate price based on the created date.
    if (snapshotCreatedDate > firstOfThisMonth) {
      hoursRun = calcHours(snapshotCreatedDate);
      // Total hours from the creation of volume to the end of the month.
      let projectedHours = calcHours(firstOfNextMonth, snapshotCreatedDate);
      projectedHours = projectedHours < 672 ? projectedHours : 672;
      projectedCost += Number((projectedHours * hourlyPrice).toFixed(2));
    } else {
      hoursRun = calcHours(firstOfThisMonth);
      projectedCost += Number((672 * hourlyPrice).toFixed(2));
    }

    // During billing, DigitalOcean caps the number of hours ran to 672.
    hoursRun = hoursRun > 672 ? 672 : hoursRun;
    currentCost += Number((hoursRun * hourlyPrice).toFixed(2));
  }

  return {current: currentCost, projected: projectedCost};
};

/**
 * Calculates the costs of droplet backups under an account.
 * @param {array} droplets - The droplets array returned by the DO API.
 * @returns {{current: number, projected: number}} - An object containing the projected and current costs of backups.
 */
const calcBackupsCost = (droplets = []) => {
  let currentCost = 0;
  let projectedCost = 0;
  let totalBackups = 0;

  const today = new Date();
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstOfNextMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1
  );

  for (const droplet of droplets) {
    if (droplet.features.includes('backups')) {
      totalBackups += droplet.backup_ids.length;
      const dropletCreatedDate = new Date(droplet.created_at);
      const hourlyPriceOfDroplet = droplet.size.price_hourly;
      // Each backup costs 5% of the droplet price. They're taken 4 times a month. So at max, they cost 20% of the droplet price.
      const backupPrice = ((hourlyPriceOfDroplet * 672) / 100) * 5;
      let numberOfBackups = 0;

      // If the droplet is created after 1st of a month, then calculate number of backups based on the creation date.
      if (dropletCreatedDate > firstOfThisMonth) {
        // Function calcWeeks never returns 0 unless both the dates are exactly same.
        // So we need to make sure the number of backups are greater than zero to consider calcWeek ouput.
        numberOfBackups =
          droplet.backup_ids.length === 0 ? 0 : calcWeeks(dropletCreatedDate);
        // Total weeks from droplet creation date to the end of month.
        let projectedWeeks = calcWeeks(firstOfNextMonth, dropletCreatedDate);
        projectedWeeks = projectedWeeks < 4 ? projectedWeeks : 4;
        projectedCost += Number((projectedWeeks * backupPrice).toFixed(2));
      } else {
        numberOfBackups =
          droplet.backup_ids.length === 0 ? 0 : calcWeeks(firstOfThisMonth);
        projectedCost += Number((4 * backupPrice).toFixed(2));
      }

      numberOfBackups = numberOfBackups > 4 ? 4 : numberOfBackups;
      currentCost += Number((numberOfBackups * backupPrice).toFixed(2));
    }
  }

  return {
    backupsCost: {current: currentCost, projected: projectedCost},
    totalBackups
  };
};

const _command = async (params, commandText, secrets = {}) => {
  const {digitaloceanApiKey} = secrets;
  if (!digitaloceanApiKey) {
    return {
      text:
        'You need `digitaloceanApiKey` secret to run this command. Create one by running `/nc secret_create`.'
    };
  }

  const {__client} = params;
  const client = __client.name;

  const result = [];
  const BASE_URL = 'https://api.digitalocean.com/v2';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${digitaloceanApiKey}`
  };

  try {
    const [
      dropletsData,
      databasesData,
      snapshotsData,
      volumesData,
      balanceData
    ] = await Promise.all([
      getContent(BASE_URL + '/droplets?per_page=100', headers),
      getContent(BASE_URL + '/databases?per_page=100', headers),
      getContent(BASE_URL + '/snapshots?per_page=100', headers),
      getContent(BASE_URL + '/volumes?per_page=100', headers),
      getContent(BASE_URL + '/customers/my/balance', headers)
    ]);

    const {droplets} = JSON.parse(dropletsData);
    const {databases} = JSON.parse(databasesData);
    const {volumes} = JSON.parse(volumesData);
    const {snapshots} = JSON.parse(snapshotsData);
    const balance = JSON.parse(balanceData);

    const dropletsCost = calcDropletsCost(droplets);
    const databasesCost = calcDBCosts(databases);
    const volumesCost = calcVolumesCost(volumes);
    const snapshotsCost = calcSnapshotsCost(snapshots);
    const {backupsCost, totalBackups} = calcBackupsCost(droplets);

    const totalCurrentCosts = (
      dropletsCost.current +
      databasesCost.current +
      volumesCost.current +
      snapshotsCost.current +
      backupsCost.current
    ).toFixed(2);
    const totalProjectedCosts = (
      dropletsCost.projected +
      databasesCost.projected +
      volumesCost.projected +
      snapshotsCost.projected +
      backupsCost.projected
    ).toFixed(2);

    const today = new Date();

    result.push(
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Realtime Month-to-Date Cost: *$${totalCurrentCosts}* Projected Full-Month Cost: *$${totalProjectedCosts}*`
          }
        },
        client
      )
    );

    if (dropletsCost.projected > 0) {
      result.push(
        mui(
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                // Maintain a uniform column length of 15
                text: `*Droplets* (${droplets.length})   `
              },
              {
                type: 'mrkdwn',
                text: `Current: $${dropletsCost.current.toFixed(2)}`
              },
              {
                type: 'mrkdwn',
                text: `Projected: $${dropletsCost.projected.toFixed(2)}`
              }
            ]
          },
          client
        )
      );
    }

    if (volumesCost.projected > 0) {
      result.push(
        mui(
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*Volumes* (${volumes.length})   `
              },
              {
                type: 'mrkdwn',
                text: `Current: $${volumesCost.current.toFixed(2)}`
              },
              {
                type: 'mrkdwn',
                text: `Projected: $${volumesCost.projected.toFixed(2)}`
              }
            ]
          },
          client
        )
      );
    }

    if (databasesCost.projected > 0) {
      result.push(
        mui(
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*Databases* (${databases.length}) `
              },
              {
                type: 'mrkdwn',
                text: `Current: $${databasesCost.current.toFixed(2)}`
              },
              {
                type: 'mrkdwn',
                text: `Projected: $${databasesCost.projected.toFixed(2)}`
              }
            ]
          },
          client
        )
      );
    }

    if (snapshotsCost.projected > 0) {
      result.push(
        mui(
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*Snapshots* (${snapshots.length})    `
              },
              {
                type: 'mrkdwn',
                text: `Current: $${snapshotsCost.current.toFixed(2)}`
              },
              {
                type: 'mrkdwn',
                text: `Projected: $${snapshotsCost.projected.toFixed(2)}`
              }
            ]
          },
          client
        )
      );
    }

    if (backupsCost.projected > 0) {
      result.push(
        mui(
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*Backups* (${totalBackups})  `
              },
              {
                type: 'mrkdwn',
                text: `Current: $${backupsCost.current.toFixed(2)}`
              },
              {
                type: 'mrkdwn',
                text: `Projected: $${backupsCost.projected.toFixed(2)}`
              }
            ]
          },
          client
        )
      );
    }

    result.push(
      mui(
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `As per DigitalOcean, usage as of ${new Date(
                balance.generated_at
              ).toUTCString()} is *$${balance.month_to_date_usage}*`
            }
          ]
        },
        client
      )
    );
  } catch (error) {
    result.push(
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Error:* ${error.message}`
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
};

const main = async args => ({
  body: await _command(
    args.params,
    args.commandText,
    args.__secrets || {}
  ).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
