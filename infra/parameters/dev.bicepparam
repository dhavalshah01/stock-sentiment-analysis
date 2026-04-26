using '../main.bicep'

param environmentName = 'dev'
param appName = 'stocksentiment'
param twitterBearerToken = readEnvironmentVariable('TWITTER_BEARER_TOKEN', '')
