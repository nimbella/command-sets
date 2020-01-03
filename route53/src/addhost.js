// jshint esversion: 9

async function _command(params, commandText, secrets = {}) {
  const {hostname, ip_address: ipAddress} = params;
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

  const route53 = new AWS.Route53({
    accessKeyId: secrets.route53AccessKey,
    secretAccessKey: secrets.route53SecretKey
  });

  const changeParams = {
    HostedZoneId: '/hostedzone/' + secrets.route53ZoneId,
    ChangeBatch: {
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: hostname,
            Type: 'A',
            TTL: 299,
            ResourceRecords: [{Value: ipAddress}]
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
          response_type: 'in_channel', // eslint-disable-line camelcase
          text:
            'hostname ' +
            hostname +
            ' added. Route53 status: ' +
            data.ChangeInfo.Status
        };
      },
      function(err) {
        return {
          response_type: 'in_channel', // eslint-disable-line camelcase
          text: 'Error: ' + JSON.stringify(err)
        };
      }
    );
}

const main = async ({__secrets = {}, commandText, ...params}) => ({
  body: await _command(params, commandText, __secrets)
});
module.exports = main;
