// jshint esversion: 9

/**
 * A small function that converts slack elements `context` and `section` to mattermost compatible markdown.
 * @param {object} element - Slack element
 * @param {string} client - name of the client
 */
const mui = (element, client) => {
  if (client === 'slack') {
    return element;
  }

  const output = [];
  switch (element.type) {
    case 'context': {
      for (const item of element.elements) {
        output.push(item.text.replace(/\*/g, '**'));
      }
      break;
    }
    case 'section': {
      if (element.fields && element.fields.length > 0) {
        for (const field of element.fields) {
          output.push(field.text.replace(/\*/g, '**') + '\n');
        }
      } else if (element.text) {
        // Convert single text element to h4 in mattermost.
        output.push('#### ' + element.text.text.replace(/\*/g, '**'));
      }
      break;
    }
    case 'divider': {
      output.push('***');
      break;
    }
  }

  return output.join(' ');
};

/**
 * @description Shows your AWS bill
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText slack text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Slack response body
 */
async function _command(params, commandText, secrets = {}) {
  const {
    awsCostExplorerAccessKeyId,
    awsCostExplorerSecretAccessKey,
    awsCostExplorerRegion
  } = secrets;

  if (
    !awsCostExplorerAccessKeyId ||
    !awsCostExplorerSecretAccessKey ||
    !awsCostExplorerRegion
  ) {
    return {
      response_type: 'ephemeral', // eslint-disable-line camelcase
      text: `You must create secrets for \`awsCostExplorerAccessKeyId\`, \`awsCostExplorerSecretAccessKey\` and \`awsCostExplorerRegion\` to use this command`
    };
  }

  const {month_year: monthYear, __client} = params;

  const client = __client.name;

  const AWS = require('aws-sdk');

  const now = new Date();
  let month = now.getUTCMonth();
  let year = now.getUTCFullYear();

  if (monthYear != null) {
    const arr = monthYear.split('/');
    if (arr.length != 2) {
      return {
        response_type: 'ephemeral',
        text: 'Invalid month/year. Example: 11/2019 for November 2019'
      };
    }
    month = parseInt(arr[0]) - 1;
    year = parseInt(arr[1]);
    if (month < 1 || month > 12 || year < 1900 || year > 2800) {
      return {
        response_type: 'ephemeral', // eslint-disable-line camelcase
        text: 'Month or year out of range. Example: 11/2019 for November 2019'
      };
    }
  }

  // Determine billing period start/end. toISOString() is UTC (GMT) time, which is what AWS bills in
  const firstOfThisMonth = new Date(year, month, 1);
  const firstOfNextMonth = new Date(year, month + 1, 1);

  const start = firstOfThisMonth.toISOString().substring(0, 10);
  const end = firstOfNextMonth.toISOString().substring(0, 10);

  const costParams = {
    TimePeriod: {
      Start: start,
      End: end
    },
    Granularity: 'MONTHLY',
    GroupBy: [{Key: 'SERVICE', Type: 'DIMENSION'}],
    Metrics: ['AmortizedCost']
  };

  const result = {response_type: 'in_channel', blocks: []};

  const costExplorer = new AWS.CostExplorer({
    accessKeyId: secrets.awsCostExplorerAccessKeyId,
    secretAccessKey: secrets.awsCostExplorerSecretAccessKey,
    region: secrets.awsCostExplorerRegion
  });

  try {
    const {promisify} = require('util');
    const getCostAndUsageAsync = promisify(costExplorer.getCostAndUsage).bind(
      costExplorer
    );
    const data = await getCostAndUsageAsync(costParams);

    const serviceSectionList = [];
    let serviceSection = {type: 'section', fields: []};
    const {Groups: groups} = data.ResultsByTime[0];
    let totalCost = 0.0;
    let unit;
    let hasMultipleUnits = false;

    let serviceFieldCount = 0;
    for (const service of groups) {
      const cost = Number(service.Metrics.AmortizedCost.Amount);
      if (cost === 0) {
        continue;
      }
	  if (serviceFieldCount == 10) {
		serviceSectionList.push(serviceSection);
        serviceSection = {type: 'section', fields: []};
        serviceFieldCount = 0;
      }
      serviceFieldCount++;
      
      // Object key is the search value & object value is the replace value.
      const replaceDict = {
        'Elastic Compute Cloud': 'Elastic Compute',
        'Amazon ': '',
        AWS: '',
        'Elastic Container Service for Kubernetes': 'ECS for Kubernetes',
        'EC2 Container Registry (ECR)': 'EC2 Container Registry'
      };

      const regex = new RegExp(Object.keys(replaceDict).join('|'), 'gi');
      const serviceName = service.Keys[0].replace(
        regex,
        matched => replaceDict[matched]
      );

      totalCost += cost;
      const {Unit: serviceUnit} = service.Metrics.AmortizedCost;
      if (serviceUnit == 'USD') {
        costInUnits = '$' + cost.toFixed(2);
      } else {
        costInUnits = cost.toFixed(2) + ' ' + serviceUnit;
      }
      serviceSection.fields.push({
        type: 'mrkdwn',
        text: costInUnits + ' *' + serviceName + '*'
      });
      if (unit != null && unit != serviceUnit) {
        hasMultipleUnits = true;
      }
      unit = serviceUnit;
    }
    if (serviceFieldCount > 0) {
      serviceSectionList.push(serviceSection);
    }
    totalCostString = totalCost.toFixed(2);
    if (hasMultipleUnits) {
      totalCostString += ' (costs in in multiple units)';
    } else {
      if (unit == 'USD') {
        totalCostString = '$' + totalCostString;
      } else {
        totalCostString += ' ' + unit;
      }
    }

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];

    let title = totalCostString + ' ';
    if (groups.length == 0) {
      title = '*Cost information is not available for this month yet*';
    } else if (monthYear != null) {
      title += '*AWS Cost for ' + months[month] + ' ' + year + '*';
    } else {
      title += '*AWS Cost Month-to-Date*';
    }

    result.blocks.push(
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: title
          }
        },
        client
      )
    );

    result.blocks.push(
      mui(
        {
          type: 'divider'
        },
        client
      )
    );
    for (serviceSection of serviceSectionList) {
      result.blocks.push(mui(serviceSection, client));
    }
  } catch (error) {
    result.response_type = 'ephemeral';
    result.text = `Error: ${error.message}`;
  }

  if (client === 'mattermost') {
    result.text = result.blocks.join('\n');
    delete result.blocks;
    return result;
  }

  return result;
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */
const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
