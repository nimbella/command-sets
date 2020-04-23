# Get live Coronavirus stats in Slack/Mattermost with Nimbella Commander

Coronaviruses (CoV) are a large family of viruses that cause illness ranging from the common cold to more severe diseases such as Middle East Respiratory Syndrome (MERS-CoV) and Severe Acute Respiratory Syndrome (SARS-CoV). A novel coronavirus (nCoV) is a new strain that has not been previously identified in humans.

Available commands:
- `corona_stats`     -- Live stats for the pandemic, worldwide or in a specific country

# Install

`/nc csm_install corona_stats`

# Run

`/nc corona_stats -h`             -- to get info about command format.

`/nc corona_stats`                -- to get worldwide stats.

`/nc corona_stats <Country Name | Abbreviation>`  -- to get stats for a specific country.

`/nc corona_stats <Country Name | Abbreviation > -r <State Name | Abbreviation>`  -- to get stats for a specific state.

`/nc corona_stats <Country Name | Abbreviation > -r <District Name>`  -- to get stats for a specific district.

[Read our blog on corona stats in Slack to learn more](https://nimbella.com/blog/get-live-coronavirus-stats-in-slack-with-nimbella-commander/)
