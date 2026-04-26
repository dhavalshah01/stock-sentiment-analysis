# Stock Sentiment Analysis - Live Demo Guide

**Format**: Code-driven walkthrough (clone, build, run, showcase)
**Duration**: ~35-40 minutes
**Level**: L300 (Technical)
**Audience**: Developers, architects, technical decision makers

---

## Pre-Demo Setup

Complete these steps BEFORE the audience arrives:

### 1. Azure Prerequisites
- Azure subscription with Contributor access
- Azure CLI installed and logged in: `az login`
- Verify: `az account show --query name -o tsv`

### 2. X.com API Access
- **Note:** As of early 2025, X.com free-tier API credits are no longer available. New developer accounts receive zero credits, and existing free-tier allocations have been exhausted.
- For this demo we use **mock data mode** (`USE_MOCK_DATA=true` in `.env`), which supplies realistic sample tweets. Azure Text Analytics still processes them for real sentiment scoring — only the tweet source is simulated.
- If you have a paid X Developer account with active credits, set `USE_MOCK_DATA=false` and provide your Bearer Token to use live data.

### 3. Tools Ready
- VS Code open (with the project NOT yet cloned - we do that live)
- Terminal/command prompt open
- Browser open (Chrome or Edge recommended for dev tools)
- Azure Portal open in a separate tab (portal.azure.com)
- Node.js 18+ installed: `node --version`

### 4. Screen Layout
- Left half: VS Code / Terminal
- Right half: Browser (for app UI and Azure Portal)
- Font size: 16px+ in terminal and VS Code (audience readability)

---

## Part 1: Project Introduction and Clone (5 min)

### [0:00] Opening

**PRESENTER SAYS:**
"Today I'm going to build and run a stock sentiment analyzer from scratch - right here, live. This application pulls real-time posts from X.com about any stock ticker, runs them through Azure AI Language for sentiment analysis, and tells you whether social media is bullish, bearish, or neutral on that stock. Everything runs on Azure, and I'll walk you through the code, the infrastructure, and the live results."

### [1:00] Clone the Repository

**ACTION:** Open terminal.

```bash
cd ~/demos
git clone https://github.com/your-org/stock-sentiment-analysis.git
cd stock-sentiment-analysis
```

**PRESENTER SAYS:**
"Let me clone the repo. This is the same project any developer on your team would start with."

### [1:30] Explore Project Structure

**ACTION:** Open the project in VS Code.

```bash
code .
```

**ACTION:** Show the file explorer in VS Code. Expand the directory tree.

**PRESENTER SAYS:**
"Let's look at how this project is organized. We have a clean separation of concerns:

- `infra/` contains all our Azure infrastructure as Bicep modules - App Service, Azure AI Language, and Key Vault
- `src/` is our Node.js Express application with separate service modules for Twitter integration, sentiment analysis, and aggregation
- `scripts/` has our deployment automation
- `tests/` has unit and smoke tests

This is a pattern I recommend for any Azure AI project - infrastructure as code right next to the application code, so everything deploys together."

> **INSIGHT: Why Bicep over ARM templates?**
> Bicep is Azure's domain-specific language for infrastructure. It compiles down to ARM JSON but is dramatically more readable. The modules in this project (`cognitive-services.bicep`, `app-service.bicep`, `key-vault.bicep`) each own one resource, making the infrastructure composable and testable. You can validate with `az bicep build` before deploying anything.

### [3:00] Review the Architecture

**ACTION:** Open `infra/main.bicep` in VS Code.

**PRESENTER SAYS:**
"This is our infrastructure orchestrator. Three modules deployed in a specific order:

First, Azure AI Language - that's our cognitive services resource for text analytics.
Second, App Service - our web application host with a system-assigned managed identity.
Third, Key Vault - stores our secrets and grants the App Service identity read access via RBAC.

Notice this line here - `var keyVaultUri` - we compute the Key Vault URI deterministically before Key Vault even exists. That lets us configure App Service with the Key Vault URI in the same deployment. Azure Resource Manager handles the dependency ordering automatically."

**ACTION:** Point to line 42 (`var keyVaultUri`) and trace the module dependency chain - `cognitiveServices` outputs feed into `appService`, and `appService.outputs.principalId` feeds into `keyVault`.

**PRESENTER SAYS:**
"And look at the security posture - the `@secure()` decorator on the Twitter bearer token parameter means it's never logged or displayed in deployment outputs. The Text Analytics key flows from the Cognitive Services module output directly into Key Vault as a secret via `cognitiveServices.outputs.primaryKey`. At no point does a human need to copy-paste API keys."

> **INSIGHT: Zero-secret application configuration**
> The App Service's app settings contain ONLY non-secret values: the Text Analytics endpoint URL, the Key Vault URI, and NODE_ENV. The actual API keys live in Key Vault and are fetched at runtime using the managed identity. If someone dumps the app settings, they get nothing sensitive.

---

## Part 2: Infrastructure Deployment (8 min)

### [5:00] Review the Deploy Script

**ACTION:** Open `scripts/deploy.sh` in VS Code. Scroll through briefly.

**PRESENTER SAYS:**
"Rather than running raw Azure CLI commands, we have a deploy script that handles everything: prerequisite checks, resource group creation, Bicep deployment, app packaging, and a smoke test. It's idempotent - safe to run multiple times. It supports `--infra-only`, `--app-only`, and full end-to-end deployment with a single command. Let me deploy our dev environment."

### [6:00] Deploy Azure Infrastructure

**ACTION:** Switch to terminal.

```bash
./scripts/deploy.sh --resource-group rg-stocksentiment-demo --environment dev --infra-only
```

**PRESENTER SAYS:**
"I'm deploying with `--infra-only` so we can run the app locally first and inspect everything. The dev environment uses smaller SKUs - B1 App Service plan and F0 free-tier Text Analytics - perfect for development and demos. For production, the prod parameter file switches to P1v3 App Service and S-tier AI Language."

**PRESENTER SAYS (while deployment runs, ~2-4 minutes):**
"While Azure provisions our resources, let me show you what's being created. Let me flip to the Azure Portal."

**ACTION:** Switch to Azure Portal. Navigate to the resource group `rg-stocksentiment-demo`. Show the deployment in progress.

**PRESENTER SAYS:**
"You can see the deployment is creating three resources with consistent naming - `stocksentiment-dev-lang` for the AI Language resource, `stocksentiment-dev-app` for the web app, and `stocksentiment-dev-kv` for Key Vault. This naming convention is defined in each Bicep module using the pattern `${appName}-${environmentName}-<suffix>`, making it predictable across environments."

### [8:00] Verify Deployment Outputs

**ACTION:** When deployment completes, show the outputs in terminal.

**PRESENTER SAYS:**
"Deployment is done. We get three outputs: the web app URL, the Text Analytics endpoint, and the Key Vault URI. These are the connection points for our application."

**ACTION:** In Azure Portal, navigate to:
1. **Key Vault** → Access control (IAM) → Role assignments → Show the App Service managed identity has the **Key Vault Secrets User** role
2. **App Service** → Identity → Show system-assigned managed identity is **On**
3. **App Service** → Environment variables → Show app settings (no secrets visible - only `AZURE_TEXT_ANALYTICS_ENDPOINT`, `KEY_VAULT_URI`, `NODE_ENV`)

**PRESENTER SAYS:**
"Let me verify the security setup in the portal. Here in Key Vault's IAM, you can see the App Service's managed identity has the Key Vault Secrets User role - that's the minimum privilege needed to read secrets. Over in App Service, the identity is enabled, and in the configuration you'll see only non-secret values. The Twitter bearer token and the Text Analytics key are safely in Key Vault."

> **INSIGHT: Managed Identity eliminates credential rotation headaches**
> With managed identity, there are no passwords or connection strings to rotate. Azure handles the identity lifecycle automatically. When the App Service is deleted, the identity and its access are revoked immediately. This is the recommended pattern for all Azure service-to-service authentication.

---

## Part 3: Application Setup and Local Run (7 min)

### [13:00] Set Up Environment Variables

**ACTION:** Switch to VS Code. Open `src/.env.example`.

**PRESENTER SAYS:**
"For local development, we use a `.env` file. The app loads it automatically using the `dotenv` package. Let me set this up."

**ACTION:** In terminal, from the project root:

```bash
cd src
cp .env.example .env
```

**ACTION:** Open `src/.env` in VS Code and fill in the values:

```
AZURE_TEXT_ANALYTICS_ENDPOINT=https://stocksentiment-dev-lang.cognitiveservices.azure.com/
AZURE_TEXT_ANALYTICS_KEY=<paste from Azure Portal → AI Language resource → Keys and Endpoint>
TWITTER_BEARER_TOKEN=<your bearer token, or leave as placeholder in mock mode>
PORT=3000
NODE_ENV=development
USE_MOCK_DATA=true
```

**PRESENTER SAYS:**
"Notice `USE_MOCK_DATA=true` at the bottom. X.com's free API tier no longer provides credits, so we're using realistic sample tweets for this demo. The important thing is that Azure Text Analytics still processes every tweet for real — the AI sentiment scoring is 100% live. Only the tweet source is simulated. If you have a paid X API plan, just flip this to `false` and supply your Bearer Token."

**PRESENTER SAYS:**
"For local development, we connect directly with the API key. On Azure, the deployed app would use Key Vault with managed identity instead - no keys in configuration at all. The code handles both scenarios automatically through a dual-mode secret retrieval pattern."

**ACTION:** Open `src/services/keyvault.js` in VS Code. Highlight the `getSecret` function (lines 48-77).

**PRESENTER SAYS:**
"Here's how that works. The `getSecret` function has a three-step lookup: first it checks an in-memory cache, then it tries Key Vault using `DefaultAzureCredential`, and finally it falls back to environment variables. When `KEY_VAULT_URI` is configured - like on Azure - it creates a `SecretClient` with managed identity credentials. When it's not set - like on my machine right now - it skips Key Vault entirely and reads from `.env`. Same code, two modes. Cloud-native on Azure, developer-friendly locally."

> **INSIGHT: The dual-mode secret pattern**
> This is a best practice for Azure applications: use Key Vault + managed identity in production, but fall back to environment variables locally. The `@azure/identity` SDK's `DefaultAzureCredential` automatically works with managed identity on Azure, Azure CLI credentials during development, and service principals in CI/CD. One credential class, three deployment scenarios.

### [15:00] Install Dependencies

**ACTION:** In terminal (still in the `src` directory):

```bash
npm install
```

**PRESENTER SAYS:**
"Standard npm install. Our dependencies are lean - the Azure AI Text Analytics SDK for sentiment analysis, the Azure Identity SDK for managed identity, the Azure Key Vault Secrets SDK, Express for the web server, Helmet for security headers, `node-cache` for in-memory caching, and `express-rate-limit` for API protection. Chart.js loads from CDN on the frontend. All Microsoft SDKs, all actively maintained."

### [16:00] Start the Application

**ACTION:** In terminal:

```bash
npm start
```

Expected output:
```
Stock Sentiment Analyzer running on http://localhost:3000 [development]
```

**PRESENTER SAYS:**
"The app is running. Notice it validates configuration at startup - if `AZURE_TEXT_ANALYTICS_ENDPOINT` was missing, it would fail immediately with a clear error message rather than failing silently later. Let's open it in the browser."

**ACTION:** Open http://localhost:3000 in the browser.

**PRESENTER SAYS:**
"Here's our application - a clean dark-themed interface with a single purpose: enter a stock ticker and get a sentiment reading. Let me show you what's behind this UI before we run an analysis."

### [17:00] Quick Code Tour

**ACTION:** In VS Code, open `src/routes/api.js`.

**PRESENTER SAYS:**
"This is the core API route - `POST /api/analyze`. When a ticker comes in, it goes through four stages.

First, input validation. The ticker must match this regex - one to ten letters, optionally prefixed with a dollar sign. Invalid input gets a 400 response immediately.

Second, normalization. Whatever the user types - lowercase `msft`, uppercase `MSFT`, or `$msft` - gets normalized to `$MSFT`. This ensures consistent cache keys.

Third, we check the cache. Results are stored in `node-cache` with a 300-second TTL - that's five minutes. If we have a fresh result, we return it immediately with a `cached: true` flag.

Fourth, the actual pipeline: fetch tweets, analyze sentiment, aggregate results. Three service modules, one clean flow."

**ACTION:** Open `src/services/sentiment.js`. Highlight the `chunk` function (lines 44-50) and the batch loop (lines 70-107).

**PRESENTER SAYS:**
"The sentiment service is where Azure AI Language comes in. See this `chunk` function? It splits the array of tweet texts into batches of 10. That's the Azure Text Analytics per-request document limit. So 50 tweets become 5 API calls processed in a loop. Each batch sends documents with explicit language hints set to English, which avoids the overhead of automatic language detection."

> **INSIGHT: Azure AI Language batching and pricing**
> Text Analytics charges per text record - the free tier gives you 5,000 records per month, and the standard tier is $1 per 1,000 records. Batching 10 documents per call doesn't save on per-record cost, but it massively reduces latency: 5 HTTP round trips instead of 50. For a user waiting on results, that's the difference between 2 seconds and 10+ seconds.

**ACTION:** Open `src/services/aggregator.js`. Highlight lines 61-66.

**PRESENTER SAYS:**
"The aggregator turns individual sentiment scores into one verdict: Bullish, Bearish, or Neutral. The logic is here - if the average positive confidence exceeds the average negative by more than 0.10 - that's ten percentage points - we call it Bullish. The reverse for Bearish. Within that 10-point band, it's Neutral. This threshold prevents us from making a strong call when sentiment is genuinely mixed."

---

## Part 4: Live Sentiment Analysis Showcase (12 min)

### [20:00] First Analysis - Microsoft ($MSFT)

**PRESENTER SAYS:**
"Alright, let's see it in action. I'll start with a company we all know."

**ACTION:** In the browser, type `MSFT` in the ticker input and click **Analyze**.

**PRESENTER SAYS (while the loading spinner shows):**
"Right now the backend is loading sample posts from our mock data module — these are realistic stock-related tweets with a mix of bullish, bearish, and neutral opinions. Each post then goes to Azure AI Language in batches of 10 for real sentiment scoring. In a live production scenario with a paid X.com API plan, these would be actual real-time posts from X.com."

**ACTION:** When results appear, walk through each section of the UI top to bottom:

**PRESENTER SAYS:**
"Here we go. The overall sentiment is [read the result - Bullish/Bearish/Neutral] with the green, red, or grey indicator. We analyzed [N] posts.

Look at the summary card - you can see the average confidence scores broken out. [X]% positive, [Y]% neutral, [Z]% negative. These three always sum to approximately 100%.

The pie chart gives you the distribution at a glance - how many individual posts were classified as positive, negative, neutral, or mixed. Mixed means the model found significant signal in multiple directions within the same post.

Now scroll down to the individual posts. Each one has its own sentiment badge and three confidence bars showing exactly how certain the model is. See this post here - [read a specific post text] - Azure AI scored it as [sentiment] with [X]% confidence. The bars make it visual - you can immediately tell which posts the model is certain about and which ones are borderline."

> **INSIGHT: Confidence scores tell you more than the label**
> The three confidence scores (positive, neutral, negative) always sum to approximately 1.0. A post scored as "positive" with 92% confidence is a much stronger signal than one scored "positive" with 55% confidence. The UI renders these as proportional bars so the audience can gauge certainty at a glance. In production, you might filter out low-confidence results to improve signal quality.

### [23:00] Comparison - Tesla ($TSLA)

**PRESENTER SAYS:**
"Now let's try a more polarizing stock. Tesla always generates strong opinions on social media."

**ACTION:** Type `TSLA` and click **Analyze**.

**PRESENTER SAYS:**
"Notice the difference. Tesla's sentiment distribution is typically more spread out than Microsoft's. You often see stronger opinions in both directions - passionate positive posts about innovation and growth right alongside strongly negative posts about valuation or controversy. The pie chart shows this polarization clearly - compare the green and red slices to what we saw with Microsoft."

**ACTION:** Compare the two results visually. Point out:
- Different overall sentiment verdict
- Different pie chart distributions (more balanced for TSLA vs skewed for MSFT)
- Posts with stronger language having higher confidence scores
- Any "mixed" sentiment posts that show genuine ambiguity

**PRESENTER SAYS:**
"This comparison is exactly what makes this tool valuable for market research. You're not just getting a single number - you're getting a distribution that shows HOW people feel and how STRONGLY they feel about it. A stock with 60% positive and 30% negative tells a very different story than one with 60% positive and 30% neutral."

### [26:00] Third Ticker - Apple ($AAPL)

**PRESENTER SAYS:**
"One more - let's try Apple for a third data point."

**ACTION:** Type `AAPL` and click **Analyze**.

**PRESENTER SAYS:**
"[Comment on the results compared to the other two.] You can start to see patterns emerge. Larger, more established companies like Microsoft and Apple tend to cluster around mildly positive or neutral sentiment, while more polarizing stocks like Tesla show wider distributions with more extreme opinions on both sides. That pattern itself is a useful signal."

### [28:00] Behind the Scenes - Network Tab

**PRESENTER SAYS:**
"Let me show you what's happening under the hood from the browser's perspective."

**ACTION:** Open browser Developer Tools (F12). Switch to the **Network** tab. Click **Clear** to start fresh.

**ACTION:** Type `GOOGL` in the ticker input and click **Analyze**.

**PRESENTER SAYS:**
"Watch the network tab - one single POST request to `/api/analyze`. Let me click on it."

**ACTION:** Click on the request in the Network tab. Show the **Payload** tab, then the **Response** tab.

**PRESENTER SAYS:**
"The request payload is minimal - just `{ \"ticker\": \"GOOGL\" }`. The response contains everything: the normalized ticker with the dollar sign, an array of post objects each with their original text, timestamp, author ID, engagement metrics, individual sentiment label, and the three confidence scores. Then at the bottom, the aggregated summary with counts per category, average scores, the overall Bullish/Bearish/Neutral verdict, and the total analyzed count.

Check the response time in the Network tab - [X] milliseconds. That includes the X.com API call to fetch 50 posts, 5 batched calls to Azure AI Language for sentiment analysis, aggregation logic, and JSON serialization. The Azure Text Analytics SDK handles connection pooling and automatic retries under the hood."

### [30:00] Caching in Action

**PRESENTER SAYS:**
"Now watch this. I'll analyze GOOGL again without changing anything."

**ACTION:** Click **Analyze** again for the same ticker. Note the much faster response time in the Network tab.

**PRESENTER SAYS:**
"Almost instant - look at the response time, just a few milliseconds. And if you check the response JSON, there's a `cached: true` flag. The `node-cache` module stored the previous result with a 5-minute TTL. This is critical for two reasons: the X.com API has strict rate limits - 450 requests per 15-minute window on the basic tier - and Azure AI Language costs money per text record. Caching is a simple but effective cost control mechanism."

> **INSIGHT: Cost management in AI applications**
> Every call to Azure AI Language costs money. At the standard tier, 100 users each analyzing one ticker (50 tweets each) would be 5,000 text records - roughly $5. Without caching, 100 users all searching $TSLA within 5 minutes would cost $5 every wave. With the 5-minute cache TTL, the first user triggers the real analysis and the remaining 99 get instant cached results for free. The `CACHE_TTL` environment variable makes this tunable per environment.

### [31:00] Input Validation

**PRESENTER SAYS:**
"What happens if someone enters garbage? Let's find out."

**ACTION:** Try these inputs in the UI one at a time:
1. Type `123` and click Analyze - show the client-side validation error: "Please enter a valid ticker symbol (1-10 letters, e.g. AAPL)."
2. Clear the input, type `A@B!C` and click Analyze - show the same validation error
3. Clear the input, type `msft` (lowercase) and click Analyze - show it works and results display with `$MSFT`

**PRESENTER SAYS:**
"The validation works on both sides. The frontend uses a regex that only allows 1-10 letters - no numbers, no special characters. The backend has its own regex check as a second line of defense. But lowercase input? That's perfectly fine - the `normalizeTicker` function uppercases it and adds the dollar sign prefix. So `msft` becomes `$MSFT`. Validate early, normalize consistently, fail gracefully - that's defensive programming."

---

## Part 5: Architecture Recap and Closing (3 min)

### [32:00] What We Covered

**ACTION:** Switch back to VS Code. Show the file explorer with the full project tree visible.

**PRESENTER SAYS:**
"Let me recap what we built and demonstrated today.

We started from a GitHub repo - cloned it, explored the structure, and understood the architecture before writing a single command.

We deployed Azure infrastructure with Bicep - three modules composing an App Service, Azure AI Language, and Key Vault, all wired together with managed identity and RBAC role assignments. Zero passwords anywhere in the configuration.

We set up a local development environment with a simple `.env` file and the dual-mode secret pattern - the same application code runs locally against environment variables and on Azure against Key Vault with managed identity.

We ran the application and analyzed real-time social media sentiment for multiple stock tickers. Under the hood, you saw intelligent batching that reduces API round trips from 50 down to 5, confidence scoring that goes well beyond simple positive-negative labels, a caching layer that controls costs and respects rate limits, and input validation at every layer - client, server, and API.

The patterns you've seen here - managed identity, Key Vault, Azure AI Language, Bicep modules, environment-based configuration - these apply to any AI-powered application on Azure. The project ships with three parameter files for dev, staging, and production, so the same infrastructure scales from a free-tier demo to a production workload."

### [34:00] Questions

**PRESENTER SAYS:**
"The entire project is in that GitHub repo - infrastructure, application code, tests, deployment scripts, and documentation. You can clone it, deploy it to your own subscription, and have it running in under 15 minutes.

I'm happy to take questions."

---

## Post-Demo Cleanup

Run the cleanup script to remove all Azure resources provisioned during the demo:

```bash
./demos/cleanup-demo.sh --resource-group rg-stocksentiment-demo
```

Or manually delete the resource group:

```bash
az group delete --name rg-stocksentiment-demo --yes --no-wait
```

> **Note:** Key Vault has soft-delete enabled with 90-day retention and purge protection. To fully purge after the resource group is deleted:
> ```bash
> az keyvault purge --name stocksentiment-dev-kv --location eastus
> ```

Stop the local Node.js server by pressing `Ctrl+C` in the terminal where `npm start` is running.

---

## Troubleshooting Quick Reference

| Issue | Cause | Fix |
|-------|-------|-----|
| `Missing required env var: AZURE_TEXT_ANALYTICS_ENDPOINT` | `.env` file not configured or not in `src/` directory | Copy `.env.example` to `.env` inside the `src/` folder and fill in all values |
| Empty results / "No recent posts found" | X.com Bearer Token invalid, expired, or lacks v2 API access | Enable mock mode (`USE_MOCK_DATA=true`), or regenerate token from the X Developer Portal if on a paid plan |
| `429 Too Many Requests` from X.com | X API rate limit hit (450 requests per 15 min on basic tier) | Wait 15 minutes for the rate window to reset, or rely on cached results |
| `401 Unauthorized` from Text Analytics | Wrong endpoint URL or rotated API key | Verify `AZURE_TEXT_ANALYTICS_ENDPOINT` and `AZURE_TEXT_ANALYTICS_KEY` match the Azure Portal values |
| `Secret "..." not found in Key Vault or env var` | Neither Key Vault nor environment variable has the required secret | For local dev: ensure `.env` has `AZURE_TEXT_ANALYTICS_KEY` and `TWITTER_BEARER_TOKEN`. For Azure: check Key Vault secrets exist |
| Deployment fails with "F0 already exists" | Free-tier Cognitive Services is limited to one F0 per kind per subscription | Delete the existing F0 Text Analytics resource, or use the `S` (standard) tier instead |
| Bicep deployment fails on Key Vault name | Key Vault names must be globally unique and ≤24 characters | Change the `appName` parameter to a shorter or more unique prefix |
| Chart not rendering | Chart.js CDN (`cdn.jsdelivr.net`) blocked by network policy | Check firewall/proxy rules, or download Chart.js and serve it from `src/public/js/` |
| App starts but crashes on first request | Missing `TWITTER_BEARER_TOKEN` and mock mode is off | Either set `USE_MOCK_DATA=true` in `.env`, or add a valid bearer token and restart the server |

---

## Appendix: Key Talking Points

### For Business Audiences
- "Social sentiment analysis gives you a real-time pulse on market perception - what people are actually saying right now, not what they said in last quarter's earnings report"
- "Azure AI Language is a pre-trained model - no ML expertise needed, no training data to curate, no model to maintain. You send text, you get sentiment back"
- "The entire solution deploys in under 10 minutes with infrastructure as code. That's from zero to a running, secured application"

### For Technical Audiences
- "Managed identity eliminates credential management entirely - no secrets to rotate, no connection strings to secure, no service principals to maintain"
- "Bicep modules are composable - adding a new Azure service means adding a new module file and wiring it into `main.bicep`. The existing modules don't change"
- "The batching strategy sends 10 documents per API call instead of 1, cutting latency from 50 round trips to 5 with zero additional complexity"
- "The dual-mode secret pattern in `keyvault.js` lets the same codebase work locally with `.env` files and on Azure with Key Vault, with zero conditional logic at the call site"

### For Security-Focused Audiences
- "Zero secrets in application configuration - App Service settings contain only endpoint URLs and the Key Vault URI. All sensitive credentials live in Key Vault"
- "RBAC with least privilege - the managed identity gets Key Vault Secrets User, not Contributor. It can read secrets but cannot create, delete, or modify them"
- "Defense in depth: HTTPS-only with TLS 1.2 minimum, FTPS disabled, Helmet security headers with a strict Content Security Policy, and `express-rate-limit` capping at 100 requests per 15 minutes"
- "Input validation on both client and server prevents injection attacks - the ticker regex rejects everything except 1-10 alphabetic characters"
