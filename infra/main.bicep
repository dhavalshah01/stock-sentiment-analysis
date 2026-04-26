// Main orchestrator for Stock Sentiment Analysis infrastructure
// Deploys: Azure AI Language, App Service, Key Vault

targetScope = 'resourceGroup'

@description('Deployment environment')
@allowed(['dev', 'staging', 'prod'])
param environmentName string

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Application name prefix used for resource naming')
param appName string = 'stocksentiment'

@secure()
@description('Twitter/X API Bearer Token stored in Key Vault')
param twitterBearerToken string

var tags = {
  project: 'stock-sentiment-analysis'
  environment: environmentName
  managedBy: 'bicep'
}

// --- Azure AI Language (Text Analytics) ---
module cognitiveServices 'modules/cognitive-services.bicep' = {
  name: 'deploy-cognitive-services'
  params: {
    appName: appName
    environmentName: environmentName
    location: location
    tags: tags
  }
}

// --- Key Vault (deployed before App Service needs its URI) ---
// We deploy Key Vault after App Service so we can use the managed identity principal ID.
// However, App Service needs the Key Vault URI at deploy time.
// Solution: compute the Key Vault URI deterministically and pass it to App Service.
var keyVaultName = '${appName}-${environmentName}-kv'
var keyVaultUri = 'https://${keyVaultName}${environment().suffixes.keyvaultDns}/'

// --- App Service ---
module appService 'modules/app-service.bicep' = {
  name: 'deploy-app-service'
  params: {
    appName: appName
    environmentName: environmentName
    location: location
    tags: tags
    textAnalyticsEndpoint: cognitiveServices.outputs.endpoint
    keyVaultUri: keyVaultUri
  }
}

// --- Key Vault ---
module keyVault 'modules/key-vault.bicep' = {
  name: 'deploy-key-vault'
  params: {
    appName: appName
    environmentName: environmentName
    location: location
    tags: tags
    appServicePrincipalId: appService.outputs.principalId
    twitterBearerToken: twitterBearerToken
    textAnalyticsKey: cognitiveServices.outputs.primaryKey
  }
}

// --- Outputs ---
@description('The URL of the deployed Web App')
output webAppUrl string = appService.outputs.webAppUrl

@description('The Azure AI Language (Text Analytics) endpoint')
output textAnalyticsEndpoint string = cognitiveServices.outputs.endpoint

@description('The Key Vault URI for secret access')
output keyVaultUri string = keyVault.outputs.uri
