// jshint esversion: 9

function compactResponse(data, type, match) {
  let title = 'All route53 ';
  if (!type) {
    title += 'hostnames';
  } else {
    title += ' ' + type + ' records';
  }
  if (!match) {
    title += ':';
  } else {
    title += ' containing "' + match + '":';
  }
  let response =  {
    "response_type": "in_channel",
    "attachments":
      [ {
      "title": title,
      "color": "#764FA5"
      } ]
  };

  let rr = data.ResourceRecordSets;
  let fields = [];
  for (var i in rr) {
    if (type == undefined || type == rr[i].Type) {
      let name = rr[i].Name.replace('\\052', '*');
      let value = rr[i].ResourceRecords[0].Value;
      if (!match || name.includes(match)) {
        fields.push( { "title": name, "value": value, "short": true } );
      }
    }
  }

  response.attachments[0].fields = fields;
  return response;
}

async function _command(params, commandText, secrets = {}) {
  const {
    type = false,
    record_type,
    match = false,
    match_string
  } = params;

  if (!secrets.route53AccessKey || !secrets.route53SecretKey || !secrets.route53ZoneId) {
    return {
      response_type: 'in_channel', // or `ephemeral` for private response
      text: "You must create secrets for route53AccessKey, route53SecretKey and route53ZoneId to use this command"
    };
  }

  const AWS = require('aws-sdk');

  // initialize with AWS.Route53() instead of AWS config for better peformance
  const route53 = new AWS.Route53({
    accessKeyId: secrets.route53AccessKey,
    secretAccessKey: secrets.route53SecretKey
  });

  // returns a promise which will be resolved before the function returns
  const zoneParams = { HostedZoneId: '/hostedzone/' + secrets.route53ZoneId };
  return route53.listResourceRecordSets(zoneParams).promise().then(
    function(data) {
      return compactResponse(data, record_type, match_string);
    },
    function(err) {
      return {
        response_type: 'in_channel',
        text: "Error: " + err
      };
    }
  );
}

const main = async ({__secrets = {}, commandText, ...params}) => ({body: await _command(params, commandText, __secrets)});
module.exports = main;
