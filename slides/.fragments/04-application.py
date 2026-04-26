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
