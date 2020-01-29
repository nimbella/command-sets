// jshint esversion: 8

// this code is from: https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies/
// it allows us to do a promise https request without any dependencies
const getContent = function(url) {
  // return new pending promise
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    const lib = url.startsWith('https') ? require('https') : require('http');
    const request = lib.get(url, response => {
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

//
// Datadog does not have an API where you can query your bill. Instead they have a usage
// API that you have to query and then you need to calculate your bill yourself. This
// code calculates a bill estimate based on host, APM host, custom metric and browser
// test usage using the following as a basis for guessing cost:
//
// As of July 2019:
//
// On-Demand Hosts @ $18 per month
// On-Demand APM Hosts @ $36 per month
// On-Demand Custom Metrics @ $0.05 each
// On-Demand Browser Tests @ $7.20 / thousand
//
// This code does not calculate all Datadog service bills. It only estimates cost based
// on the limited services and rates above.
//
// Additionally, Datadog has this:
//
// Datadog meters the count of hosts, containers, and custom metrics hourly. The billable count of hosts and containers
// is calculated at the end of the month using the maximum count (high-water mark) of the lower 99 percent of usage
// for those hours. We exclude the top 1% to reduce the impact of spikes in usage on your bill. The billable count
// of custom metrics is based on the average number of custom metric hours for the month. See your Usage in Datadog."
//
// And Datadog has a rate limit of 60 requests per hour per-API key to their usage API at this time
//
function calcHostsCosts(json) {
  const numHours = json.usage.length;
  if (numHours === 0) {
    return {cost: 0, forwardCost: 0};
  }

  const hostsByHour = [];
  const apmHostsByHour = [];

  let numBadHosts = 0;
  let recentHostCount = 0;
  let recentApmHostCount = 0;

  for (const usage of json.usage) {
    const hostCount = usage.host_count;
    const apmHostCount = usage.apm_host_count;

    // datadog's usage logging has problems where recent host fields are null for unknown reasons
    if (!hostCount || !apmHostCount) {
      numBadHosts += 1;
    } else {
      hostsByHour.push(hostCount);
      recentHostCount = hostCount;
      apmHostsByHour.push(apmHostCount);
      recentApmHostCount = apmHostCount;
    }
  }

  const maxHostCount = Math.max(...hostsByHour);
  const maxApmHostCount = Math.max(...apmHostsByHour);

  hostsByHour.sort((a, b) => b - a);
  apmHostsByHour.sort((a, b) => b - a);
  const n99 = Math.floor(numHours * 0.01);
  const billingHostCount = hostsByHour[n99];
  const billingApmHostCount = apmHostsByHour[n99];

  const cost = billingHostCount * 18 + billingApmHostCount * 36;
  const forwardCost = recentHostCount * 18 + recentApmHostCount * 36;

  return {
    cost,
    forwardCost,
    numBadHosts,
    billingHostCount,
    billingApmHostCount,
    maxHostCount,
    recentHostCount,
    recentApmHostCount,
    maxApmHostCount,
    numHours,
    n99
  };
}

function calcMetricsCosts(json) {
  const numHours = json.usage.length;
  if (numHours === 0) {
    return {cost: 0, forwardCost: 0};
  }

  const metricsByHour = [];

  for (let i = 0; i < numHours; i++) {
    metricsByHour.push(json.usage[i].num_custom_timeseries);
  }
  const maxMetricsCount = Math.max(...metricsByHour);
  const recentMetricsCount = metricsByHour[numHours - 1];

  metricsByHour.sort((a, b) => b - a);
  const n99 = Math.floor(numHours * 0.01);
  const billingMetricsCount = metricsByHour[n99];

  const cost = billingMetricsCount * 0.05;
  const forwardCost = recentMetricsCount * 0.05;

  return {
    cost,
    forwardCost,
    billingMetricsCount,
    recentMetricsCount,
    maxMetricsCount
  };
}

function calcSyntheticsCosts(json) {
  const numHours = json.usage.length;
  if (numHours === 0) {
    return {cost: 0, forwardCost: 0};
  }

  let recentCount = 0;
  let totalSynthetics = 0;
  for (let i = 0; i < numHours; i++) {
    const count = json.usage[i].check_calls_count;
    totalSynthetics += count;
    recentCount = count;
  }

  const cost = (totalSynthetics / 1000) * 7.2 * (720 / numHours);
  const forwardCost = ((recentCount * 24 * 30) / 1000) * 7.2;

  return {
    cost,
    forwardCost,
    totalSynthetics,
    recentCount
  };
}

function calcCosts(hostsJson, timeseriesJson, syntheticsJson) {
  const verbose = {};
  const hostsCosts = calcHostsCosts(hostsJson);
  const metricsCosts = calcMetricsCosts(timeseriesJson);
  const syntheticsCosts = calcSyntheticsCosts(syntheticsJson);

  if (hostsCosts.cost !== 0) {
    const {cost, forwardCost, ...hosts} = hostsCosts;
    verbose.Hosts = hosts;
  }

  if (metricsCosts.cost !== 0) {
    const {cost, forwardCost, ...metrics} = metricsCosts;
    verbose.Metrics = metrics;
  }

  if (syntheticsCosts.cost !== 0) {
    const {cost, forwardCost, ...synthetics} = syntheticsCosts;
    verbose.Synthetics = synthetics;
  }

  const totalCost = hostsCosts.cost + metricsCosts.cost + syntheticsCosts.cost;
  const totalForwardCost =
    hostsCosts.forwardCost +
    metricsCosts.forwardCost +
    syntheticsCosts.forwardCost;

  return {
    totalCost,
    totalForwardCost,
    verbose
  };
}

const _command = async (params, commandText, secrets = {}) => {
  const {datadogApiKey, datadogApplicationKey} = secrets;
  if (!datadogApiKey || !datadogApplicationKey) {
    return {
      text:
        `You need \`datadogApiKey\` and \`datadogApplicationKey\` secrets to use this command.` +
        `Create them by running \`/nc secret_create\``
    };
  }

  const {detail = false} = params;
  const result = [];

  const now = new Date();
  const firstOfThisMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const startHour = firstOfThisMonth.toISOString().slice(0, 13);
  const endHour = now.toISOString().slice(0, 13);

  const URL = 'https://api.datadoghq.com/api/v1/usage';

  const query =
    '?api_key=' +
    datadogApiKey +
    '&application_key=' +
    datadogApplicationKey +
    '&start_hr=' +
    startHour +
    '&end_hr=' +
    endHour;

  try {
    const [hostsData, timeseriesData, syntheticsData] = await Promise.all([
      getContent(URL + '/hosts' + query),
      getContent(URL + '/timeseries' + query),
      getContent(URL + '/synthetics' + query)
    ]);

    const {totalCost, totalForwardCost, verbose} = calcCosts(
      JSON.parse(hostsData),
      JSON.parse(timeseriesData),
      JSON.parse(syntheticsData)
    );

    result.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Datadog Bill*`
      }
    });

    result.push({type: 'divider'});

    result.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Projected this month: *$${totalCost.toFixed(
          2
        )}* Projected next month: *$${totalForwardCost.toFixed(2)}*`
      }
    });

    if (detail === true) {
      for (const [key, service] of Object.entries(verbose)) {
        result.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${key}*`
          }
        });

        const detailSection = {type: 'section', fields: []};
        for (const [key, value] of Object.entries(service)) {
          detailSection.fields.push({
            type: 'mrkdwn',
            text: `${key}: \`${value}\``
          });
        }

        result.push(detailSection);
      }
    }
  } catch (error) {
    result.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Error*: ${error.message}`
      }
    });
  }

  return {
    response_type: 'in_channel',
    blocks: result
  };
};

const main = async ({__secrets = {}, commandText, ...params}) => ({
  body: await _command(params, commandText, __secrets)
});
module.exports = main;
