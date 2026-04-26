# Stock Sentiment Analysis - Demo Plan

## Overview

| # | Title | Duration | Level | WOW Moment |
|---|-------|----------|-------|------------|
| 1 | Infrastructure Deployment and Architecture | 12 min | L300 | One-command deployment of secure Azure infrastructure via Bicep |
| 2 | Live Stock Sentiment Analysis | 15 min | L300 | Real-time sentiment visualization from live X.com posts with AI-powered analysis |
| 3 | Azure AI Language Deep Dive and API Exploration | 12 min | L300 | Batched sentiment analysis showing confidence scores and aggregation logic |

## Target Audience
Technical decision makers and developers evaluating Azure AI services for social media analytics workloads.

## Demo Infrastructure Requirements
- Azure subscription with Contributor access
- Azure AI Language resource (F0 or S tier)
- Azure App Service (B1 or higher)
- Azure Key Vault (Standard)
- X.com Developer account with Bearer Token (for live demos)

## Demo Data Requirements
- Pre-selected stock tickers: $MSFT, $AAPL, $TSLA (high volume, reliable results)
- Fallback: mock tweet data for offline demos (provided in seed script)

## Environment Setup Checklist
- [ ] Azure CLI installed and logged in
- [ ] Node.js 18+ installed
- [ ] X.com Bearer Token available
- [ ] Azure Text Analytics resource provisioned
- [ ] Environment variables configured (.env file for local, Key Vault for Azure)

## Demo 1: Infrastructure Deployment and Architecture
**Goal**: Show how Bicep modules create a secure, production-grade Azure environment in minutes.
**Key Azure Services**: App Service, AI Language, Key Vault, Managed Identity, RBAC
**WOW Moment**: Single `az deployment group create` command provisions everything with proper security.
**Prerequisites**: Azure CLI, Contributor role on subscription
**Companion**: demo-1-infra-deploy.sh

## Demo 2: Live Stock Sentiment Analysis
**Goal**: Show the end-to-end user experience - enter a ticker, see real-time sentiment from X.com posts.
**Key Azure Services**: Azure AI Language (Text Analytics), App Service
**WOW Moment**: Live posts analyzed in seconds with sentiment visualization and confidence scores.
**Prerequisites**: Deployed app, X.com Bearer Token, browser
**Companion**: demo-2-live-analysis.sh

## Demo 3: Azure AI Language Deep Dive and API Exploration
**Goal**: Show the technical details - API batching, per-document error handling, aggregation logic, caching.
**Key Azure Services**: Azure AI Language (Text Analytics)
**WOW Moment**: Show how 50 tweets are analyzed in 5 batches of 10, with detailed confidence scores driving the bullish/bearish/neutral determination.
**Prerequisites**: Deployed app (local or Azure), curl or Postman
**Companion**: demo-3-api-deep-dive.sh
