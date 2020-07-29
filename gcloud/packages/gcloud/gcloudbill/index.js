// jshint esversion: 9
const bq = require('@google-cloud/bigquery');
const moment = require('moment');

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText slack text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Slack response body
 */
async function _command(params, commandText, secrets = {}) {
    // ensure required api keys are available
    if (!secrets || !secrets.gcloud_service_key || !secrets.gcloud_billing_table_name) {
        return {
            text: "You must create secrets for Google Cloud's Billing service to use this command.\n" +
                  "Secrets required to run this command are:\n- gcloud_service_key\n- gcloud_billing_table_name"
        };
    }

    const project = params.project || '';
    if (project.match(/^[\w-]*$/) === null) {
        return {
            text: "Invalid project name."
        };
    }

    // parse date parameter
    let date;
    let specificDay;

    if (!params.date) {
        date = moment()
    } else {
        const slashCount = (params.date.match(/\//g) || []).length;
        if (slashCount == 1) {
            date = moment(params.date, 'MM/YYYY');
        } else if (slashCount == 2) {
            date = moment(params.date, 'MM/DD/YYYY');
            specificDay = true;
        }

        if (!date || !date.isValid()) {
            return {
                text: "Invalid date format. Execting MM/YYYY or MM/DD/YYYY.\n" + 
                      "Example: 11/2020 for November 2020 or 11/3/2020 for November 3 2020"
            };
        }
    }

    let rows = await query(
        JSON.parse(secrets.gcloud_service_key),
        secrets.gcloud_billing_table_name,
        date,
        specificDay || false,
        project);

    const dateString = date.format(specificDay ? 'MMMM Do YYYY' : 'MMMM YYYY')

    if (rows.length == 0) {
        return {
            response_type: 'in_channel',
            text: `No billing data available for ${dateString}.`
        };
    } else {
        let totalCost = 0;
        let tableBlocks = [];
        let tempBlock = {
            "type": "section",
            "fields": []
        };
        let fieldsArr = [];
        rows.forEach(row => {
            totalCost += row.cost;
            if (fieldsArr.length >= 10) {
                tempBlock.fields = fieldsArr.splice(0, 10);
                tableBlocks.push(tempBlock);
                tempBlock = {
                    "type": "section",
                    "fields": []
                };
            }
            fieldsArr.push({
                "type": "plain_text",
                "text": row.service
            }, {
                "type": "plain_text",
                "text": "$" + row.cost.toFixed(2)
            });
        });
        if (fieldsArr.length > 0) {
            tempBlock.fields = fieldsArr.splice(0, 10);
            tableBlocks.push(tempBlock);
        }

        let costStr = `Google Cloud charges for project ${project} for ${dateString}: \$${totalCost.toFixed(2)}`;
        let blocks = [
            {
                "type": "section",
                "text": {
                    "text": costStr,
                    "type": "mrkdwn"
                },
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": "*Service*"
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Costs*"
                    },
                ]
            },
        ];

        tableBlocks.forEach(block => {
            blocks.push(block);
        });

        return { response_type: 'in_channel', blocks };
    }
}

async function query(credentials, tableName, date, specificDay, project) {
    const year = date.year();
    const month = date.month() + 1;
    const day = specificDay === true ? date.date() : undefined;

    const bqClient = new bq.BigQuery({
        projectId: credentials.project_id,
        credentials
    });

    //adds up all from the cost column of this test dataset 
    const sqlQuery = `
        SELECT service.description AS service, project.name AS project, SUM(cost) AS cost
        FROM ${tableName}
        WHERE EXTRACT(YEAR from usage_start_time) = ${year}
          AND EXTRACT(MONTH from usage_start_time) = ${month}
          AND EXTRACT(DAY from usage_start_time) ${specificDay ? '= ' + day : '> 0'}
          AND project.name = "${project}"
          GROUP BY service, project
    `.trim();

    // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
    const options = {
        query: sqlQuery,
        // Location must match that of the dataset(s) referenced in the query.
        location: 'US',
    };

    // Run the query
    const [rows] = await bqClient.query(options);
    return rows;
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

module.exports.main = main;
