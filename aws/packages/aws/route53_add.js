// jshint esversion: 9

async function _command(params, commandText, secrets = {}) {
  const {route53AccessKey, route53SecretKey, route53ZoneId} = secrets;
  if (!route53AccessKey || !route53SecretKey || !route53ZoneId) {
    return {
      response_type: 'in_channel', // or `ephemeral` for private response
      text:
        'You must create secrets for route53AccessKey, route53SecretKey and route53ZoneId to use this command'
    };
  }

  let {hostname, ip_address} = params;
  hostname = hostname.startsWith('<')
    ? hostname.split('|')[1].slice(0, -1)
    : hostname;

  const AWS = require('aws-sdk');

  const route53 = new AWS.Route53({
    accessKeyId: secrets.route53AccessKey,
    secretAccessKey: secrets.route53SecretKey
  });

  let changeParams = {
    HostedZoneId: '/hostedzone/' + secrets.route53ZoneId,
    ChangeBatch: {
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: hostname,
            Type: 'A',
            TTL: 299,
            ResourceRecords: [{Value: ip_address}]
          }
        }
      ]
    }
  };
  return route53
    .changeResourceRecordSets(changeParams)
    .promise()
    .then(
      function(data) {
        return {
          response_type: 'in_channel',
          text:
            'hostname ' +
            hostname +
            ' added. Route53 status: ' +
            data.ChangeInfo.Status
        };
      },
      function(err) {
        return {
          response_type: 'in_channel',
          text: 'Error: ' + JSON.stringify(err)
        };
      }
    );
}

const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
