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
       header_color=MS_BLUE, font_size=Pt(11))
    add_callout_box(
        slide,
        "Same Bicep templates, different parameters.\n"
        "One codebase drives all three environments with appropriate "
        "cost and performance trade-offs.",
        left=CONTENT_LEFT, top=Inches(5.0),
        width=CONTENT_WIDTH, height=Inches(0.9),
    )
