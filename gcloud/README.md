# gcloud

A set of GCloud commands that you can install and run using [Nimbella Commander](https://nimbella.com/resources-commander/overview).

## Installing Google Cloud Commands

If you don't have the Nimbella Commander Slack app installed, [follow the tutorial](https://nimbella.com/resources-commander/quickstart#quickstart-guide).
Install the Google Cloud Command set using `/nc csm_install gcloud`

## Access billing info via BigQuery

To use the GCloud Billing command provided in this repo, you need to enable Cloud Billing to export into BigQuery. This allows you to:

1. View much more detailed charges and usage data in the BigQuery console.
2. Use SQL to pull certain subsets of this information in the BigQuery console.
3. Access and organize this data any way you want, programmatically.
   Follow the following instructions to set up Google Cloud Billing with BigQuerey. If you already have BigQuery enabled, you can skip to the last section to insert your keys into this command's secrets.

### Create a BigQuery Dataset

- [ ] Make sure you have the **Billing Account Administrator** role, a project, and a linked billing account.
- [ ] Navigate to the [BigQuery page](https://console.cloud.google.com/bigquery) and make sure your project is selected in the drop-down in the top left.
      ![select_project_gcloud.png](https://github.com/SambaDialloB/hosted-images-on-github/blob/master/select_project_gcloud.png)
- [ ] Add a dataset using the button under the resources tab on the left. Fill in the required information <img align="right" width=200 height=50 src="https://github.com/SambaDialloB/hosted-images-on-github/blob/master/create_dataset_gcloud.png">
- [ ] Now you have a dataset that you can access with the gcloud_bill command.

### Connect Cloud Billing to the BigQuery dataset

- [ ] Access your [Billing Cloud Console](https://console.cloud.google.com/billing/) and choose your Billing Account.
- [ ] Click Billing Export on the left and make sure BigQuery is selected near the top.
- [ ] If your Daily cost detail is disabled, edit the settings and choose your new dataset to export your bills to. <img align="right" width=300 height=200 src="https://github.com/SambaDialloB/hosted-images-on-github/blob/master/export_dataset_gcloud.png">
- [ ] After clicking "Save", your data will take a while to load into BigQuery. After a few hours, you should see data loaded into your dataset!

Since we now have a dataset set up, go ahead and create SQL statements to query it!

### Create gcloud_bill Service Account to Access Data

- [ ] [Create a service account key](console.cloud.google.com/apis/credentials/serviceaccountkey), with the role of Project > Owner and choose the JSON key type.
- [ ] After clicking create, a JSON file will be downloaded to your computer. Open it to view its contents.
- [ ] Inside Slack, run `/nc secret_create`. This command lets you enter secrets into a secure web user interface and adds them to your app. [Find out more about secret creation.](https://nimbella.com/resources-commander/guide#secrets)<img align="right" width=440 height=70 src="https://github.com/SambaDialloB/hosted-images-on-github/blob/master/secret_creation_gcloud.png">
- [ ] Split up the service account key, putting the "private_key" value in a separate secret. Replace that value with an empty string in the JSON. Put the rest of the JSON into a secret. Additionally, create a secret with your dataset and table name.
- [ ] Run the `gcloudbill` command using `/<your_app_name> gcloudbill` and after a few seconds on initial spin up, you'll receive your current bill information!
