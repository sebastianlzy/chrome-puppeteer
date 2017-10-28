## Motivation
Webscraping with puppeteer on ****

## Install
```
yarn install
```

## Update Config

1. Update configuration file with desired content

## Actions Taken

1. Login with username/password
2. Navigate to list sites
3. Capture all required nodes
4. Parse nodes to retrieve the required href links
5. Loop through the links and proceed to capture the redirect state that happens in the next 10s
6. Every successful captures will be write into output/result.json
6. Continue until we are done

## Run
```
yarn start
```