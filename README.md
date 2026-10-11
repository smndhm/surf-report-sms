# surf-report-sms

Get SMS notifications when good surf conditions are coming 🤙📱

## Setup

The script runs on GitHub Actions. There is nothing to install. The setup is in two parts: one workflow per cron in `.github/workflows`, which says when it runs and which spots it reads, and the Free Mobile credentials, which are secrets.

### Define each cron in its own workflow

A cron is one file in `.github/workflows`, named after it, holding everything about it: when it runs, which spots it reads, and from how many stars it sends an SMS.

```yaml
name: Cron surf-report

on:
  schedule:
    - cron: '37 5,8,10,15,20 * * *'
  workflow_dispatch:

concurrency:
  group: surf-report
  cancel-in-progress: false

jobs:
  run:
    uses: ./.github/workflows/crons.yml
    with:
      cron: surf-report
      arguments: |
        {
          "spots": [
            "https://www.surf-report.com/meteo-surf/kerhilio-s1168.html",
            "https://www.surf-report.com/meteo-surf/another-spot-s0000.html"
          ],
          "minStars": 2
        }
    secrets: inherit
```

- `cron` names it in the logs.
- `spots` is an array of the https://www.surf-report.com pages you want to get notified from. Adding a beach means adding its URL to the array: each spot with a good enough session gets its own SMS.
- `minStars` is the minimum of stars you want to get notified for, from 0 to 5.
- `schedule` is when it runs, as a cron expression in UTC, see https://crontab.guru/.

`crons.yml` holds the steps every cron shares and never runs on its own. One cron is enough for any number of spots. Another one is only worth it for spots that need a different schedule or minimum of stars: it means adding one such file, and nothing else. Each one then has its own name in the Actions tab, its own green or red history, and its own button to run it by hand.

Everything is validated before the browser starts: a missing or malformed field fails the run immediately.

### Put the credentials in secrets

For [Free Mobile](http://mobile.free.fr/) customers, the `user` and `pass` of the SMS API are available in the account once the "Notifications par SMS" option is activated.

They are repository secrets, `FREE_MOBILE_USER` and `FREE_MOBILE_PASS`, added under `Settings` > `Secrets and variables` > `Actions` > `New repository secret`. A missing one fails the run, naming the secret and never its value.

## Running

The workflows run on their own once the secrets are set. `Run workflow` on the Actions tab runs a cron by hand, outside of its schedule.

`pnpm cron:once` is the command they run. It reads the cron from `CRON_NAME` and `CRON_ARGUMENTS`, and the credentials from `FREE_MOBILE_USER` and `FREE_MOBILE_PASS`:

```sh
CRON_NAME=surf-report \
CRON_ARGUMENTS='{"spots":["https://www.surf-report.com/meteo-surf/kerhilio-s1168.html"],"minStars":2}' \
FREE_MOBILE_USER=12345678 FREE_MOBILE_PASS=... \
pnpm cron:once
```

The other scripts are `pnpm test` and `pnpm lint`, which the `Tests` workflow runs on every push and pull request.

Each run also writes a summary on its page in the Actions tab, above the log:

```
## surf-report

- SMS sent for Météo surf Kerhilio - Météo Kerhilio et prévisions surf: 3 hours over 2 days
- SMS sent for Météo surf Another Spot - Météo Another Spot et prévisions surf: 1 hour over 1 day
```

### Good to know

- GitHub evaluates the workflow schedules in UTC and does not know about daylight saving, so the SMS come an hour earlier in winter than in summer.
- GitHub's scheduler is best effort: a run can be delayed under load, the start of every hour is its high load window, and a queued run may be dropped outright. The crons sit in the second half of the hour for that reason.
- A scheduled workflow is automatically disabled after 60 days without activity in the repository.
- Each run sends one SMS per spot with a session of `minStars` or more, and nothing otherwise, so the same session can be announced by several runs.
- The job turns red when an SMS cannot be sent, so wrong credentials do not fail silently day after day.
