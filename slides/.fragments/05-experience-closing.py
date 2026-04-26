    # =======================================================================
    # SECTION 5 — LIVE EXPERIENCE & CLOSING  (slides 15-18)
    # =======================================================================
    from pptx.dml.color import RGBColor

    # ------------------------------------------------------------------
    # Slide 15 – Section Divider: Live Experience
    # ------------------------------------------------------------------
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

    # ------------------------------------------------------------------
    # Slide 16 – Dashboard Experience
    # ------------------------------------------------------------------
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

    # ------------------------------------------------------------------
    # Slide 17 – Cost and Performance Profile
    # ------------------------------------------------------------------
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

    # ------------------------------------------------------------------
    # Slide 18 – Closing / Key Takeaways
    # ------------------------------------------------------------------
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
