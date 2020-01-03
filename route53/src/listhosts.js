// jshint esversion: 9

function compactResponse(data, type, match) {
  let title = 'All route53 ';
  if (type) {
    title += ' ' + type + ' records';
  } else {
    title += 'hostnames';
  }

  if (match) {
    title += ' containing "' + match + '":';
  } else {
    title += ':';
  }

  const response = {
    response_type: 'in_channel', // eslint-disable-line camelcase
    attachments: [
      {
        title,
        color: '#764FA5'
      }
    ]
  };

  const rr = data.ResourceRecordSets;
  const fields = [];
  for (const i in rr) {
    if (type === undefined || type === rr[i].Type) {
      const name = rr[i].Name.replace('\\052', '*');
      const value = rr[i].ResourceRecords[0].Value;
      if (!match || name.includes(match)) {
        fields.push({title: name, value, short: true});
      }
    }
  }

  response.attachments[0].fields = fields;
  return response;
}

async function _command(params, commandText, secrets = {}) {
  const {record_type: recordType, match_string: matchString} = params;
  const {route53AccessKey, route53SecretKey, route53ZoneId} = secrets;

  if (!route53AccessKey || !route53SecretKey || !route53ZoneId) {
    return {
      // Or `ephemeral` for private response
      response_type: 'in_channel', // eslint-disable-line camelcase
      text:
        'You must create secrets for route53AccessKey, route53SecretKey and route53ZoneId to use this command'
    };
  }

  const AWS = require('aws-sdk');

  // Initialize with AWS.Route53() instead of AWS config for better peformance
  const route53 = new AWS.Route53({
    accessKeyId: secrets.route53AccessKey,
    secretAccessKey: secrets.route53SecretKey
  });

  // Returns a promise which will be resolved before the function returns
  const zoneParams = {HostedZoneId: '/hostedzone/' + secrets.route53ZoneId};
  return route53
    .listResourceRecordSets(zoneParams)
    .promise()
    .then(
      function(data) {
        return compactResponse(data, recordType, matchString);
      },
      function(err) {
        return {
          response_type: 'in_channel', // eslint-disable-line camelcase
          text: 'Error: ' + err
        };
      }
    );
}

const main = async ({__secrets = {}, commandText, ...params}) => ({
  body: await _command(params, commandText, __secrets)
});
module.exports = main;
