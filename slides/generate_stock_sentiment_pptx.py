#!/usr/bin/env python3
"""Generate Stock Sentiment Analysis PowerPoint presentation using pptx_utils."""
import os, sys
from pptx.dml.color import RGBColor

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# pptx_utils lives in the skill directory
sys.path.insert(0, r"C:\Users\dhsha\.copilot\installed-plugins\_direct\olivomarco--vbd-copilot\skills\pptx-generator")
from pptx_utils import *

TOTAL = 18

def build():
    prs = create_presentation()

    # ══════════════════════════════════════════════════════════════════
    # Fragment 01 — Opening (slides 1-2)
    # ══════════════════════════════════════════════════════════════════

    # ── Slide 1: Title / Lead ──────────────────────────────────────────
    create_lead_slide(
        prs,
        title="Stock Sentiment Analysis",
        subtitle="Real-Time Social Sentiment from X.com\npowered by Azure AI Language",
        meta="L200 Architecture Overview | April 2026",
        level="L200",
        notes=(
            "Welcome everyone. In this session we explore how to build a stock sentiment "
            "analysis pipeline that ingests live posts from X.com and scores them using "
            "Azure AI Language. We will walk through the end-to-end architecture, examine "
            "the Azure infrastructure defined in Bicep, and see how the application "
            "translates raw social chatter into actionable sentiment signals for traders "
            "and analysts. By the end you will have a clear blueprint you can adapt to "
            "your own market-intelligence scenarios."
        ),
        use_bg_image=True,
    )

    # ── Slide 2: Agenda ──────────────────────────────────────────────
    slide = create_standard_slide(prs, "Agenda", page_num=2, total=TOTAL,
                                  notes=(
                                      "Here is what we will cover today. First, we frame "
                                      "the business challenge of extracting real-time "
                                      "sentiment from noisy social media streams. Then we "
                                      "walk through the solution architecture and the Azure "
                                      "resources that support it. After that we dive into "
                                      "the application code, and we close with a live "
                                      "experience plus concrete next steps you can take "
                                      "back to your own projects."
                                  ))
    add_agenda_list(slide, [
        "The Challenge: Real-Time Social Sentiment",
        "Solution Architecture",
        "Azure Infrastructure (Bicep)",
        "Application Deep Dive",
        "Live Experience and Next Steps",
    ], left=CONTENT_LEFT, top=CONTENT_TOP, width=CONTENT_WIDTH)

    # ══════════════════════════════════════════════════════════════════
    # Fragment 02 — Problem & Architecture (slides 3-6)
    # ══════════════════════════════════════════════════════════════════

    # ── Slide 3 ── Section Divider: The Challenge ─────────────────────
    create_section_divider(
        prs,
        "The Challenge",
        "Understanding real-time social sentiment at scale",
        notes=(
            "This section frames the core problem we are solving. "
            "Retail and institutional investors alike struggle to gauge market mood from social media. "
            "We will examine why manual approaches fail and how Azure AI services close the gap. "
            "By the end of this section you will understand the full data pipeline from X.com posts to an actionable dashboard."
        ),
    )

    # ── Slide 4 ── The Problem ───────────────────────────────────────
    slide4 = create_standard_slide(prs, "Why Social Sentiment Matters for Stocks", 4, TOTAL,
        notes=(
            "Each card highlights a dimension of the sentiment-analysis challenge. "
            "**Volume** is the first barrier — millions of stock-related posts appear on X.com every day, far beyond any analyst's reading capacity. "
            "**Speed** matters because sentiment can flip in minutes around earnings calls or breaking news, while traditional surveys lag by weeks. "
            "**Nuance** is where AI shines: Azure AI Language detects mixed and subtle signals that even experienced readers overlook at scale. "
            "Finally, **Actionable** output turns raw scores into a single Bullish, Bearish, or Neutral verdict investors can act on immediately."
        ),
    )
    add_card_grid(slide4, [
        (MS_BLUE,         "Volume",     "Millions of posts daily about stocks on X.com — **impossible to read manually**"),
        (MS_DARK_BLUE,    "Speed",      "Market sentiment shifts in minutes — **traditional surveys take weeks**"),
        (MS_BLUE_DARKER,  "Nuance",     "AI detects **subtle positive/negative signals** humans miss at scale"),
        (MS_NAVY_LIGHT,   "Actionable", "Aggregate signals into clear **Bullish / Bearish / Neutral** verdicts"),
    ], left=CONTENT_LEFT, top=CONTENT_TOP, cols=2,
       card_w=Inches(4.6), card_h=Inches(2.1), gap_x=Inches(0.4), gap_y=Inches(0.35))

    # ── Slide 5 ── Solution Overview ─────────────────────────────────
    slide5 = create_standard_slide(prs, "Solution Architecture", 5, TOTAL,
        notes=(
            "This slide shows the end-to-end data flow in four discrete stages. "
            "First, the **X.com API v2** recent-search endpoint fetches up to 50 tweets matching the requested stock ticker. "
            "Those tweets are batched into groups of 10 and sent to **Azure AI Language** for sentiment analysis, cutting network overhead by 10×. "
            "The **Aggregation Engine** in our Express back-end tallies positive, negative, and neutral counts and computes a weighted verdict. "
            "Finally, **Chart.js** renders a responsive doughnut chart in the browser so the user sees results in seconds."
        ),
    )
    add_process_flow(slide5,
        steps=["X.com API v2", "Azure AI\nLanguage", "Aggregation\nEngine", "Chart.js\nDashboard"],
        left=CONTENT_LEFT, top=CONTENT_TOP,
        box_w=Inches(2.0), box_h=Inches(0.9), arrow_w=Inches(0.45),
        colors=[MS_BLUE, MS_DARK_BLUE, MS_BLUE_DARKER, MS_NAVY_LIGHT],
        annotations=[(0, "50 tweets"), (1, "5 batches"), (2, "Score & tally"), (3, "Visualize")],
    )
    add_callout_box(slide5,
        "50 tweets analyzed in 5 batched API calls — 10× fewer network round trips than individual requests",
        left=CONTENT_LEFT, top=Inches(4.4),
        width=CONTENT_WIDTH, height=Inches(0.85),
        bg=MS_NAVY_LIGHT, accent=MS_BLUE, font_size=14,
    )

    # ── Slide 6 ── Architecture Stack ────────────────────────────────
    slide6 = create_standard_slide(prs, "Azure Architecture Stack", 6, TOTAL,
        notes=(
            "This layered view shows the four tiers of the application from the user's browser down to secrets management. "
            "The **Browser** tier uses Chart.js to render sentiment results with zero server-side rendering overhead. "
            "**Node.js Express** running on Azure App Service exposes a lightweight REST API that orchestrates calls to the AI service. "
            "**Azure AI Language (Text Analytics)** performs the heavy lifting — each batch call returns per-document positive, negative, and neutral confidence scores. "
            "At the base, **Azure Key Vault** stores the X.com bearer token and AI endpoint key, accessed via **Managed Identity** so no secrets live in code or config files."
        ),
    )
    add_layered_architecture(slide6, [
        ("Browser — Chart.js Dashboard",              MS_BLUE),
        ("Node.js Express API (App Service)",          MS_BLUE_DARKER),
        ("Azure AI Language (Text Analytics)",         MS_DARK_BLUE),
        ("Azure Key Vault + Managed Identity",         MS_NAVY_LIGHT),
    ], left=CONTENT_LEFT, top=CONTENT_TOP,
       width=CONTENT_WIDTH, layer_h=Inches(1.0), gap=Inches(0.18))

    # ══════════════════════════════════════════════════════════════════
    # Fragment 03 — Infrastructure (slides 7-10)
    # ══════════════════════════════════════════════════════════════════

    # ── Slide 7: Section Divider — Azure Infrastructure ─────────────
    create_section_divider(
        prs,
        title="Azure Infrastructure",
        subtitle="Secure, modular, and environment-aware with Bicep",
        notes=(
            "We now shift from the high-level architecture to the actual "
            "infrastructure-as-code that provisions every Azure resource. "
            "The entire stack is defined in modular Bicep templates, which "
            "means every environment is reproducible, auditable, and version-"
            "controlled. We will look at the three core modules, the zero-"
            "secret security model, and the environment strategy that lets "
            "one codebase drive dev, staging, and production."
        ),
    )

    # ── Slide 8: Modular Bicep Architecture ───────────────────────────
    slide = create_standard_slide(
        prs, "Modular Bicep Architecture", page_num=8, total=TOTAL,
        notes=(
            "The infrastructure is split into three Bicep modules that compose "
            "cleanly inside main.bicep. First, cognitive-services.bicep provisions "
            "an Azure AI Language account — the F0 free tier keeps dev and staging "
            "costs at zero, while production uses the S standard tier for higher "
            "throughput and SLA coverage. Second, app-service.bicep creates a "
            "Linux App Service running Node.js 18 LTS with a system-assigned "
            "managed identity — this identity is the linchpin of the security "
            "model we will discuss next. Third, key-vault.bicep stands up a "
            "Key Vault configured for RBAC authorization rather than legacy "
            "access policies, and assigns the Key Vault Secrets User role to "
            "the App Service identity so it can read secrets like the Twitter "
            "bearer token and the Text Analytics key at runtime."
        ),
    )
    add_pillar_cards(slide, [
        (MS_BLUE, "01", "Azure AI Language",
         "**Text Analytics** for sentiment analysis.\n"
         "F0 free tier for dev, S tier for production.\n"
         "Custom subdomain with public access."),
        (MS_BLUE_DARKER, "02", "App Service",
         "**Linux Node.js 18 LTS** hosting.\n"
         "System-assigned **managed identity**.\n"
         "HTTPS-only, TLS 1.2, FTPS disabled."),
        (MS_DARK_BLUE, "03", "Key Vault",
         "**RBAC authorization** with least privilege.\n"
         "Key Vault Secrets User role.\n"
         "Soft-delete + purge protection enabled."),
    ], left=CONTENT_LEFT, top=CONTENT_TOP, height=Inches(3.6), min_gap=Inches(0.25))

    # ── Slide 9: Zero-Secret Application Configuration ────────────────
    slide = create_standard_slide(
        prs, "Zero-Secret Application Configuration", page_num=9, total=TOTAL,
        notes=(
            "This slide captures the zero-trust security posture of the "
            "application. Step one: the App Service is provisioned with a "
            "system-assigned managed identity, eliminating the need to store "
            "passwords or connection strings anywhere. Step two: that identity "
            "receives the Key Vault Secrets User role — a read-only, least-"
            "privilege grant — so it can retrieve secrets but never modify or "
            "delete them. Step three: the application configuration itself "
            "contains only non-sensitive values such as the AI Language endpoint "
            "URL, the Key Vault URI, and the NODE_ENV flag. The actual API keys "
            "and the Twitter bearer token live exclusively in Key Vault, "
            "protected by the @secure() decorator in Bicep so they never "
            "appear in deployment logs or state files. This layered approach "
            "means there is literally no secret in source control, CI/CD "
            "variables, or App Service configuration to leak."
        ),
    )
    add_numbered_items(slide, [
        ("Managed Identity",
         "App Service uses **system-assigned identity** — no passwords "
         "or connection strings to manage or rotate"),
        ("RBAC Least Privilege",
         "Key Vault Secrets User role grants **read-only secret access** — "
         "the minimum permission needed"),
        ("No Secrets in Config",
         "App settings contain only **endpoint URLs** and **Key Vault URI** — "
         "actual keys live in Key Vault"),
    ], left=CONTENT_LEFT, top=CONTENT_TOP, width=CONTENT_WIDTH,
       item_height=Inches(1.2),
       colors=[MS_BLUE, MS_BLUE_DARKER, MS_DARK_BLUE])

    # ── Slide 10: Environment Configuration ───────────────────────────
    slide = create_standard_slide(
        prs, "Environment Configuration", page_num=10, total=TOTAL,
        notes=(
            "All three environments — dev, staging, and production — are "
            "deployed from the same set of Bicep templates. The only thing "
            "that changes is the parameter file: dev.bicepparam, staging."
            "bicepparam, or prod.bicepparam. Dev uses a B1 Basic App Service "
            "plan and the F0 free tier for AI Language, giving developers a "
            "cost-effective sandbox with Always On enabled for faster cold "
            "starts. Staging drops to the F1 free App Service tier with "
            "Always On disabled — it is meant for integration testing, not "
            "sustained load. Production scales up to P1v3 Premium and the "
            "S standard AI Language tier, with Always On enabled and NODE_ENV "
            "set to production to activate Express.js optimizations. This "
            "approach ensures infrastructure parity across environments while "
            "right-sizing cost and performance for each stage of the delivery "
            "pipeline."
        ),
    )
    add_styled_table(slide, [
        ["Setting", "Dev", "Staging", "Prod"],
        ["App Service SKU", "B1 (Basic)", "F1 (Free)", "P1v3 (Premium)"],
        ["AI Language SKU", "F0 (Free)", "F0 (Free)", "S (Standard)"],
        ["Always On", "Yes", "No", "Yes"],
        ["NODE_ENV", "development", "development", "production"],
    ], left=CONTENT_LEFT, top=CONTENT_TOP, width=CONTENT_WIDTH,
       col_widths=[Inches(2.0), Inches(2.2), Inches(2.2), Inches(2.2)],
       header_color=MS_BLUE, font_size=11)
    add_callout_box(
        slide,
        "Same Bicep templates, different parameters.\n"
        "One codebase drives all three environments with appropriate "
        "cost and performance trade-offs.",
        left=CONTENT_LEFT, top=Inches(5.0),
        width=CONTENT_WIDTH, height=Inches(0.9),
    )

    # ══════════════════════════════════════════════════════════════════
    # Fragment 04 — Application Deep Dive (slides 11-14)
    # ══════════════════════════════════════════════════════════════════

    # ── Slide 11: Section Divider – Application Deep Dive ─────────────
    create_section_divider(
        prs,
        title="Application Deep Dive",
        subtitle="From ticker input to sentiment verdict",
        notes=(
            "We now shift from infrastructure to application code. In this section "
            "we trace the full request lifecycle: a user types a stock ticker, the "
            "backend validates it, checks the cache, fetches recent tweets from X, "
            "runs sentiment analysis through Azure AI Language, and aggregates the "
            "results into a Bullish, Bearish, or Neutral verdict. We will look at "
            "the pipeline design, the batching strategy, and the resilience patterns "
            "that keep costs low and uptime high."
        ),
    )

    # ── Slide 12: API Pipeline ──────────────────────────────────────────
    slide = create_standard_slide(
        prs, "The Analysis Pipeline", page_num=12, total=TOTAL,
        notes=(
            "This is the five-stage pipeline behind POST /api/analyze. "
            "Stage one validates the ticker symbol against a strict regex and "
            "normalizes it to uppercase with a dollar-sign prefix. Stage two checks "
            "an in-memory cache keyed by the normalized ticker — if a result exists "
            "and is less than five minutes old, we return it immediately, saving "
            "both X API and Azure AI calls. Stage three uses the X API v2 Recent "
            "Search endpoint to fetch up to 50 recent English-language tweets "
            "mentioning the ticker. Stage four sends those tweets to Azure AI "
            "Language for sentiment analysis, batching them in groups of 10 to "
            "respect the SDK limit and minimize round trips. Stage five applies the "
            "aggregation logic: if the average positive score exceeds the average "
            "negative score by more than 10 percentage points, the verdict is "
            "Bullish; if the reverse is true, Bearish; otherwise Neutral. The "
            "final result is cached and returned to the frontend."
        ),
    )
    add_process_flow(
        slide,
        steps=["Validate\nTicker", "Check\nCache", "Fetch\nTweets",
               "Analyze\nSentiment", "Aggregate\nResults"],
        left=Inches(0.6),
        top=Inches(2.2),
        box_w=Inches(1.6),
        box_h=Inches(1.0),
        arrow_w=Inches(0.3),
        colors=[MS_BLUE, MS_DARK_BLUE, MS_BLUE_DARKER, MS_NAVY_LIGHT, MS_BLUE],
        annotations=[
            (2, "X API v2\nRecent Search"),
            (3, "Azure AI\nBatches of 10"),
            (4, "10% threshold\nrule"),
        ],
    )

    # ── Slide 13: Batching and Aggregation ──────────────────────────────
    slide = create_standard_slide(
        prs, "Smart Batching and Aggregation", page_num=13, total=TOTAL,
        notes=(
            "Two design decisions keep this application efficient and predictable. "
            "On the left, the batching strategy: Azure AI Language accepts up to 10 "
            "documents per API call, so we chunk the tweet array into batches of 10 "
            "before sending. For 50 tweets that means 5 API calls instead of 50, "
            "cutting network overhead by 90 percent. Each document is handled "
            "independently — if one tweet fails to parse, the rest of the batch "
            "still returns results, so a single malformed input never poisons the "
            "whole request. On the right, the aggregation logic: we compute the "
            "average positive and average negative confidence scores across all "
            "successfully analyzed tweets. If the positive average leads the "
            "negative average by more than 10 percentage points, we call the "
            "sentiment Bullish. If the negative leads by the same margin, Bearish. "
            "Anything within that 10 percent band is classified as Neutral. Tweets "
            "with an unknown sentiment label are filtered out before averaging to "
            "avoid skewing the results."
        ),
    )
    add_colored_columns(
        slide,
        columns=[
            ("Batching Strategy", [
                "**10 documents per API call** — Azure limit",
                "50 tweets = **5 API calls** not 50",
                "Per-document error handling",
                "Failed docs don't break the batch",
            ], MS_BLUE),
            ("Aggregation Logic", [
                "Average **positive** vs **negative** scores",
                "**>10% gap** = Bullish or Bearish",
                "**Within 10%** = Neutral verdict",
                "Unknown sentiment filtered out",
            ], MS_DARK_BLUE),
        ],
        left=CONTENT_LEFT,
        top=CONTENT_TOP,
        width=CONTENT_WIDTH,
        gap=Inches(0.35),
    )

    # ── Slide 14: Key Technical Features ────────────────────────────────
    slide = create_standard_slide(
        prs, "Built-In Resilience", page_num=14, total=TOTAL,
        notes=(
            "Four resilience features are baked into the application from day one. "
            "First, caching: every successful analysis result is stored in memory "
            "with a five-minute TTL keyed by the normalized ticker symbol. This "
            "means repeated queries for the same stock within five minutes hit the "
            "cache instead of burning X API and Azure AI quota. Second, rate "
            "limiting: express-rate-limit caps clients at 100 requests per 15-minute "
            "window, returning a 429 status when the limit is exceeded. This "
            "protects both the server and downstream APIs from runaway traffic or "
            "abuse. Third, dual-mode secrets management via keyvault.js: when "
            "running on Azure the app uses Key Vault backed by a managed identity — "
            "no credentials in code. For local development it falls back to "
            "environment variables loaded from a dotenv file, so developers can get "
            "started without provisioning Key Vault. Fourth, input validation: a "
            "strict regex /^\\$?[A-Z]{1,10}$/i rejects anything that does not look "
            "like a stock ticker before the request touches any external service, "
            "preventing injection and wasted API calls."
        ),
    )
    add_card_grid(
        slide,
        cards=[
            (MS_BLUE, "Caching",
             "Results cached for **5 minutes** per ticker.\n"
             "Reduces API costs and respects X rate limits."),
            (MS_DARK_BLUE, "Rate Limiting",
             "**100 requests per 15 minutes** via express-rate-limit.\n"
             "Prevents abuse and cost overrun."),
            (MS_BLUE_DARKER, "Dual-Mode Secrets",
             "**Key Vault** + managed identity on Azure.\n"
             "**Environment variables** for local dev."),
            (MS_NAVY_LIGHT, "Input Validation",
             "Strict ticker regex: **/^\\$?[A-Z]{1,10}$/i**\n"
             "Normalized to uppercase with $ prefix."),
        ],
        left=CONTENT_LEFT,
        top=CONTENT_TOP,
        cols=2,
        card_w=Inches(4.3),
        card_h=Inches(2.1),
        gap_x=Inches(0.35),
        gap_y=Inches(0.3),
    )

    # ══════════════════════════════════════════════════════════════════
    # Fragment 05 — Live Experience & Closing (slides 15-18)
    # ══════════════════════════════════════════════════════════════════

    # ── Slide 15 – Section Divider: Live Experience ───────────────────
    create_section_divider(
        prs,
        title="Live Experience",
        subtitle="From ticker to insight in seconds",
        notes=(
            "We've covered the architecture, the AI pipeline, and the infrastructure. "
            "Now let's see what the end user actually experiences when they type a ticker "
            "like $MSFT or $TSLA into the dashboard. This section walks through the live "
            "UI, the cost profile, and wraps up with key takeaways and resources."
        ),
    )

    # ── Slide 16 – Dashboard Experience ───────────────────────────────
    slide16 = create_standard_slide(
        prs,
        title="Dashboard Experience",
        page_num=16,
        total=TOTAL,
        notes=(
            "The dark-themed dashboard has three main UI components.\n\n"
            "1) Summary Card – sits at the top and shows the overall verdict "
            "(Bullish, Bearish, or Neutral) derived from averaging per-post "
            "sentiment scores. Color coding makes the verdict instantly scannable: "
            "green for bullish, red for bearish, gray for neutral. It also displays "
            "total posts analyzed and average confidence.\n\n"
            "2) Pie Chart – a Chart.js donut visualization breaks down the sentiment "
            "distribution across four categories: positive, negative, neutral, and mixed. "
            "Hover tooltips show exact counts and percentages.\n\n"
            "3) Post Cards – each individual social-media post is rendered as a card with "
            "a colored sentiment badge (e.g., green 'Positive') and a horizontal confidence "
            "bar so users can judge how certain the AI model was about its classification.\n\n"
            "Together these components give analysts a complete picture in under three seconds "
            "from the moment they enter a ticker symbol."
        ),
    )

    add_feature_grid(
        slide16,
        features=[
            (
                "Summary Card",
                "Overall **Bullish/Bearish/Neutral** verdict with color coding "
                "and average confidence scores",
            ),
            (
                "Pie Chart",
                "**Chart.js** visualization showing sentiment distribution "
                "across positive, negative, neutral, mixed",
            ),
            (
                "Post Cards",
                "Individual tweets with **sentiment badges** and confidence "
                "score bars for transparency",
            ),
        ],
        left=Inches(0.6),
        top=Inches(1.6),
        cols=3,
        card_w=Inches(2.8),
        card_h=Inches(1.6),
        gap=Inches(0.25),
    )

    add_donut_chart(
        slide16,
        data={
            "categories": ["Positive", "Negative", "Neutral", "Mixed"],
            "values": [30, 8, 10, 2],
        },
        left=Inches(3.2),
        top=Inches(3.6),
        width=Inches(3.6),
        height=Inches(3.2),
        chart_title="Typical Sentiment Distribution",
        colors=[
            MS_GREEN,
            RGBColor(0xD1, 0x30, 0x31),
            MS_BLUE_DARKER,
            RGBColor(0xFD, 0xCB, 0x6E),
        ],
    )

    # ── Slide 17 – Cost and Performance Profile ───────────────────────
    slide17 = create_standard_slide(
        prs,
        title="Cost and Performance Profile",
        page_num=17,
        total=TOTAL,
        notes=(
            "One of the strongest selling points of this architecture is its cost "
            "efficiency.\n\n"
            "Azure AI Language free tier gives you 5,000 text records per month at "
            "zero cost – more than enough for a proof-of-concept or low-traffic "
            "internal tool. When you outgrow that, the Standard tier is only $1 per "
            "1,000 records, making it extremely affordable even at scale.\n\n"
            "App Service B1 (~$13/month) is ideal for development and light workloads. "
            "For production traffic, upgrade to P1v3 which adds auto-scale, deployment "
            "slots, and better CPU/memory.\n\n"
            "Key Vault operations cost roughly $0.03 per 10,000 operations – essentially "
            "negligible.\n\n"
            "End-to-end analysis latency (user submits ticker → results rendered) is "
            "typically under three seconds, including social-media fetch, AI batch call, "
            "and rendering.\n\n"
            "With response caching enabled, repeated lookups for the same ticker within "
            "a configurable TTL window hit zero AI API calls, keeping the monthly bill "
            "well inside the free tier for most teams."
        ),
    )

    add_stats_row(
        slide17,
        stats=[
            ("~$0", "AI Language\n(Free Tier)", MS_BLUE),
            ("~$13/mo", "App Service\n(B1 Dev)", MS_DARK_BLUE),
            ("<3s", "Analysis\nLatency", MS_BLUE_DARKER),
            ("5,000", "Free Records\nper Month", MS_NAVY_LIGHT),
        ],
        left=Inches(0.5),
        top=Inches(1.8),
        width=Inches(9.0),
        card_h=Inches(1.8),
        gap=Inches(0.25),
    )

    add_callout_box(
        slide17,
        text=(
            "With caching enabled, typical usage stays well within the free tier.\n"
            "Scale to Standard tier ($1/1,000 records) when volume increases."
        ),
        left=Inches(0.8),
        top=Inches(4.2),
        width=Inches(8.4),
        height=Inches(1.2),
    )

    # ── Slide 18 – Closing / Key Takeaways ────────────────────────────
    create_closing_slide(
        prs,
        title="Key Takeaways",
        takeaways=[
            "Azure AI Language provides production-ready sentiment analysis "
            "with per-document confidence scoring",
            "Managed identity and Key Vault eliminate credential management "
            "entirely",
            "Modular Bicep infrastructure deploys securely across dev, "
            "staging, and production",
            "Smart batching reduces API calls by 10x while caching controls "
            "costs",
        ],
        cta_title="Resources",
        cta_url="https://learn.microsoft.com/azure/ai-services/language-service/",
        cta_items=[
            (
                "Azure AI Language Docs",
                "learn.microsoft.com/azure/ai-services/language-service/",
            ),
            (
                "App Service Docs",
                "learn.microsoft.com/azure/app-service/",
            ),
            (
                "Key Vault Best Practices",
                "learn.microsoft.com/azure/key-vault/general/best-practices",
            ),
        ],
        page_num=TOTAL,
        total=TOTAL,
        notes=(
            "Let's recap the four key takeaways from this session.\n\n"
            "First – Azure AI Language is not a toy. It returns per-document and "
            "per-sentence confidence scores across positive, negative, neutral, and "
            "mixed categories, giving you production-grade signal out of the box.\n\n"
            "Second – by wiring up managed identity between App Service and Key Vault, "
            "we completely eliminated API keys, connection strings, and .env files from "
            "our deployment pipeline. Zero secrets in code, zero secrets in CI/CD.\n\n"
            "Third – modular Bicep with parameter files per environment means the same "
            "templates deploy to dev, staging, and production with different SKUs, "
            "scaling rules, and network policies.\n\n"
            "Fourth – our smart batching strategy groups up to 25 documents per API call "
            "(the service maximum), cutting network round-trips by roughly 10x. Combined "
            "with a short TTL cache on repeated ticker lookups, most teams stay inside the "
            "free tier indefinitely.\n\n"
            "The resources slide links to official Microsoft Learn documentation for Azure "
            "AI Language, App Service, and Key Vault best practices. I encourage you to "
            "clone the sample repo and try it with your own tickers. Thank you!"
        ),
    )

    out = os.path.join(SCRIPT_DIR, "stock-sentiment-l200-30min.pptx")
    save_presentation(prs, out)

if __name__ == "__main__":
    print("Generating Stock Sentiment Analysis PowerPoint...")
    build()
    print("  Done!")
