# surf-report-sms

Get SMS notifications when good surf conditions are comming 🤙📱

## Install

### Clone the repo and install dependancies

`git clone git@github.com:smndhm/surf-report-sms.git && cd surf-report-sms && npm ci`

### Configure `conf.json`

#### Free Mobile SMS API

For [Free Mobile](http://mobile.free.fr/) customers, `user` and `pass` will be available after activated the option in account.

#### Surf Report

- `spots` is an array of the URLs you want to get notified from https://www.surf-report.com.
- `minStars` is the minimum of stars you want to get notified for.

#### Cron

- `refreshInterval` is the cron schedule expression, see: https://crontab.guru/.

## Run

`pnpm run start`
