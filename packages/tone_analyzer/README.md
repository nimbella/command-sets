## Tone Analyzer

Analyze tone of a text right from your Slack workspace using Nimbella Commander and IBM Watson Tone Analyzer.

## Requirements

First, create a **Tone Analyzer** resource. After the resource is created, head over to **Service credentials** page of the resource and click on **View credentials** and copy everything including the curly braces.

This is how the values might look:
```json
{
  "apikey": "...",
  "iam_apikey_description": "...",
  "iam_apikey_name": "...",
  "iam_role_crn": "...",
  "iam_serviceid_crn": "...",
  "url": "..."
}
```

Head over to the Secret Creator (type `/nc secret_create` in your workspace to get the link) and fill in the *Name* field with `ibmToneAnalyzerCredentials` and paste the copied values in the corresponding *Value* field. Press **Make Secrets** button and follow the instructions.

## Usage

```sh
/nc tone "How are you doing?"
```

To analyze customer tone:
```sh
/nc tone_cs "Please fix the issue!"
```
