// jshint esversion: 8

// this code is from: https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies/
// it allows us to do a promise https request without any dependencies

const getContent = function(url) {
  // return new pending promise
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    const lib = url.startsWith('https') ? require('https') : require('http');
    const request = lib.get(url, (response) => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('Failed to load page, status code: ' + response.statusCode));
       }
      // temporary data holder
      const body = [];
      // on every content chunk, push it to the data array
      response.on('data', (chunk) => body.push(chunk));
      // we are done, resolve promise with those joined chunks
      response.on('end', () => resolve(body.join('')));
    });
    // handle connection errors of the request
    request.on('error', (err) => reject(err));
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
  let numHours = json.usage.length;
  if (numHours == 0) {
    return { cost: 0, forwardCost: 0, text: "no data" };
  }

  let numBadHosts = 0;
  let hostsByHour = [];
  let apmHostsByHour = [];
  let recentHostCount = 0;
  let recentApmHostCount = 0;
  let i;
  for (i = 0; i < numHours; i++) {
    let hostCount = json.usage[i].host_count;
    let apmHostCount = json.usage[i].apm_host_count;

    // datadog's usage logging has problems where recent host fields are null for unknown reasons
    if (!hostCount || !apmHostCount) {
      numBadHosts = numBadHosts + 1;
    } else {
      hostsByHour.push(hostCount);
      recentHostCount = hostCount;
      apmHostsByHour.push(apmHostCount);
      recentApmHostCount = apmHostCount;
    }
  }
  let maxHostCount = Math.max(...hostsByHour);
  let maxApmHostCount = Math.max(...apmHostsByHour);

  hostsByHour.sort((a, b) => b - a);
  apmHostsByHour.sort((a, b) => b - a);
  let n99 = Math.floor(numHours * 0.01);
  let billingHostCount =  hostsByHour[n99];
  let billingApmHostCount = apmHostsByHour[n99];

  let cost = billingHostCount * 18 + billingApmHostCount * 36;
  let forwardCost = recentHostCount * 18 + recentApmHostCount * 36;

  return { cost: cost, forwardCost: forwardCost, text: "numBadHosts=" + numBadHosts + " billingHostCount=" + billingHostCount +
   " billingApmHostCount=" + billingApmHostCount + " maxHostCount=" + maxHostCount +
   " recentHostCount=" + recentHostCount + " recentApmHostCount=" + recentApmHostCount +
   " maxApmHostCount=" + maxApmHostCount + " numHours=" + numHours + " 99th=#" + n99 };
}

function calcMetricsCosts(json) {
  numHours = json.usage.length;
  if (numHours == 0) {
    return { cost: 0, forwardCost: 0, text: "no data" };
  }

  // for debugging:
  // console.log(JSON.stringify(json, null, 4));

  let metricsByHour = [];
  let i;
  for (i = 0; i < numHours; i++) {
    metricsByHour.push(json.usage[i].num_custom_timeseries);
  }
  let maxMetricsCount = Math.max(...metricsByHour);
  let recentMetricsCount = metricsByHour[numHours - 1];

  metricsByHour.sort((a, b) => b - a);
  let n99 = Math.floor(numHours * 0.01);
  let billingMetricsCount =  metricsByHour[n99];

  let cost = billingMetricsCount * 0.05;
  let forwardCost = recentMetricsCount * 0.05;

  return { cost: cost, forwardCost: forwardCost, text: "metricsCost=" + cost.toFixed(2) + " forwardMetricsCost=" + forwardCost.toFixed(2) + " billingMetrics=" + billingMetricsCount + " recentMetrics=" + recentMetricsCount + " maxMetricsCount=" + maxMetricsCount };
}

function calcSyntheticsCosts(json) {
  numHours = json.usage.length;
  if (numHours == 0) {
    return { cost: 0, forwardCost: 0, text: "no data" };
  }

  let recentCount = 0;
  let totalSynthetics = 0;
  for (i = 0; i < numHours; i++) {
    let c = json.usage[i].check_calls_count;
    totalSynthetics += c;
    recentCount = c;
  }

  let cost = (totalSynthetics / 1000) * 7.2 * (720 / numHours);
  let forwardCost = (recentCount * 24 * 30) / 1000 * 7.2;

  return { cost: cost, forwardCost: forwardCost, text: "numSyn=" + totalSynthetics + " synCost=" + cost.toFixed(2) + " forwardSynCost=" + forwardCost.toFixed(2) + " recentSyn=" + recentCount };
}

function calcCosts(hostsJson, timeseriesJson, syntheticsJson) {
    let hostsCosts = calcHostsCosts(hostsJson);
    let metricsCosts = calcMetricsCosts(timeseriesJson);
    let syntheticsCosts = calcSyntheticsCosts(syntheticsJson);

    let cost = hostsCosts.cost +  metricsCosts.cost + syntheticsCosts.cost;
    let forwardCost = hostsCosts.forwardCost +  metricsCosts.forwardCost + syntheticsCosts.forwardCost;

    let detail = hostsCosts.text + " " + metricsCosts.text + " " + syntheticsCosts.text;

    return { body: { response_type: 'in_channel', text: "Datadog projected cost this month $" + cost.toFixed(2) + " Projected cost next month $" + forwardCost.toFixed(2) + "\n\nDetail: " + detail } };
}

function main(params) {
  if (!params.__secrets || !params.__secrets.datadogApiKey || !params.__secrets.datadogApplicationKey) {
    return { body: { text: "You must create secrets for datadogApiKey and datadogApplicationKey to use this command " } };
  }

  
  const api_key = params.__secrets.datadogApiKey;
  const application_key = params.__secrets.datadogApplicationKey;

  let now = new Date();
  let firstOfThisMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);

  let start_hr = firstOfThisMonth.toISOString().substring(0, 13);
  let end_hr = now.toISOString().substring(0, 13);

  let query = "?api_key=" + api_key + "&application_key=" + application_key + "&start_hr=" + start_hr + "&end_hr=" + end_hr;
  let url = "https://api.datadoghq.com/api/v1/usage/hosts";
  return getContent(url + query).then(
    function(hostsHtml) {
      url = "https://api.datadoghq.com/api/v1/usage/timeseries?";
      return getContent(url + query).then(
        function(timeseriesHtml) {
          url = "https://api.datadoghq.com/api/v1/usage/synthetics?";
          return getContent(url + query).then(
            function(syntheticsHtml) {
              return calcCosts(JSON.parse(hostsHtml), JSON.parse(timeseriesHtml), JSON.parse(syntheticsHtml));
            },
            function(error) {
              return { body: { text: "ERROR " + error} };
            }
          );
        },
        function(error) {
          return { body: { text: "ERROR " + error} };
        }
      );
    },
    function(error) {
      return { body: { text: "ERROR " + error} };
    }
  );
}
