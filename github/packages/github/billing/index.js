const {
    GetHeader,
    GetFooter,
    GetBaseUrl,
    Fail,
    Request,
    Text,
    Section
  } = require('./common')


/**
 * @description 
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @param {?string} token oauth token
 * @return {Promise<SlackBodyType>} Response body
 */
async function command(params, commandText, secrets = {}, token = null) {
    let {
        entity = 'package',
        type,
        org,
        user,
        host
    } = params;

    let method = 'GET'
    let data = {}
    let list_path = ''
    type = type || 'user'

    if (type === 'org' && !org) return Fail('*please specify organization*')
    if (type === 'user' && !user) return Fail('*please specify user*')

    if (!['org', 'user'].includes(type))
        return Fail(`*expected type to be one of 'org', 'user'*`)

    switch (entity) {
        case 'a':
        case 'action':
            entity = 'action';
            list_path = 'actions'
            break;
        case 'p':
        case 'package':
            entity = 'package'
            list_path = 'packages'
            break;
        case 's':
        case 'storage':
            entity = 'storage'
            list_path = 'shared-storage'
            break;
        default:
            return Fail(`*Invalid Entity. Expected options: 'action', 'package', 'storage' *`)
    }
    const url = `${GetBaseUrl(host, secrets.github_host)}/${type}s/${type === 'org' ? org : user}/settings/billing/${list_path}`
    console.log(url);
    const res = await Request(url, entity, method, data, token)

    const { header, currReading } = GetHeader(res, token)
    if (currReading === 0) {
        return Fail(header);
    }
    return success(entity, header, res.data, secrets);
}

const _actions = (item, response) => {
    const block = {
        type: 'section',
        fields: [
            Text(`*Total Minutes Used:* ${item.total_minutes_used}
      \n*Total Paid Minutes Used:* ${item.total_paid_minutes_used}
      \n*Included Minutes:* ${item.included_minutes}
      \n*Minutes Used Breakdown:* _Ubuntu_ ${item.minutes_used_breakdown.UBUNTU}, _Mac_ ${item.minutes_used_breakdown.MACOS}, 
      _Windows_ ${item.minutes_used_breakdown.WINDOWS}`),
        ],
    }
    response.blocks.push(block)
};

const _packages = (item, response) => {
    const block = {
        type: 'section',
        fields: [
            Text(`*Total Gigabytes Bandwidth Used:* ${item.total_gigabytes_bandwidth_used}
      \n*Total Paid Gigabytes Bandwidth Used:* ${item.total_paid_gigabytes_bandwidth_used}
      \n*Included Gigabytes Bandwidth:* ${item.included_gigabytes_bandwidth}`),
        ],
    }
    response.blocks.push(block)
};

const _storage = (item, response) => {
    const block = {
        type: 'section',
        fields: [
            Text(`*Days Left In Billing Cycle:* ${item.days_left_in_billing_cycle}
      \n*Estimated Paid Storage For Month:* ${item.estimated_paid_storage_for_month}
      \n*Estimated Storage For Month:* ${item.estimated_storage_for_month}`),
        ],
    }
    response.blocks.push(block)
};

const success = async (entity, header, data, secrets) => {
    const response = {
        response_type: 'in_channel',
        blocks: [Section(header)],
    };
    if (entity === 'package')
        _packages(data || [], response)
    else if (entity === 'storage')
        _storage(data || [], response)
    else
        _actions(data, response)

    response.blocks.push(GetFooter());
    return response
};

const main = async (args) => ({
    body: await command(args.params, args.commandText, args.__secrets || {}, args.token || null).catch((error) => ({
        response_type: 'ephemeral',
        text: `Error: ${error.message}`,
    })),
});

module.exports = main;
