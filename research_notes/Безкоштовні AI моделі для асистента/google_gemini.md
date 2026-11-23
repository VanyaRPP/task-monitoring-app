# Google AI Studio / Gemini API free tier models (state as of 2026-09-26) for the E-ORENDA in-app assistant

Method note: primary facts come from Google's raw doc pages (`ai.google.dev/...md.txt`), downloaded on 2026-09-26. Pricing page "Last updated 2026-09-24 UTC"; API terms "Effective March 23, 2026". Google does **not** publish free-tier RPM/RPD numbers in its docs any more. They appear only per project in the AI Studio dashboard. Every free-tier number below therefore comes from third parties and is flagged as such.

Big-picture context that the report writer needs, because it changed a lot after mid-2025:

- The current Flash line is **Gemini 3.8 Flash** (GA 2026-09-02), 3.7 Flash (GA 2026-08-13), 3.6 Flash (GA 2026-07-21), 3.5 Flash (GA 2026-05-19) and `gemini-3-flash-preview` (Dec 2025).
- The current Flash-Lite line is **3.5 Flash-Lite** (GA 2026-07-21) and 3.1 Flash-Lite (GA 2026-05-07).
- Gemma 4 (`gemma-4-31b-it`, `gemma-4-26b-a4b-it`) has been on the API since 2026-04-02.
- 2.0 Flash/Flash-Lite were shut down on 2026-06-01.
- Since 2026-09-18, 2.5 models are available only to users who already used them.

## 1. Which models are on the free tier, what are the limits, have they been cut, and what are the regional rules?

### Takeaway

The official pricing page says every current text Flash and Flash-Lite model (3.8, 3.7, 3.6, 3.5 Flash, 3 Flash Preview, 3.5 and 3.1 Flash-Lite, 2.5 Flash and Flash-Lite) and Gemma 4 has a "Free of charge" tier. Pro models do not. The free quotas are tiny for Flash (about 5 RPM and **20 RPD**) and moderate for Flash-Lite (about 15 RPM and **500 RPD**). Gemma has high request counts (30 RPM, 14,400 RPD) but only about 15–16K TPM.

Limits were cut 80–90% in December 2025. Pro left the free tier on 2026-04-01. Since 2026-09-18, new projects cannot use 2.5 models at all. Ukraine is a supported region. **Apps serving EEA, Swiss or UK users must use paid services only.**

### Cited Findings

**Official Google sources:**

- The rate-limits page gives no numbers. It says "Rate limits depend on a variety of factors (such as your usage tier) and can be viewed in Google AI Studio" and "Specified rate limits are not guaranteed and actual capacity may vary." — [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- Limits are per project, not per API key. RPD resets at midnight Pacific time. "Rate limits are more restricted for experimental and preview models." — [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- Tiers:
  - Free: "Active project or free trial".
  - Tier 1: linked billing account, $250 billing cap, $10 per 10 minutes spend-rate limit.
  - Tier 2: $100 paid plus 3 days.
  - Tier 3: $1,000 paid plus 30 days.
  - Free to Tier 1 upgrades "typically take effect instantly". — [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- The pricing page marks the Free Tier input and output as "Free of charge" for:
  - `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`
  - `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`
  - `gemini-3-flash-preview`
  - `gemini-2.5-flash`, `gemini-2.5-flash-lite`
  - Gemma 4 — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- `gemini-3.1-pro-preview` has Free Tier "Not available". — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- Gemma 4 is free of charge on the free tier and "Not available" on paid, so there is no paid Gemma on the Gemini API. — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- Google Search and Maps grounding are "Not available" on the free tier for 3.x models ("Can be tested in Google AI Studio"). 2.5 Flash and Flash-Lite get free Search grounding up to 500 RPD. — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- Context caching is "Not available" on the free tier for 3.5 Flash-Lite, 3.1 Flash-Lite and 2.5 Flash/Flash-Lite. It is free on 3.8/3.7/3.6/3.5 Flash and 3 Flash Preview. — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- Changelog, 2026-09-18: "we are limiting access to the 2.5 models to users who have actively used them in the past… For any new projects, use our latest models: 3.5 Flash-Lite or 3.8 Flash." — [Gemini changelog](https://ai.google.dev/gemini-api/docs/changelog)
- `gemini-2.0-flash`, `-001`, `gemini-2.0-flash-lite` and `-001` were shut down on 2026-06-01. — [Gemini changelog](https://ai.google.dev/gemini-api/docs/changelog)
- The official pages do not list Gemma 3 as a current model. The changelog shows `gemma-3-27b-it` was released 2025-03-12 and `gemma-4-26b-a4b-it` / `gemma-4-31b-it` on 2026-04-02. — [Gemini changelog](https://ai.google.dev/gemini-api/docs/changelog)

**Third-party free-tier numbers:**

- The cheahjs free-LLM list (auto-generated from AI Studio) gives, for Google AI Studio, per model TPM / RPD / RPM. Snapshot fetched 2026-09-26; the date of its last Google refresh is unknown, and it does **not** list 3.7 or 3.8 Flash. — [cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources)

  | Model                       | TPM     | RPD    | RPM |
  | --------------------------- | ------- | ------ | --- |
  | Gemini 3.6 Flash            | 250,000 | 20     | 5   |
  | Gemini 3.5 Flash            | 250,000 | 20     | 5   |
  | Gemini 3 Flash              | 250,000 | 20     | 5   |
  | Gemini 3.5 Flash-Lite       | 250,000 | 500    | 15  |
  | Gemini 3.1 Flash-Lite       | 250,000 | 500    | 15  |
  | Gemini 2.5 Flash            | 250,000 | 20     | 5   |
  | Gemini 2.5 Flash-Lite       | 250,000 | 20     | 10  |
  | Gemma 4 31B                 | 16,000  | 14,400 | 30  |
  | Gemma 4 26B A4B             | 16,000  | 14,400 | 30  |
  | Gemma 3 27B / 12B / 4B / 1B | 15,000  | 14,400 | 30  |
  | Gemini Robotics-ER 1.6      | 250,000 | 20     | 5   |

  The same list says: "Data is used for training when used outside of the UK/CH/EEA/EU."

- Gemini 3.8 Flash free tier = **20 RPD**. A developer forum post of 2026-09-03 asks Google to raise it to 100–200 RPD. The same post cites Flash-Lite at 500 RPD. No Google staff reply is visible. — [Google AI Developers Forum](https://discuss.ai.google.dev/t/gemini-3-8-flash-free-tier-20-rpd-is-too-limited-for-practical-evaluation/180609)
- December 2025 cuts:
  - Rolled out on 2025-12-06/07 without a wide announcement.
  - Gemini 2.5 Flash fell from about 250 to 20 RPD.
  - 2.5 Pro effectively left the free tier.
  - Described as an "80–92%" reduction that broke integrations such as Home Assistant.
  - Sources are search-snippet level: a news write-up and an SEO aggregator. The official changelog has **no** entry for these cuts. — [Yahoo Tech](https://tech.yahoo.com/ai/gemini/articles/gemini-slashed-free-api-limits-140016369.html); [aifreeapi](https://www.aifreeapi.com/en/posts/gemini-api-free-tier-rate-limits)
- "Pro-series models (Gemini 2.5 Pro, Gemini 3.x Pro) left the free tier on Apr 1, 2026." (verified June 2026). The same page lists only 2.5 Flash at 10 RPM / 250 RPD and 2.5 Flash-Lite at 15 RPM / 1,000 RPD as free. That contradicts the cheahjs numbers and the official pricing page, so it looks stale. — [PricePerToken](https://pricepertoken.com/endpoints/google-ai-studio/free)
- Conflicting and likely outdated third-party numbers: TokenMix (updated 2026-04-29) lists 2.5 Flash at 15 RPM / 1,500 RPD / 1M TPM and still lists the shut-down 2.0 Flash. Treat it as unreliable. — [TokenMix](https://tokenmix.ai/blog/gemini-api-free-tier-limits)

**Images per request:**

- "Gemini models support a maximum of 3,600 image files per request." — [Image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- Accepted formats: PNG, JPEG, WEBP, HEIC, HEIF. — [Image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- PDFs: up to 50 MB or 1,000 pages. Pages are scaled down to at most 3072×3072. — [Document processing](https://ai.google.dev/gemini-api/docs/document-processing)

**Regions and terms:**

- Ukraine is in the list of available regions, as are Switzerland and the United Kingdom. — [Available regions](https://ai.google.dev/gemini-api/docs/available-regions)
- Terms: "You may use only Paid Services when making API Clients available to users in the European Economic Area, Switzerland, or the United Kingdom." — [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
- Terms: "Use of Google AI Studio and Gemini API is for developers building with Google AI models for professional or business purposes, not for consumer use." — [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)

### Inferences

- **Flash free tier (20 RPD per project) is not enough for a production assistant.** A single multi-step tool loop uses one request per step: photo → extract → create_company → create_invoice… That is about 3–6 steps, so 20 RPD covers roughly 3–6 user tasks per day for the whole project, not per user.
- **3.5 Flash-Lite and 3.1 Flash-Lite (500 RPD, 15 RPM) are the only free Gemini models with room for real usage.** Gemma 4 has the most requests (14,400 RPD), but its 16K TPM caps how many image-plus-tools prompts fit per minute.
- **Keep EEA/UK users away from the free tier.** A billing/ОСББ app used only by Ukrainian users may legally use the free tier. If the app ever serves EEA or UK users (for example Ukrainians abroad), the terms require paid services.
- **The app cannot plan on a stable quota.** Free-tier quotas have been cut or reshaped without changelog entries three times (Dec 2025, Apr 2026 Pro removal, Sep 2026 2.5 access restriction). Code should handle 429 errors and have a fallback model.

### Gaps

- No official, current free-tier RPM/TPM/RPD numbers exist in Google's docs. The AI Studio dashboard needs a logged-in project.
- 3.7 Flash free-tier numbers were not found. For 3.8 Flash, only the RPD (20) was found; RPM and TPM were not.
- Whether Gemma 3 models are still served on the API in Sept 2026 is not confirmed. cheahjs lists them; the official model pages do not.
- Whether the "EEA → paid only" rule is enforced technically (blocked) or only contractually was not found.

## 2. How good is each model at tool / function calling?

### Takeaway

Google no longer reports BFCL or τ²-bench for 3.5+ Flash models. It reports agentic benchmarks instead (MCP Atlas, Toolathlon, Terminal-bench, OSWorld, etc.), where 3.5 → 3.8 Flash are strong and far ahead of Gemini 3 Flash Preview. Flash-Lite models are clearly weaker. Gemma 4 31B has τ²=76.9% vs 16.2% for Gemma 3 27B.

Known practical problems:

- `MALFORMED_FUNCTION_CALL` errors, especially with the `VALIDATED` mode or when the prompt forces structured text before a tool call.
- Strict id/name/count matching of function responses on 3.x.
- A subset-of-OpenAPI schema.
- Sampling parameters are deprecated.

### Cited Findings

**Model-card benchmarks (Google's own numbers, not independent):**

- Gemini 3.5 Flash vs Gemini 3 Flash (model card "Results as of May 2026"):
  - MCP Atlas (multi-step MCP workflows): **83.6% vs 62.0%**
  - Toolathlon: **56.5% vs 49.4%**
  - OSWorld-Verified: 78.4% vs 65.1%
  - Terminal-bench 2.1: 76.2% vs 58.0%
  - Finance Agent v2: 57.9% vs 42.6% — [Gemini 3.5 Flash model card](https://deepmind.google/models/model-cards/gemini-3-5-flash/)
- Gemini 3.6 Flash (July 2026): Terminal-bench 2.1 78.0%, OSWorld-Verified 83.0%, GDPVal-AA v2 Elo 1421, SWE-Bench Pro 58.7%. — [Gemini 3.6 Flash model card](https://deepmind.google/models/model-cards/gemini-3-6-flash/)
- Gemini 3.7 Flash (Aug 2026): Artificial Analysis Intelligence Index 56 (3.6 Flash: 52). AutomationBench (enterprise workflow automation) 30.4% vs 17.0% for 3.6 Flash. Terminal-bench 2.1 85.8%. — [Gemini 3.7 Flash model card](https://deepmind.google/models/model-cards/gemini-3-7-flash/)
- Gemini 3.8 Flash (Sept 2026): Terminal-bench 2.1 89.4%, Terminal-bench 4.0 19.1% (vs 11.2% for 3.7), OSWorld-2.0 59.0%, Vals Finance Agent v2 61.4%, GDPVal-AA v2 Elo 1545. Knowledge cutoff March 2026. — [Gemini 3.8 Flash model card](https://deepmind.google/models/model-cards/gemini-3-8-flash/)
- Gemini 3.5 Flash-Lite vs 3.1 Flash-Lite (July 2026): Terminal-bench 2.1 54.0% vs 31.0%, OSWorld-Verified 74.0% vs 54.3%, GDPVal-AA v2 Elo 1140 vs 642, SWE-Bench Pro 54.2% vs 38.3%. — [Gemini 3.5 Flash-Lite model card](https://deepmind.google/models/model-cards/gemini-3-5-flash-lite/)
- Gemini 3.1 Flash-Lite (March 2026): MMMLU (multilingual Q&A) 88.9% vs 86.6% for 2.5 Flash and 84.5% for 2.5 Flash-Lite. Output speed 363 tok/s. — [Gemini 3.1 Flash-Lite model card](https://deepmind.google/models/model-cards/gemini-3-1-flash-lite/)
- Gemma 4 instruction-tuned, τ² (average over 3):

  | Model           | τ²        |
  | --------------- | --------- |
  | Gemma 4 31B     | **76.9%** |
  | Gemma 4 26B A4B | 68.2%     |
  | Gemma 4 12B     | 69.0%     |
  | Gemma 4 E4B     | 42.2%     |
  | Gemma 3 27B     | **16.2%** |

  The card claims "Native support for structured tool use". — [Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4)

**Leaderboards:**

- BFCL v3 (as of 2026-06-29): Gemini 3.1 Flash Lite Preview is 3rd at 76.5%, behind GLM 4.5 (76.7%) and Claude Opus 4.7 (76.6%). Search-snippet level via an aggregator. — [PricePerToken BFCL v3](https://pricepertoken.com/leaderboards/benchmark/bfcl-v3)
- BFCL v4 (April 2026) moved to agentic weighting: Agentic 40%, Multi-turn 30%, Live 10%, Non-live 10%, Hallucination 10%. — [Spheron blog summary](https://www.spheron.network/blog/tool-calling-benchmarks-bfcl-tau-bench-latency-optimization/); official board at [BFCL](https://gorilla.cs.berkeley.edu/leaderboard.html)

**Function-calling behaviour and requirements (Google docs):**

- The API supports parallel function calling (several calls in one turn) and compositional (sequential) function calling. — [Function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- `tool_choice` modes: `auto` (default), `any` (always call a function), `none`, and `validated` ("Model ensures function schema adherence"). — [Function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- Limitations:
  - "Only a subset of the OpenAPI schema is supported."
  - "For `any` mode, the API may reject very large or deeply nested schemas." — [Function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- If the prompt makes the model output structured text (XML/JSON) right before a tool call, the call "may occasionally fail with `Malformed_Function_Call`". The preferred workaround is a dedicated `update()` function for notes. — [Function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- Rules for all 3.x models:
  - Every FunctionResponse needs a matching `id` and `name`.
  - Exactly one response per call.
  - Multimodal content goes _inside_ the function response.
  - Full history with thought signatures must be passed back. Since 3.5 Flash, reasoning context carries across turns when signatures are present. — [What's new in Gemini 3.5](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5)
- `temperature`, `top_p` and `top_k` were formally deprecated on 2026-07-21. Google says: "Remove these parameters from all requests." — [Gemini changelog](https://ai.google.dev/gemini-api/docs/changelog); [What's new in Gemini 3.5](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5)
- 3.8 Flash migration checklist:
  - Strip `temperature`/`top_p`/`top_k`.
  - Use `thinking_level` instead of `thinking_budget`.
  - `minimal` is **not supported on 3.8 Flash and returns an error**; the default is `medium`.
  - Remove `candidate_count`.
  - Remove prefilled model turns. — [Latest model guide (3.8 Flash)](https://ai.google.dev/gemini-api/docs/latest-model)
- 3.8 Flash "can use more tokens on longer running and complex tasks, by design… calls tools iteratively, and verifies its work". For everyday tasks, lower the reasoning effort, or use 3.7 Flash, which "remains fully supported". — [Latest model guide](https://ai.google.dev/gemini-api/docs/latest-model)

**Developer reports:**

- Gemini 3.8 Flash tool calls intermittently returned `MALFORMED_FUNCTION_CALL` (thinking plus an empty text part, no functionCall) when the client forced `functionCallingConfig.mode = VALIDATED`. Switching to `AUTO` fixed it in local tests: 5/5 simple and 3/3 full-toolset calls. The reporter also advised a bounded retry on HTTP 200 plus MALFORMED. Issue dated 2026-09-20. — [pi-oauth-antigravity #2](https://github.com/heyhuynhgiabuu/pi-oauth-antigravity/issues/2)
- Older reports (2025) of MALFORMED_FUNCTION_CALL: empty responses in LangChain Deep Agents, and 2.5-flash on Vertex. — [deepagents #417](https://github.com/langchain-ai/deepagents/issues/417); [python-genai #1120](https://github.com/googleapis/python-genai/issues/1120)
- Also from 2025: in ADK, the model sometimes outputs Python code instead of a function call. — [adk-go #492](https://github.com/google/adk-go/issues/492)

### Inferences

- **The upgrade path matters as much as the free choice.**
  - Among free options with usable quota: **3.5 Flash-Lite is the strongest agentic Flash-Lite model** (OSWorld-Verified 74% vs 54% for 3.1 Flash-Lite). Gemma 4 31B is a credible free alternative on τ² but has a very low TPM.
  - For reliable multi-step entity creation, 3.7/3.8 Flash are clearly the best of the Flash line, but on the free tier they are limited to about 20 RPD.
- **Implementation implications for the AI SDK app:**
  - Keep tool schemas flat.
  - Leave the tool mode at the default AUTO, not a forced "validated" mode.
  - Do not ask for XML/JSON pre-tool text.
  - Retry once on `MALFORMED_FUNCTION_CALL`.
  - Remove the `temperature` setting.
- **Tool calling in Ukrainian specifically is unbenchmarked.** The best proxy is MMMLU multilingual: 3.1 Flash-Lite 88.9%, Gemma 4 31B 88.4%.

### Gaps

- No BFCL v4 or τ²-bench numbers were found for 3.5/3.6/3.7/3.8 Flash or 3.5 Flash-Lite. Google switched to MCP Atlas, Toolathlon and others.
- The Gemini 3 Flash Preview τ² score was not retrieved from a primary source.
- No independent (non-Google) agentic benchmark results were found for 3.6–3.8 Flash beyond the Artificial Analysis index quoted in Google's own card.
- Whether Gemma 4 on the Gemini API exposes native `tools`/function calling and JSON-schema output was not confirmed. The AI SDK docs only show plain text for Gemma.

## 3. How good are the models at vision and OCR on documents, Cyrillic text, meters and tables?

### Takeaway

Gemini 3-family models lead public document-parsing leaderboards: Gemini 3 Flash is #1 on OmniDocBench v1.5 on the IDP leaderboard (Feb 2026). 3.1 Flash-Lite ranked #1 of 14 on a multi-script printed-OCR benchmark, with 88.8% Acc@5 on Cyrillic. Weak spots are old scans and headers/footers.

There is **no benchmark evidence for Ukrainian handwriting or utility-meter digit reading**. Use `media_resolution: high` (1,120 tokens per image) and consider per-image `ultra_high`.

### Cited Findings

**Document-parsing leaderboards:**

- IDP Leaderboard (updated 2026-02-01), Gemini 3 Flash, #4 of 29 overall (82.0):
  - OmniDocBench v1.5: **overall 90.1, rank 1/29**; text edit distance 0.077; table TEDS 87.7; TEDS-S 92.6; reading order 0.081.
  - IDP Core: KIE (key information extraction) 91.1; OCR 81.7; Table 85.6; VQA 63.5.
  - OlmOCR: overall 75.3; Old Scans **45.8**; Headers & Footers **27.4**; Tables 64.6. — [IDP Leaderboard – Gemini 3 Flash](https://benchmarking.nanonets.com/models/gemini-3-flash)
- Gemma 4 OmniDocBench 1.5 (average edit distance, lower is better): 31B **0.131**, 26B A4B 0.149, 12B 0.164, E4B 0.181, vs Gemma 3 27B **0.365**. — [Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4)
- Gemma 4 capabilities listed: "Document/PDF parsing… OCR (including multilingual), handwriting recognition". Visual token budgets are 70/140/280/560/1120; use higher budgets for OCR and small text. — [Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4)

**Cyrillic and multilingual OCR:**

- GlotOCR Bench (arXiv 2604.12978, 2026-04-14), Gemini 3.1 Flash-Lite, ranked first of 14 models:
  - **Cyrillic Acc@5 88.8%, CER 3.0%, script accuracy 99.2%**
  - Latin 95.3%; mid-resource scripts 82.7%; low-resource 7.7%
  - Synthetic _printed_ text only, including degraded "aged document" variants; no handwriting; Ukrainian not mentioned. — [GlotOCR Bench](https://arxiv.org/html/2604.12978v1)

**Multimodal reasoning and PDF benchmarks (Google model cards):**

- MMMU-Pro: 3.5 Flash 83.6%, Gemini 3 Flash 81.2%, 3.1 Flash-Lite 76.8%, 2.5 Flash 66.7%, 2.5 Flash-Lite 51.0%. — [3.5 Flash card](https://deepmind.google/models/model-cards/gemini-3-5-flash/); [3.1 Flash-Lite card](https://deepmind.google/models/model-cards/gemini-3-1-flash-lite/)
- CharXiv Reasoning (charts, no tools): 3.8 Flash 86.2%, 3.7 84.5%, 3.6 85.2%, 3.5 84.2%, 3.5 Flash-Lite 74.5%, 3.1 Flash-Lite 73.2%. — [3.8 card](https://deepmind.google/models/model-cards/gemini-3-8-flash/); [3.7 card](https://deepmind.google/models/model-cards/gemini-3-7-flash/); [3.5 Flash-Lite card](https://deepmind.google/models/model-cards/gemini-3-5-flash-lite/)
- GDP.PDF (expert PDF comprehension, all-pass rate): 3.8 Flash 35.0%, 3.7 Flash 34.0%, 3.6 Flash 22.0%. Claude Opus 5 scores 37.0%. — [3.8 card](https://deepmind.google/models/model-cards/gemini-3-8-flash/); [3.7 card](https://deepmind.google/models/model-cards/gemini-3-7-flash/)

**Community test of 3.8 Flash thinking levels on OCR:**

- English sustainability and financial PDFs, dense tables, 200 DPI. The default setting gave the best text fidelity (77.4%, CER 0.226). HIGH was worst (59.4%, CER 0.406). LOW won the pairwise Elo.
- This is a small 4-page community test. It also reports a "MINIMAL" level, which contradicts Google's statement that minimal errors on 3.8 Flash. Low reliability. — [gemini-thinking-ocr-benchmark](https://github.com/luseloso/gemini-thinking-ocr-benchmark)

**Media resolution (Gemini 3 family), tokens per image:**

| Setting                              | Image tokens | PDF page tokens    |
| ------------------------------------ | ------------ | ------------------ |
| `unspecified` (default)              | **1120**     | 560                |
| `low`                                | 280          | 280 + native text  |
| `medium`                             | 560          | 560 + native text  |
| `high`                               | 1120         | 1120 + native text |
| `ultra_high` (per content item only) | 2240         | —                  |

- "`high` provides the optimal performance for most use cases". Resolution can be set per content item (Gemini 3 only). — [Media resolution](https://ai.google.dev/gemini-api/docs/media-resolution)
- Conflict: the document-processing page still says "Each document page is equivalent to 258 tokens", while the media-resolution page gives 560 for Gemini 3 by default. — [Document processing](https://ai.google.dev/gemini-api/docs/document-processing) vs [Media resolution](https://ai.google.dev/gemini-api/docs/media-resolution)
- Image tips: verify rotation, use non-blurry images, and "place the text prompt before the image". — [Image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- 3.5 Flash-Lite is positioned for "subagent tasks and document parsing… simple data extraction". — [3.5 Flash-Lite model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)
- The Gemini Robotics ER 1.6 preview added "instrument reading" (gauges). It is listed free at 20 RPD by cheahjs. — [Gemini changelog 2026-04-14](https://ai.google.dev/gemini-api/docs/changelog); [cheahjs list](https://github.com/cheahjs/free-llm-api-resources)

### Inferences

- **For printed Ukrainian invoices, bank statements and typed debtor lists, current Gemini Flash / Flash-Lite are likely strong.** Cyrillic printed OCR has a CER of about 3% on synthetic text, and OmniDocBench is state of the art. Tables are good but not perfect (TEDS about 88).
- **Photos of crumpled, old or handwritten documents are riskier.** Old-scans score is 45.8 on OlmOCR, and no handwriting data exists. The app should show extracted values for user confirmation before creating entities.
- **Photo-only extraction should use `high` resolution** (the Gemini 3 default already equals high at 1,120 tokens per image).
- **Meter photos: consider a per-image `ultra_high` setting.** Utility-meter digit reading (odometer-style drums, LCDs) is untested publicly. Plan an internal eval set of about 30–50 real Ukrainian meter, invoice and statement photos.

### Gaps

- No public benchmark was found for Ukrainian or Cyrillic _handwriting_, meter or gauge digit reading, or Ukrainian bank statements, for any Gemini model.
- No OmniDocBench or OCRBench numbers were found for 3.5/3.6/3.7/3.8 Flash or 3.5 Flash-Lite. Only Gemini 3 Flash (Feb 2026) and Gemma 4 are covered.
- OCRBench v2 and CC-OCR results for 3.x models were not found.

## 4. Can structured output, tools and images go in one request, and how does `@ai-sdk/google` handle it?

### Takeaway

Images and function calling combine freely. Structured output (JSON schema) **together with function calling in one request is a Preview feature limited to Gemini 3-series models**. On 2.5 models it errors with "Function calling with a response mime type: 'application/json' is unsupported".

`@ai-sdk/google` v6 supports `Output.object`, tools and images for all 3.x Flash ids. Its docs still warn that `z.union`/`z.record` fail, even though Google's current JSON-schema subset lists `anyOf` and `$ref`.

### Cited Findings

**Google docs:**

- "Structured outputs with tools — Preview: This feature is available only to Gemini 3 series models." It combines with Search, URL Context, Code Execution, File Search and Function Calling. — [Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- The supported JSON Schema subset covers:
  - Types: string, number, integer, boolean, object, array, and null via type arrays.
  - `title`, `description`, `properties`, `required`, `additionalProperties`.
  - `enum`; `format` (date-time, date, time); `minimum`/`maximum`.
  - `items`, `prefixItems`, `minItems`/`maxItems`.
  - Examples use `anyOf` and recursive `$ref: "#"`.
  - Limitations: "Not all JSON Schema features are supported"; "Very large or deeply nested schemas may be rejected." — [Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- Every 3.x Flash and Flash-Lite model page lists Function calling, Structured outputs, Thinking, Caching and Code execution as Supported. Inputs are text, image, video, audio and PDF. Context is 1,048,576 input and 65,536 output tokens. — [3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash); [3.5 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash); [3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite); [3.1 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite)
- Since 2025-12-17 (Gemini 3 Flash), function responses can be multimodal, for example returning an image inside a function response. — [Gemini changelog](https://ai.google.dev/gemini-api/docs/changelog)
- Since 2026-03-18, built-in tools and custom function calling can be combined in one call. — [Gemini changelog](https://ai.google.dev/gemini-api/docs/changelog)
- Google's docs now label generateContent pages as "Gemini Generate Content API (Legacy)". The primary examples use the newer Interactions API (`client.interactions.create`). — [Generate Content latest-model page](https://ai.google.dev/gemini-api/docs/generate-content/latest-model); [Latest model guide](https://ai.google.dev/gemini-api/docs/latest-model)

**AI SDK v6 docs:**

- `@ai-sdk/google` "treats unrecognized `gemini-*` model IDs and `-latest` aliases like the newest supported Gemini generation." That means Gemini 3 request behaviour for mixed tools, `thinkingLevel`, multimodal function responses and thought signatures. — [AI SDK v6 Google provider](https://ai-sdk.dev/v6/providers/ai-sdk-providers/google-generative-ai)
- The capabilities table lists `gemini-3.8-flash`, `-3.7-flash`, `-3.6-flash`, `-3.5-flash`, `-3.5-flash-lite`, `gemini-3-flash-preview`, `gemini-2.5-flash` and `gemini-2.5-flash-lite` with Image Input, Object Generation, Tool Usage, Tool Streaming, Google Search and URL Context all supported. — [AI SDK v6 Google provider](https://ai-sdk.dev/v6/providers/ai-sdk-providers/google-generative-ai)
- Provider options:
  - `structuredOutputs` (default true; "for tool calling they are required").
  - `thinkingConfig.thinkingLevel` ('minimal' | 'low' | 'medium' | 'high').
  - `mediaResolution` (`MEDIA_RESOLUTION_LOW` / `MEDIUM` / `HIGH` / `UNSPECIFIED`).
  - No `ultra_high` option or per-part resolution is documented. — [AI SDK v6 Google provider](https://ai-sdk.dev/v6/providers/ai-sdk-providers/google-generative-ai)
- Schema limitations per the AI SDK: the API "uses a subset of the OpenAPI 3.0 schema, which does not support features such as unions"; "`z.union`, `z.record` [are] known to not work". The workaround is `structuredOutputs: false` for object generation. This conflicts with Google's current docs, which show `anyOf`. — [AI SDK v6 Google provider](https://ai-sdk.dev/v6/providers/ai-sdk-providers/google-generative-ai) vs [Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- The AI SDK docs list Gemma models `gemma-3-27b-it` and `gemma-3-12b-it`. Gemma has no native `systemInstruction`, so the provider prepends the system prompt to the first user message. — [AI SDK v6 Google provider](https://ai-sdk.dev/v6/providers/ai-sdk-providers/google-generative-ai)
- The AI SDK docs now default to v7 (`/v7/providers/ai-sdk-providers/google`). The v6 page is still served at `/v6/...`. — [AI SDK Google provider (v7)](https://ai-sdk.dev/providers/ai-sdk-providers/google)

**Issue reports:**

- vercel/ai #11947 (2026-01-22, closed as a docs issue): structured output plus function calling fails with "Function calling with a response mime type: 'application/json' is unsupported" on all models except `gemini-3-pro-preview` and `gemini-3-flash-preview` at the time. Maintainers called it a model limitation. — [vercel/ai #11947](https://github.com/vercel/ai/issues/11947)
- vercel/ai #11466: on Gemini 3, `Output.object()` combined with `google.tools.codeExecution()` threw `AI_NoOutputGeneratedError`. Search-snippet level. — [vercel/ai #11466](https://github.com/vercel/ai/issues/11466)
- OpenRouter AI SDK provider #411: `Output.object()` plus tools adds `response_format` on every step, so the model sometimes writes tool arguments as text. This is a different provider, but a similar risk pattern. Search-snippet level. — [OpenRouter ai-sdk-provider #411](https://github.com/OpenRouterTeam/ai-sdk-provider/issues/411)

### Inferences

- **The safest AI SDK design for "photo → entities" is either of two patterns:**
  - Two phases: `generateText` with the image plus `Output.object` (no tools) to extract a validated Zod object, then deterministic server code or a second tool-calling step to create entities.
  - A single tool-calling loop where each "create_*" tool's Zod input schema _is_ the structure, without also setting `Output.object`.
  - This avoids the Preview-only structured-output-plus-tools combination and the JSON-per-step issues.
- **Schema rules:** keep the Zod schemas free of `z.union`/`z.record`/`discriminatedUnion`, and use `z.enum` plus optional fields to stay inside both the AI SDK's and Gemini's supported subsets.
- **Upgrading to AI SDK v7 is optional.** The v6 provider already recognises the 3.x ids.

### Gaps

- It was not confirmed whether structured output plus function calling now works on GA 3.5–3.8 Flash and 3.5 Flash-Lite through `@ai-sdk/google` v6. The "Gemini 3 series" wording suggests yes, but no test report was found.
- Whether `@ai-sdk/google` ^3 strips or forwards `temperature` for 3.x models, and whether the API now _errors_ or _ignores_ deprecated sampling params, was not found.
- Per-part `ultra_high` media resolution via the AI SDK is undocumented.

## 5. Does Google train on free-tier data, and how does that differ from the paid tier?

### Takeaway

Yes. On the free tier ("Unpaid Services"), Google uses prompts, images and responses to improve its products and ML, and **human reviewers may read them**. Google explicitly says not to submit sensitive, confidential or personal information.

The paid tier (a project with active billing) is not used for training; data is logged only for a limited period for abuse detection. EEA, Swiss and UK users get paid-tier data terms even on the free tier. Ukraine does not get that protection.

### Cited Findings

- "When you use Unpaid Services, including… the unpaid quota on Gemini API, Google uses the content you submit to the Services and any generated responses to provide, improve, and develop Google products and services and machine learning technologies…" — [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
- "To help with quality and improve our products, human reviewers may read, annotate, and process your API input and output… disconnecting this data from your Google Account, API key, and Cloud project before reviewers see or annotate it. **Do not submit sensitive, confidential, or personal information to the Unpaid Services.**" — [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
- The license extends to "files such as images, videos, or documents". — [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
- Paid: "Google doesn't use your prompts (including… files such as images…) or responses to improve our products". Data is processed under the Data Processing Addendum. "Google logs prompts and responses for a limited period of time, solely for detecting and preventing violations of the Prohibited Use Policy". Data "may be stored transiently or cached in any country". — [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
- API access counts as Paid "only when accessing the API through a Cloud Project associated with an active billing account". — [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
- "If you're in the European Economic Area, Switzerland, or the United Kingdom, the terms under 'How Google uses Your Data' in 'Paid Services' apply to all Services, including… unpaid quota in the Gemini API". — [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
- The pricing table repeats "Used to improve our products: Yes" (free) / "No" (paid) for every model, including Gemma 4. — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)

### Inferences

- **Debtor lists (names, flat numbers, debt amounts), bank statements and invoices with personal data are exactly what the terms tell developers not to send to the free tier.** For a Ukrainian ОСББ/billing app, using the free tier on real tenant data is a compliance and privacy risk (Ukrainian personal-data law was not researched here).
- **Free is realistic only for development and testing.** Production with real data realistically needs a billing-enabled project (Tier 1). Tier 1 has no minimum spend, just a linked billing account with a $250 cap.

### Gaps

- The retention period for paid-tier abuse logs is not stated numerically on the terms page (older docs said 55 days; not re-verified here).
- The retention and review policy for free-tier data (how long, what share is reviewed) is not quantified.

## 6. How stable are the model ids: what is `gemini-flash-latest` now, and what is being deprecated?

### Takeaway

The last documented switch of `gemini-flash-latest` was to **`gemini-3.5-flash` on 2026-05-19**. No changelog entry shows it moving to 3.6/3.7/3.8 Flash, so the current target is uncertain. Aliases can be hot-swapped with only a 2-week email notice for breaking changes.

- 2.5 Flash and Flash-Lite have no shutdown date but are now closed to new users (2026-09-18).
- 2.0 Flash is shut down.
- 3.1 Flash-Lite has an earliest shutdown of 2027-05-07.
- The `gemini-3-flash-preview` replacement is `gemini-3.6-flash`.

Pin an explicit stable id.

### Cited Findings

- History of the `gemini-flash-latest` alias:
  - 2026-01-21: "`gemini-flash-latest` switched to `gemini-3-flash-preview`" (and `gemini-pro-latest` → `gemini-3-pro-preview`). — [Gemini changelog](https://ai.google.dev/gemini-api/docs/changelog)
  - 2026-05-19: "Released `gemini-3.5-flash`… This is now the model behind `gemini-flash-latest`." — [Gemini changelog](https://ai.google.dev/gemini-api/docs/changelog)
  - The 3.6 (Jul 21), 3.7 (Aug 13) and 3.8 (Sep 2) Flash release notes contain no alias statement. The models page does not name the current alias target. — [Gemini changelog](https://ai.google.dev/gemini-api/docs/changelog); [Models](https://ai.google.dev/gemini-api/docs/models)
- Alias policy: "Latest: Points to the latest release for a specific model variation. This can be a stable, preview or experimental release. This alias will get hot-swapped with every new release… For breaking changes, a 2-week notice will be provided through email." — [Models](https://ai.google.dev/gemini-api/docs/models)
- "Stable models usually don't change. Most production apps should use a specific stable model." — [Models](https://ai.google.dev/gemini-api/docs/models)
- Preview models "might come with more restrictive rate limits and will be deprecated with at least 2 weeks notice". — [Models](https://ai.google.dev/gemini-api/docs/models)
- Deprecation table (shutdown dates are "earliest possible"):
  - 3.8 / 3.7 / 3.6 / 3.5 Flash and 3.5 Flash-Lite: "No shutdown date announced".
  - `gemini-3.1-flash-lite` → **May 7, 2027** (replacement `gemini-3.5-flash-lite`).
  - `gemini-3-flash-preview`: no date; replacement `gemini-3.6-flash`.
  - `gemini-2.5-flash` and `gemini-2.5-flash-lite`: no shutdown date.
  - `gemini-2.0-flash*`: shut down June 1, 2026.
  - `gemini-3-pro-preview`: shut down March 9, 2026.
  - `gemini-3.1-flash-lite-preview`: shut down May 25, 2026. — [Deprecations](https://ai.google.dev/gemini-api/docs/deprecations)
- The models page labels 3.5 Flash "Our legacy Flash model" and 3.6/3.7 as "previous-generation". `gemini-3-flash-preview` is labelled "legacy". — [Models](https://ai.google.dev/gemini-api/docs/models); [Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- Official recommendation for new projects: "3.5 Flash-Lite or 3.8 Flash". — [Models](https://ai.google.dev/gemini-api/docs/models)

### Inferences

- **If `gemini-flash-latest` still resolves to 3.5 Flash, the app is on the model with the highest paid price and a "legacy" label.** 3.5 Flash costs $1.50 / $9.00 per 1M tokens, vs $0.75 / $3.75 for 3.8 Flash.
- **Silent swaps can change behaviour mid-production.** Examples: 3.8 Flash rejects `thinkingLevel: 'minimal'`, and 3.8 Flash spends more tokens.
- **Recommendation:** pin `gemini-3.8-flash` or `gemini-3.7-flash` (quality) or `gemini-3.5-flash-lite` (free quota). Use the other as an explicit fallback.

### Gaps

- The actual current target of `gemini-flash-latest` could not be verified without an API key. Calling `models.get` or logging `response.modelVersion` would settle it.
- Whether `gemini-flash-lite-latest` exists now and what it points to was not found in the current docs.

## 7. What does the paid tier cost per 1M tokens (for a cheap-upgrade fallback)?

### Takeaway

The cheapest paid options are 2.5 Flash-Lite ($0.10 in / $0.40 out, but closed to new users) and 3.1 Flash-Lite ($0.25 / $1.50). 3.5 Flash-Lite costs $0.30 / $2.50. 3.6, 3.7 and 3.8 Flash all cost $0.75 / $3.75 until 2026-12-31, then double to $1.50 / $7.50 from 2027-01-01. 3.5 Flash is $1.50 / $9.00. Batch and Flex tiers are about half price.

### Cited Findings

Standard prices per 1M tokens (text/image/video input; output includes thinking tokens):

| Model                    | Input                         | Output          | Cache  | Notes                                                                                                 |
| ------------------------ | ----------------------------- | --------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| `gemini-3.8-flash`       | $0.75                         | $3.75           | $0.075 | Through 2026-12-31. Then $1.50 / $7.50 / $0.15. Batch & Flex $0.375 / $1.875. Priority $1.35 / $6.75. |
| `gemini-3.7-flash`       | $0.75                         | $3.75           | —      | Same introductory pricing and 2027 step-up as 3.8.                                                    |
| `gemini-3.6-flash`       | $0.75                         | $3.75           | —      | Same introductory pricing and 2027 step-up as 3.8.                                                    |
| `gemini-3.5-flash`       | $1.50                         | $9.00           | $0.15  |                                                                                                       |
| `gemini-3.5-flash-lite`  | $0.30 (incl. audio)           | $2.50           | $0.03  | Batch & Flex $0.15 / $1.25. Priority $0.54 / $4.50.                                                   |
| `gemini-3.1-flash-lite`  | $0.25 ($0.50 audio)           | $1.50           | $0.025 |                                                                                                       |
| `gemini-3-flash-preview` | $0.50 ($1.00 audio)           | $3.00           | $0.05  |                                                                                                       |
| `gemini-2.5-flash`       | $0.30 ($1.00 audio)           | $2.50           | $0.03  |                                                                                                       |
| `gemini-2.5-flash-lite`  | $0.10 ($0.30 audio)           | $0.40           | $0.01  |                                                                                                       |
| `gemini-3.1-pro-preview` | $2.00 (≤200k) / $4.00 (>200k) | $12.00 / $18.00 | —      | No free tier.                                                                                         |
| Gemma 4                  | —                             | —               | —      | Paid tier "Not available".                                                                            |

Source for all rows: [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing).

- PDF/document tokens are billed at the image token rate. — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- On Google's own comparison table, 3.5 Flash-Lite ($0.30 / $2.50) is listed against GPT-5.4 mini ($0.75 / $4.50) and Claude Haiku 4.5 ($1.00 / $5.00). — [3.5 Flash-Lite model card](https://deepmind.google/models/model-cards/gemini-3-5-flash-lite/)
- PricePerToken lists 3.8 Flash at "$0.375 / $1.875". This matches the Batch/Flex price, not Standard. — [PricePerToken](https://pricepertoken.com/endpoints/google-ai-studio/free) vs [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)

### Inferences

- **Cost per photo request is small at these prices.**
  - A typical photo-extraction request: one image (about 1,120 tokens), plus system prompt and tools (about 2–4K tokens), plus output and thinking (about 1–3K tokens).
  - On 3.5 Flash-Lite that is about $0.001–0.009.
  - On 3.8 Flash at introductory pricing it is about $0.004–0.014, doubling in 2027. 3.8 Flash may use more thinking tokens by design.
  - Even thousands of requests a month cost only a few dollars on Flash-Lite. This supports "free for dev, Tier 1 paid for production data" given the privacy terms above.
- **Watch the January 2027 step-up.** The 3.6/3.7/3.8 introductory pricing ends on 2026-12-31, so budgets should use the 2027 prices ($1.50 / $7.50).

### Gaps

- Batch and Flex prices for 3.7, 3.6 and 3.1 Flash-Lite were not extracted. They are likely also about 50% of Standard, as for 3.8 Flash and 3.5 Flash-Lite.
- Real token usage per request for this app's prompts and tools was not measured.
