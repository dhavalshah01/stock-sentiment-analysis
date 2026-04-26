// App Service module for Stock Sentiment Analysis

@description('Base name for the resource')
param appName string

@description('Deployment environment')
@allowed(['dev', 'staging', 'prod'])
param environmentName string

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Tags to apply to all resources')
param tags object = {}

@description('Azure AI Language (Text Analytics) endpoint URL')
param textAnalyticsEndpoint string

@description('Key Vault URI for secret references')
param keyVaultUri string

var skuName = environmentName == 'prod' ? 'P1v3' : (environmentName == 'dev' ? 'B1' : 'F1')
var skuTier = environmentName == 'prod' ? 'PremiumV3' : (environmentName == 'dev' ? 'Basic' : 'Free')

var planName = '${appName}-${environmentName}-plan'
var webAppName = '${appName}-${environmentName}-app'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    reserved: true // Required for Linux
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  tags: tags
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appSettings: [
        {
          name: 'AZURE_TEXT_ANALYTICS_ENDPOINT'
          value: textAnalyticsEndpoint
        }
        {
          name: 'KEY_VAULT_URI'
          value: keyVaultUri
        }
        {
          name: 'NODE_ENV'
          value: environmentName == 'prod' ? 'production' : 'development'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
      ]
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      alwaysOn: skuName != 'F1' // Free tier does not support Always On
    }
  }
}

@description('The default hostname of the Web App')
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'

@description('The name of the Web App resource')
output name string = webApp.name

@description('The resource ID of the Web App')
output id string = webApp.id

@description('The principal ID of the Web App system-assigned managed identity')
output principalId string = webApp.identity.principalId

@description('The tenant ID of the Web App managed identity')
output tenantId string = webApp.identity.tenantId
