// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText slack text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Slack response body
 */
async function _command(params, commandText, secrets = {}) {
  const {
    month_year
  } = params;

  AWS = require('aws-sdk');
  
  if (!secrets.awsCostExplorerAccessKeyId || !secrets.awsCostExplorerSecretAccessKey || !secrets.awsCostExplorerRegion) {
    return { response_type: 'ephemeral', text: "You must create secrets for awsCostExplorerAccessKeyId, awsCostExplorerSecretAccessKeyId " +
      "and awsCostExporerRegion to use this command " };
  }

  let now = new Date();
  let month = now.getUTCMonth();
  let year = now.getUTCFullYear();
  if (month_year != null) {
    let arr = month_year.split('/');
    if (arr.length != 2) {
      return { response_type: 'ephemeral', text: 'Invalid month/year. Example: 11/2019 for November 2019' };
    }
    month = parseInt(arr[0]) - 1;
    year = parseInt(arr[1]);
  }
  // determine billing period start/end. toISOString() is UTC (GMT) time, which is what AWS bills in
  let firstOfThisMonth = new Date(year, month, 1);
  let firstOfNextMonth;
  if (month != 12) {
    firstOfNextMonth = new Date(year, month + 1, 1);
  } else {
    firstOfNextMonth = new Date(year + 1, 1, 1);
  }
  let start = firstOfThisMonth.toISOString().substring(0, 10);
  let end = firstOfNextMonth.toISOString().substring(0, 10);
  
  var costexplorer = new AWS.CostExplorer({
    accessKeyId: secrets.awsCostExplorerAccessKeyId,
    secretAccessKey: secrets.awsCostExplorerSecretAccessKey,
    region: secrets.awsCostExplorerRegion
  });
  
  var costParams = {
    "TimePeriod" : {
      "Start" : start,
      "End" : end,
    },
    "Granularity" : "MONTHLY",
    "GroupBy" : [ { Key: "SERVICE", Type: "DIMENSION" } ],
    "Metrics" : ["AmortizedCost"]
  };

  return costexplorer.getCostAndUsage(costParams).promise().then(
    function(data) {
      
      // for debugging:
      // console.log(JSON.stringify(data, null, 4));

      let byServiceString = "";
      let groups = data.ResultsByTime[0].Groups;
      let totalCost = 0.0;
      let unit;
      let hasMultipleUnits = 0;
      let i, n = 0;
      for (i = 0; i < groups.length; i++) {
        let cost = groups[i].Metrics.AmortizedCost.Amount;
        if (cost == 0 ) {
          continue;
        }
        cost = parseFloat(cost);

        // make the service names shorter
        let serviceName =  groups[i].Keys[0];
        serviceName = serviceName.replace("Amazon ", "");
        serviceName = serviceName.replace("Amazon", "");
        serviceName = serviceName.replace("AWS", "");

        totalCost += cost;
        let thisUnit  = groups[i].Metrics.AmortizedCost.Unit;
        if (thisUnit == "USD") {
          costInUnits = "$" + cost.toFixed(2);
        } else {
          costInUnits = cost.toFixed(2) + " " + thisUnit;
        }
        if (n > 0) {
          byServiceString += ", ";
        }
        byServiceString += serviceName + " " + costInUnits;
        if (unit != null && unit != thisUnit) {
          hasMultipleUnits = 1;
        }
        unit = thisUnit;
        n++;
      }

      totalCostString = totalCost.toFixed(2);
      if (hasMultipleUnits) {
        totalCostString += " (costs in in multiple units)";
      } else {
        if (unit == "USD") {
          totalCostString = "$" + totalCostString;
        } else {
          totalCostString += " " + unit;
        }
      }

      // for debugging:
      // console.log("Month-to-date AWS charges: " + totalCostString);
      // console.log("Charges by service: " + byServiceString);

      return {
        response_type: 'in_channel',
        text: "AWS charges for " + (month + 1) + "/" + year + ": " + totalCostString + "\n\nCharges by service: " + byServiceString
      };
    },
    function(error) {
      return { response_type: 'in_channel', text: "Error: " + error };
    }
  );
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async ({__secrets = {}, commandText, ...params}) => ({body: await _command(params, commandText, __secrets)});
module.exports = main;
