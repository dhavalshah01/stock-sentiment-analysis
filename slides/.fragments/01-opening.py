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
