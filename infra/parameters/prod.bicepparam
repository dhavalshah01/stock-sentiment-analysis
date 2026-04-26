using '../main.bicep'

param environmentName = 'prod'
param appName = 'stocksentiment'
param twitterBearerToken = readEnvironmentVariable('TWITTER_BEARER_TOKEN', '')
