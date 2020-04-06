## Traducir

Translate text right from your Slack workspace using Nimbella Commander & IBM Watson Langauge Translator.

> Traducir means 'translate' in Spanish.

## Requirements

First, create a **Language Translator** resource. After the resource is created, head over to **Service credentials** page of the resource and click on **View credentials** and copy everything including the curly braces.

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

Head over to the Secret Creator (type `/nc secret_create` in your workspace to get the link) and fill in the *Name* field with `ibmLanguageTranslatorCredentials` and paste the copied values in the corresponding *Value* field. Press **Make Secrets** button and follow the instructions.

## Usage

```sh
/nc traducir <text> <targetLanguage>
```

You need to use language code instead of language name for `targetLanguage`.

Example:
```sh
/nc traducir "Hello, Developers!" es # es -> Spanish
```

Refer [this](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) page for language codes.