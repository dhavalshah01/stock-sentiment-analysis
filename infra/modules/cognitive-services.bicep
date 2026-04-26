// Azure AI Language (Text Analytics) module for Stock Sentiment Analysis

@description('Base name for the resource')
param appName string

@description('Deployment environment')
@allowed(['dev', 'staging', 'prod'])
param environmentName string

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Tags to apply to all resources')
param tags object = {}

var skuName = environmentName == 'prod' ? 'S' : 'F0'
var resourceName = '${appName}-${environmentName}-lang'

resource textAnalytics 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: resourceName
  location: location
  kind: 'TextAnalytics'
  tags: tags
  sku: {
    name: skuName
  }
  properties: {
    customSubDomainName: resourceName
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

@description('The endpoint URL of the Text Analytics resource')
output endpoint string = textAnalytics.properties.endpoint

@description('The name of the Text Analytics resource')
output name string = textAnalytics.name

@description('The resource ID of the Text Analytics resource')
output id string = textAnalytics.id

@description('The primary access key for the Text Analytics resource')
output primaryKey string = textAnalytics.listKeys().key1
