// Key Vault module for Stock Sentiment Analysis

@description('Base name for the resource')
param appName string

@description('Deployment environment')
@allowed(['dev', 'staging', 'prod'])
param environmentName string

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Tags to apply to all resources')
param tags object = {}

@description('The principal ID of the App Service managed identity')
param appServicePrincipalId string

@secure()
@description('Twitter/X API Bearer Token for fetching stock-related tweets')
param twitterBearerToken string

@secure()
@description('Primary key for the Azure AI Language (Text Analytics) resource')
param textAnalyticsKey string

// Key Vault names have a 24-char limit and must be globally unique
var vaultName = '${appName}-${environmentName}-kv'

// Built-in role: Key Vault Secrets User (4633458b-17de-408a-b874-0445c86b69e6)
var keyVaultSecretsUserRoleId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '4633458b-17de-408a-b874-0445c86b69e6'
)

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    enabledForDeployment: false
    enabledForTemplateDeployment: false
    enabledForDiskEncryption: false
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Grant the App Service managed identity the Key Vault Secrets User role
resource keyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, appServicePrincipalId, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: keyVaultSecretsUserRoleId
    principalId: appServicePrincipalId
    principalType: 'ServicePrincipal'
  }
}

resource secretTwitterBearerToken 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'twitter-bearer-token'
  tags: tags
  properties: {
    value: twitterBearerToken
    contentType: 'text/plain'
  }
}

resource secretTextAnalyticsKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'text-analytics-key'
  tags: tags
  properties: {
    value: textAnalyticsKey
    contentType: 'text/plain'
  }
}

@description('The URI of the Key Vault')
output uri string = keyVault.properties.vaultUri

@description('The name of the Key Vault resource')
output name string = keyVault.name

@description('The resource ID of the Key Vault')
output id string = keyVault.id
