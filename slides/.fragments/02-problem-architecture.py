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
        annotations=["50 tweets", "5 batches", "Score & tally", "Visualize"],
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
