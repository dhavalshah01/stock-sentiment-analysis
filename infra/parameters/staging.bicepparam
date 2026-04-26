using '../main.bicep'

param environmentName = 'staging'
param appName = 'stocksentiment'
param twitterBearerToken = readEnvironmentVariable('TWITTER_BEARER_TOKEN', '')
