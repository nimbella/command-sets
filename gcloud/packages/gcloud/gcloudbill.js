// jshint esversion: 9
var bq;
const path = "./gcloud_cred.json";
//var st;

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText slack text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Slack response body
 */
async function _command(params, commandText, secrets = {}) {
    if (!secrets || !secrets.gcloud_cred_json || !secrets.gcloud_cred_key || !secrets.billing_table_name) {
        return { body: { text: "You must create secrets for GCloud Billing service to use this command.\nSecrets required to run this command are: \ngcloud_cred_json \ngcloud_cred_key \nbilling_table_name" } };
    }
    let month;
    let year;
    if (params.month_year) {
        let dateArr = params.month_year.split("/");
        console.log(dateArr)
        if(dateArr[0].length == 1){
            month = '0' + dateArr[0]
        }else if(dateArr[0].length == 2 && (dateArr[0].charAt(0) == '0' || dateArr[0] == "11" || dateArr[0] == "12")){
            month = dateArr[0];
        }else{
            return { response_type: 'ephemeral', text: 'Invalid month/year. Example: 11/2019 for November 2019' };
        }
        year = dateArr[1];
        if (year.charAt(0) == '9' && year.length == 2) {
            year = "19" + year;
        } else if (year.length == 2) {
            year = "20" + year;
        }
    } else {
        let d = new Date();
        month = d.getMonth() + 1;
        year = d.getFullYear()
    }
    if (!bq) {
        //Only installs on the first run after an edit
        console.log(await run("npm install --save @google-cloud/bigquery"));
        bq = require('@google-cloud/bigquery');
    }

    let google_app_cred = JSON.parse(secrets.gcloud_cred_json);
    google_app_cred.private_key = JSON.parse(secrets.gcloud_cred_key);

    setEV(google_app_cred);
    let monthName = getMonthName(month);
    let totalCost = 0;
    let rows = await query(google_app_cred.project_id, secrets.billing_table_name, month, year);
    if (rows.length == 0) {
        return { response_type: 'in_channel', text: "No billing data availible for " + monthName + ", " + year + "." };
    } else {
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
        let costStr = "Google Cloud charges from " + monthName + ", " + year + ": $" + totalCost.toFixed(2);
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
function getMonthName(monthNumb) {

    var month = new Array();
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";
    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";
    return month[monthNumb - 1];
}
function setEV(google_app_cred) {
    const fs = require('fs');

    if (!fs.existsSync(path)) {
        console.log("creating file");
        fs.writeFileSync(path, JSON.stringify(google_app_cred));
        console.log(JSON.parse(fs.readFileSync(path)));
    }
    process.env.GOOGLE_APPLICATION_CREDENTIALS = path;
}
async function query(projectId, tableName, month, year) {
    const bqClient = new bq.BigQuery({ projectId: projectId, keyFilename: path });

    //adds up all from the cost column of this test dataset 
    const sqlQuery = 'select service.description as service,  SUM(cost) as cost  from  ' + tableName + ' where EXTRACT(YEAR from usage_start_time) = ' + year + ' AND EXTRACT(MONTH from usage_start_time) = ' + month + ' group by service;';
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
async function run(str) {

    return new Promise((resolve, reject) => {
        const { exec } = require('child_process');
        exec(str, (err, stdout, stderr) => {
            if (err) reject(err);
            else resolve(stdout);
        });
    });
}
/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async ({ __secrets = {}, commandText, ...params }) => ({ body: await _command(params, commandText, __secrets) });
module.exports = main;
