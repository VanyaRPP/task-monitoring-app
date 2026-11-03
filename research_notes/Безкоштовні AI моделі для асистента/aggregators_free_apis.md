# Free LLM API access via aggregators and platform providers (state as of 2026-09-26)

> Research date: 2026-09-26. Live data was pulled on this date from OpenRouter's public models API, Cloudflare docs (markdown), the Z.ai pricing page, Mistral's pricing page and the npm registry. Anything older is flagged with its date.
>
> **Source warning:** `github.com/cheahjs/free-llm-api-resources` now returns **HTTP 404** (both the web page and the GitHub API, checked 2026-09-26). The last Wayback Machine snapshot is from **2026-08-06** ([archive](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)), and this report uses it as the "cheahjs (Aug 2026)" source. A lookalike repo, `nherx/free-llm-api-resources`, was pushed on 2026-09-26. It contains no provider data and only asks users to download a `.zip` from `raw/.../src/*.zip`, which is a common malware-lure pattern. **Do not use it.**

## Q1. Which strong models are free right now on each provider, and what are the exact limits?

### Takeaway

The free options have changed a lot since 2025:

- **GitHub Models is gone** (retired 2026-07-30).
- **OpenRouter's free list no longer has DeepSeek, Kimi, GLM or Llama 4.** Its 21 free models today are mostly Nemotron 3, Gemma 4 and Qwen3.8-27B, plus new or preview models (Inkling, Dots 3, a stealth model). The limit is still 20 RPM and 50 RPD (1000 RPD after a lifetime top-up of $10 or more).
- **The only frontier-class models that are truly free** are:
  - small daily allowances on Cloudflare (10k neurons/day). Kimi K2.6, GLM-5.x and DeepSeek V4 there need a paid billing method.
  - Z.ai's permanently free "Flash" models: GLM-4.7-Flash for text and GLM-4.6V-Flash for vision with native function calling.
  - Mistral's Free plan, which now shows "$10/mo in API credits".
  - NVIDIA build.nvidia.com at about 40 RPM, for trial use only.
  - Other providers give one-time trial credits.

### Cited Findings

**GitHub Models — RETIRED**

- GitHub Models was fully retired on **July 30, 2026**. "The playground, model catalog, inference API, and bring your own key (BYOK) are no longer available to any customer, including existing customers with active usage." The suggested alternatives are Microsoft Foundry and GitHub Copilot. The announcement does not mention a free Foundry tier. — [GitHub Changelog 2026-07-30](https://github.blog/changelog/2026-07-30-github-models-is-now-retired/)
- It was closed to new customers on 2026-06-16, with brownouts on July 16 and July 23, 2026. — [GitHub Changelog 2026-06-16](https://github.blog/changelog/2026-06-16-github-models-is-no-longer-available-to-new-customers/); [GitHub Changelog 2026-07-01](https://github.blog/changelog/2026-07-01-github-models-is-being-fully-retired-on-july-30-2026/)
- The GitHub docs page on prototyping and rate limits now only shows the retirement notice. The old tier and rate-limit tables are gone. — [docs.github.com](https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models)

**OpenRouter (`:free` models)**

- Free-model limits: **20 RPM**. **50 requests/day** if you have bought less than $10 of credits in total; **1,000 requests/day** once you have bought at least $10. Accounts with a negative balance can get payment errors "including for free models". Cloudflare DDoS protection blocks traffic that "dramatically exceeds reasonable usage". — [OpenRouter docs: Limits](https://openrouter.ai/docs/api-reference/limits)
- "Models share a common quota", so the 50/1000 RPD is shared across all free models. — [cheahjs (Aug 2026)](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)
- OpenRouter says free models have "low rate limits" and are "usually not suitable for production use". — [OpenRouter FAQ](https://openrouter.ai/docs/faq)
- **Live free list, 2026-09-26: 21 models with $0 pricing** (out of 458 total). Capabilities below come from `supported_parameters` and `input_modalities` in the API. — [OpenRouter models API](https://openrouter.ai/api/v1/models)

| Model (free)                                                                                                                                                                                                                                                                                                        | Context / max out | Tools                          | JSON schema (`structured_outputs`) | `response_format` | Image input       | Serving provider (endpoints API) |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------ | ---------------------------------- | ----------------- | ----------------- | -------------------------------- |
| `google/gemma-4-31b-it:free`                                                                                                                                                                                                                                                                                        | 262k / 32k        | yes                            | no                                 | yes               | image+video       | Google AI Studio                 |
| `google/gemma-4-26b-a4b-it:free`                                                                                                                                                                                                                                                                                    | 262k / 32k        | yes                            | no                                 | yes               | image+video       | —                                |
| `qwen/qwen3.8-27b:free` (dense VLM, added 2026-08-14)                                                                                                                                                                                                                                                               | 262k / 236k       | yes                            | **yes**                            | no                | image+video       | ModelRun, **fp4** quant          |
| `thinkingmachines/inkling:free` (975B MoE, 41B active; added 2026-07-17)                                                                                                                                                                                                                                            | 1M / 262k         | yes (`tool_choice` not listed) | no                                 | no                | image+audio       | Thinking Machines, nvfp4         |
| `thinkingmachines/inkling-small:free`                                                                                                                                                                                                                                                                               | 1M / 262k         | yes                            | no                                 | no                | image+audio       | —                                |
| `dots-studio/dots-3-note-preview:free` (280B MoE, 16B active; "preview")                                                                                                                                                                                                                                            | 512k / 461k       | yes                            | **yes**                            | yes               | image             | AtlasCloud, fp8                  |
| `nvidia/nemotron-3-ultra-550b-a55b:free`                                                                                                                                                                                                                                                                            | 1M / 65k          | yes                            | no                                 | no                | text only         | Nvidia                           |
| `nvidia/nemotron-3-super-120b-a12b:free`                                                                                                                                                                                                                                                                            | 262k / 236k       | yes                            | **yes**                            | yes               | text only         | Nvidia                           |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`                                                                                                                                                                                                                                                                | 256k / 65k        | yes                            | no                                 | no                | image+audio+video | —                                |
| `nvidia/nemotron-3.5-lightning:free`                                                                                                                                                                                                                                                                                | 1M / 65k          | yes                            | no                                 | no                | text              | —                                |
| `stealth/space-bunny-alpha` (anonymous stealth model, added 2026-09-23)                                                                                                                                                                                                                                             | 1M / 524k         | yes                            | no                                 | yes               | image+video       | "Stealth"                        |
| `openrouter/free` (router that picks a free model at random)                                                                                                                                                                                                                                                        | 200k              | yes                            | yes                                | yes               | image             | router                           |
| others: `cohere/north-mini-code:free`, `poolside/laguna-s-2.1:free`, `poolside/laguna-xs-2.1:free`, `inclusionai/ling-3.0-flash-fin:free`, `inclusionai/ling-3.0-flash-sante:free`, `liquid/lfm-2.5-2.6b:free` (all text-only with tools); `nvidia/nemotron-3.5-content-safety:free`, `google/lyria-3-*` (no tools) |                   |                                |                                    |                   |                   |                                  |

- Endpoint status on 2026-09-26, uptime over the last 30 minutes: Gemma 4 31B free 100%, Qwen3.8-27B free 100%, Nemotron 3 Ultra free ~98.3%, Inkling free ~99.8%. — [OpenRouter endpoints API](https://openrouter.ai/api/v1/models/google/gemma-4-31b-it:free/endpoints)
- **Not free on OpenRouter today** (paid prices per 1M tokens, input/output):
  - `deepseek/deepseek-v4-flash-0731`: $0.021 / $0.32
  - `moonshotai/kimi-k2.6`: $0.95 / $4.00 (text+image)
  - `z-ai/glm-5.3-flash`: $0.04 / $0.50 (text+image+video)
  - `google/gemma-4-31b-it` (paid version): $0.09 / $0.34
  - `qwen/qwen3.8-27b` (paid version): $0.42 / $3.00

  — [OpenRouter models API](https://openrouter.ai/api/v1/models)

**Mistral (La Plateforme / "Studio")**

- The Free plan on Mistral's pricing page lists "Test Mistral models in Studio" and "**$10 /mo in API credits**". The model-training row for the plans reads "Opt-out". — [mistral.ai/pricing](https://mistral.ai/pricing) (retrieved 2026-09-26)
- The docs say: "**Free mode** lets you create API keys and use included monthly usage within the limits shown on the Limits page. Pay-as-you-go lets you extend usage beyond included monthly usage." Completion limits are set per model, as tokens/minute and requests/second. OCR has its own pages-per-minute limits. The docs publish no numbers; you check them in Admin Panel › API › Limits. — [Mistral Docs: Usage and limits](https://docs.mistral.ai/admin/user-management-finops/tier)
- As of July 2026, a new free account saw "anywhere from 25,000 to 20,000,000 tokens/minute and 0.03 to 12.5 requests/second depending on the model". Phone verification is required. — [cheahjs (Aug 2026)](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)
- The latest models listed on the site are **Mistral OCR 4, Mistral Medium 3.5 and Mistral Small 4**. OCR is priced per 1,000 pages. — [mistral.ai/pricing](https://mistral.ai/pricing)
- Codestral (a separate endpoint) was free with 30 RPM and 2,000 RPD, with phone verification (as of Aug 2026). — [cheahjs (Aug 2026)](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)

**Cloudflare Workers AI**

- The free allocation is "**10,000 Neurons per day at no charge**" on both Workers Free and Workers Paid. Above that, usage costs $0.011 per 1,000 neurons, and only on Workers Paid. — [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- "Some models require a paid billing method": `@cf/moonshotai/kimi-k2.6`, `kimi-k2.7-code`, `@cf/zai-org/glm-5.2`, `glm-5.3`, `glm-5.3-flash`, `@cf/deepseek-ai/deepseek-v4-flash-0731` and `deepseek-v4-pro-0813`. These need Workers Paid or prepaid AI Gateway credits. — [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- Neuron costs per 1M input / 1M output tokens for relevant models that are free-eligible, with capabilities from each model page:
  - `@cf/openai/gpt-oss-120b`: 31,818 / 68,182 — Function calling, Reasoning, 128k context — [model page](https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/)
  - `@cf/google/gemma-4-26b-a4b-it`: 9,091 / 27,273 — **Function calling + Vision + Reasoning, 256k** — [model page](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/)
  - `@cf/qwen/qwen3.8-27b`: 40,909 / 290,909 — **Function calling + Vision + Reasoning, 262k** — [model page](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/)
  - `@cf/meta/llama-4-scout-17b-16e-instruct`: 24,545 / 77,273 — **Function calling + Vision, 131k** — [model page](https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/)
  - `@cf/mistralai/mistral-small-3.1-24b-instruct`: 31,876 / 50,488 — **Function calling + vision, 128k** — [model page](https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/)
  - `@cf/zai-org/glm-4.7-flash`: 5,500 / 36,400 — Function calling, Reasoning, 131k ("multi-turn tool calling across 100+ languages") — [model page](https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/)
  - `@cf/nvidia/nemotron-3-120b-a12b`: 45,455 / 136,364 — [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
  - `@cf/moonshotai/kimi-k2.5`: 54,545 / 272,727. It is still in the pricing table and not on the "paid billing method" list, but its model page returned no content. — [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
  - Vision-only option: `moondream3.1-9B-A2B` ("OCR, and structured output"). — [Cloudflare models catalog](https://developers.cloudflare.com/workers-ai/models/)
- The catalog describes Kimi K2.6 and K2.7 as having "multi-turn tool calling, vision inputs, and structured outputs", and GLM-5.3 as having "function calling, and structured outputs". All of these need a paid billing method. — [Cloudflare models catalog](https://developers.cloudflare.com/workers-ai/models/)

**NVIDIA NIM (build.nvidia.com)**

- Phone verification is required, the limit is **40 requests/minute**, and "Models tend to be context window limited" (Aug 2026). — [cheahjs (Aug 2026)](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)
- In 2026, developers are still posting forum requests to raise the default from 40 RPM to 200 RPM. Some of these threads still mention "1,000 → 5,000 credits". — [NVIDIA Developer Forums](https://forums.developer.nvidia.com/t/request-to-increase-nvidia-nim-api-rate-limit-from-40-rpm-to-200rpm/379705); [forum thread](https://forums.developer.nvidia.com/t/credit-rate-limit-increase-request-1-000-5-000-credits-40-200-rpm/380932)
- Secondary sources say the credit system was dropped and that per-model limits are not published. — [decodethefuture.org](https://decodethefuture.org/en/nvidia-nim-api-pricing-limits-guide/) (secondary; not confirmed on an NVIDIA page)
- Trial Terms (v. September 19, 2025), §1.2: access is "for limited trial purposes only and without use of the API Service or Generated Content in production". Production needs a paid subscription or a service provider. — [NVIDIA API Trial Terms of Service (PDF)](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf)

**Hugging Face Inference Providers**

- Free users get "$0.10, subject to change" per month. PRO users get $2.00, and Team/Enterprise get $2.00 per seat. Credits only apply to requests _routed by HF_, not to requests made with a custom provider key. After the credits run out you can keep going by buying credits. HF says it passes provider prices through with "no additional fees". — [HF docs: Pricing](https://huggingface.co/docs/inference-providers/pricing)

**Vercel AI Gateway** (relevant because the app uses the AI SDK)

- "The free tier includes a subset of models, not the full catalog". Free-tier requests are "rate limited per model, with lower limits than the paid tier". "Once you purchase credits, your account transitions to the paid tier and the monthly free credit no longer applies." BYOK is paid-tier only. Page last updated 2026-09-08. — [Vercel docs: AI Gateway Pricing](https://vercel.com/docs/ai-gateway/pricing)
- The rate-limits page says: "Limits can change, so this page describes behavior rather than fixed numbers". It shows the free tier with a "Monthly included credit". — [Vercel docs: AI Gateway Rate Limits](https://vercel.com/docs/ai-gateway/rate-limits)
- The monthly amount was **$5/month** as of Aug 2026. — [cheahjs (Aug 2026)](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)

**Z.ai / Zhipu (GLM)**

- On the official pricing page (retrieved 2026-09-26), **GLM-4.7-Flash**, **GLM-4.5-Flash** and the vision model **GLM-4.6V-Flash** are listed as **Free** for input, cached input and output. GLM-5.3-Flash is paid ($0.15/M input, $0.50/M output; only cached-input _storage_ is "Limited-time Free"). GLM-4.6V-FlashX and GLM-4.7-FlashX are paid. — [docs.z.ai pricing](https://docs.z.ai/guides/overview/pricing)
- GLM-4.6V-Flash is described as "the first visual model to natively integrate Function Call capability", with 128k context. — [zai-org/GLM-V (GitHub)](https://github.com/zai-org/GLM-V)
- Third-party listings say the free tier allows **1 concurrent request** and up to 4K output tokens. — [freellm.net](https://freellm.net/models/z-ai-zhipu-ai/glm-4-6v-flash) (secondary)

**Cohere (trial key)**

- Trial keys: **20 req/min** on chat, and "Trial keys ... are limited to **1,000 API calls a month**". The free "evaluation keys" are separate from paid "production keys". — [Cohere docs: Rate limits](https://docs.cohere.com/docs/rate-limits)
- Models available as of Aug 2026 include `command-a-vision-07-2025`, `command-a-plus-05-2026`, `command-a-reasoning-08-2025` and `c4ai-aya-vision-32b`. — [cheahjs (Aug 2026)](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)

**Chutes — free tier discontinued**

- The Early Access perk of "200 requests per day for free" stayed "available for all non-TEE models until **March 15** [2026], at which point the plan will be fully retired". Paid subscriptions are Base $3, Plus $10 and Pro $20 per month, with a usage allowance of "5× the equivalent Pay-As-You-Go value". — [Chutes announcement, 2026-02-27](https://chutes.ai/news/community-announcement-february)

**Together AI — no free tier**

- A secondary source says there is no free tier and "$5 in free credits on signup", and that the earlier $25 credit was retired in July 2025. — [eesel.ai](https://www.eesel.ai/blog/together-ai-pricing) (secondary; the signup credit is not confirmed on together.ai)

**Trial-credit providers (one-time, as of Aug 2026)** — [cheahjs (Aug 2026)](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)

- **Alibaba Cloud Model Studio (International):** "1 million tokens/model, valid for 90 days (Singapore endpoint only)". Covers Qwen open and proprietary models, including Qwen-VL.
- **Scaleway Generative APIs:** 1,000,000 free tokens in total. Models include `qwen3.5-397b-a17b`, `qwen3-235b-a22b-instruct-2507`, `mistral-medium-3.5-128b`, `mistral-small-3.2-24b-instruct-2506` (vision), `pixtral-12b-2409`, `gemma-3-27b`, `glm-5.2`, `gpt-oss-120b` and `devstral-2-123b`.
- **SambaNova:** $5 for 3 months (deepseek-v3.1/v3.2, gpt-oss-120b, gemma-4-31b-it, minimax-m2.7).
- **Others:** Fireworks $1, Nebius $1, Novita $0.5, Hyperbolic $1, AI21 $10 for 3 months, Upstage $10 for 3 months, Baseten $30, Modal $30/month.

**Other notable free options (as of Aug 2026; direct providers, which may overlap with other researchers)** — [cheahjs (Aug 2026)](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)

- **Google AI Studio:**
  - Gemini 3.6 / 3.5 / 3 Flash: only **20 requests/day**, 5 RPM.
  - Gemini 3.5 / 3.1 Flash-Lite: 500 RPD, 15 RPM.
  - **Gemma 4 31B and 26B-A4B: 14,400 RPD, 30 RPM, 16k TPM.**
  - "Data is used for training when used outside of the UK/CH/EEA/EU."
- **Groq:** `openai/gpt-oss-120b` at 1,000 RPD and 8,000 TPM; `qwen/qwen3.6-27b` at 1,000 RPD and 8,000 TPM; Llama 3.3 70B at 1,000 RPD and 12k TPM.
- **Cerebras:** `gpt-oss-120b`, `zai-glm-4.7` and `gemma-4-31b`, each at 5 RPM, 30k TPM and 1M tokens/day.
- **Kilo Gateway:** free models without an account, 200 requests/hour per IP. "All free models may use your prompts for training."
- **OpenCode Zen:** free "DeepSeek V4 Flash Free", "MiMo-V2.5 Free" and others. "Free models may use data for improvement."

### Inferences

- **How far 10k Cloudflare neurons go** (my own arithmetic from the neuron rates above). Assume one step uses about 6,000 input tokens (system prompt plus tool schemas plus history) and 500 output tokens:
  - gemma-4-26b-a4b: ≈68 neurons, so about 145 steps/day
  - glm-4.7-flash: ≈51 neurons, about 195 steps/day
  - llama-4-scout: ≈186 neurons, about 53 steps/day
  - gpt-oss-120b: ≈225 neurons, about 44 steps/day
  - mistral-small-3.1: ≈216 neurons, about 46 steps/day
  - qwen3.8-27b: ≈390 neurons, about 25 steps/day. Reasoning tokens inflate the output side, and output is expensive on this model.

  A multi-step tool loop uses 2–4 steps per user action, so real capacity is roughly a quarter to a half of these numbers. Images add input tokens.

- **Best truly-free vision + tool-calling candidates for photo-only extraction:**
  - Gemma 4 (31B on OpenRouter free; 26B on Cloudflare; direct from Google AI Studio at 14.4k RPD)
  - Qwen3.8-27B (OpenRouter free at fp4, or Cloudflare)
  - GLM-4.6V-Flash (Z.ai, free)
  - Llama 4 Scout and Mistral Small 3.1 (Cloudflare)
  - Inkling (OpenRouter free; very large, but new)
  - Mistral OCR 4 and Medium 3.5 via the $10/mo Mistral credits, if confirmed to apply to the API
- **Best truly-free text tool-calling candidates:** Nemotron 3 Ultra 550B and Super 120B (OpenRouter free; also NVIDIA build), GLM-4.7-Flash (Z.ai free / Cloudflare), gpt-oss-120b (Cloudflare, Groq, Cerebras), and Mistral models through the free credits. Frontier open models (Kimi K2.6, GLM-5.x, DeepSeek V4) are not free anywhere I checked. They are cheap on OpenRouter, for example DeepSeek V4 Flash at $0.021 / $0.32 per M.
- On OpenRouter, a $10 top-up does double duty. It raises the free-model cap from 50 to 1000 RPD, and the same credits pay for cheap strong paid models (DeepSeek V4 Flash, GLM-5.3-Flash) as fallbacks.

### Gaps

- Exact Mistral Free-mode per-model limits are not published; they only appear in each account's Admin Panel. It is also unconfirmed whether the "$10/mo in API credits" covers Mistral OCR 4 and Document AI calls. I could not load the old help article "How can I try the API for free with the Experiment plan" (404).
- The Vercel AI Gateway monthly free credit amount ($5) and the list of free-tier-eligible models could not be confirmed on a Vercel page in September 2026. The models API has no free-tier flag.
- NVIDIA per-model limits and the current list of free models on build.nvidia.com: NVIDIA publishes no official limit table. The 40 RPM figure comes from cheahjs and forum posts.
- Z.ai free-model rate limits (concurrency, RPD) come only from third-party listings.
- Together AI's current signup credit is unverified on together.ai.
- Alibaba, Scaleway and SambaNova figures are from the Aug 2026 snapshot and were not re-verified.

## Q2. How reliable is tool calling on each provider, and is structured output (JSON schema) supported?

### Takeaway

On OpenRouter, almost every free model now advertises `tools`. Only a few advertise strict JSON-schema `structured_outputs`: `qwen3.8-27b:free`, `nemotron-3-super:free`, `dots-3-note-preview:free`, `lfm-2.5` and the `openrouter/free` router. Gemma 4 free supports `response_format` (JSON mode) but not `structured_outputs`. Cloudflare marks "Function calling" per model, and Gemma 4, Qwen3.8, Llama 4 Scout, Mistral Small 3.1, GLM-4.7-Flash and gpt-oss-120b all have it. GitHub Models token caps no longer matter because the service is gone.

### Cited Findings

- Per-model flags from the OpenRouter API are in the table in Q1. `tools` is present on 19 of 21 free models; `nemotron-3.5-content-safety` and `lyria-3-*` do not have it. `structured_outputs` is present only on `dots-3-note-preview`, `liquid/lfm-2.5-2.6b`, `nemotron-3-super-120b`, `openrouter/free` and `qwen3.8-27b`. `thinkingmachines/inkling:free` lists `tools` but not `tool_choice`. — [OpenRouter models API](https://openrouter.ai/api/v1/models); [endpoints API](https://openrouter.ai/api/v1/models/thinkingmachines/inkling:free/endpoints)
- Quantization of free endpoints: Qwen3.8-27B free runs at **fp4** on ModelRun, Inkling at nvfp4 and Dots 3 at fp8. — [OpenRouter endpoints API](https://openrouter.ai/api/v1/models/qwen/qwen3.8-27b:free/endpoints)
- Each free model has exactly one serving provider, for example Google AI Studio for Gemma 4 31B and Nvidia for Nemotron. So a free model has no fallback provider inside OpenRouter. — [OpenRouter endpoints API](https://openrouter.ai/api/v1/models/google/gemma-4-31b-it:free/endpoints)
- `openrouter/free` "selects free models at random from the models available on OpenRouter". — [OpenRouter models API](https://openrouter.ai/api/v1/models)
- Cloudflare model pages carry explicit "Function calling", "Vision" and "Reasoning" badges for: gemma-4-26b-a4b-it (FC, Vision, Reasoning, 256k), qwen3.8-27b (FC, Vision, Reasoning, 262k), llama-4-scout (FC, Vision, 131k), mistral-small-3.1 (FC, vision, 128k), gpt-oss-120b (FC, Reasoning, 128k) and glm-4.7-flash (FC, Reasoning, 131k). — [Cloudflare model pages](https://developers.cloudflare.com/workers-ai/models/)
- Kimi K2.6 and GLM-5.3 on Cloudflare advertise structured outputs, but they need a paid billing method. — [Cloudflare models catalog](https://developers.cloudflare.com/workers-ai/models/)
- Mistral documents Function Calling, Vision and Document AI "Annotations", which extract data "in a structured json-format that you provide", on its platform. — [Mistral docs llms.txt index](https://docs.mistral.ai/llms.txt)
- GLM-4.6V-Flash has native function calling in its vision model. — [zai-org/GLM-V](https://github.com/zai-org/GLM-V)

### Inferences

- With AI SDK `generateObject` / `Output.object`, prefer models that support `structured_outputs`, or fall back to tool-based JSON extraction. The model has to support either JSON-schema output or tools. For photo-only extraction, `qwen3.8-27b:free` (vision + tools + structured outputs) is the only free OpenRouter model that has all three. It is served at fp4, and fp4 might hurt Cyrillic OCR accuracy (not verified).
- If `openrouter/free` or random routing is used, behaviour will vary from request to request, including tool-call formats. Pin explicit model IDs for multi-step tool loops.
- Free endpoints that depend on a single provider (Gemma 4 free runs on Google AI Studio's free capacity) are likely to return upstream 429s at peak times. Build a fallback chain.

### Gaps

- I found no independent 2026 benchmark of tool-calling reliability for these specific free endpoints (Nemotron 3 Ultra, Inkling, Qwen3.8, Gemma 4) on Ukrainian or Cyrillic input.
- I also found none on Cyrillic OCR accuracy of fp4 or nvfp4 quantized free endpoints versus full precision.
- There is no public data on how often Cloudflare's Workers AI function calling fails with parallel tool calls.

## Q3. Data privacy: which free endpoints log or train on prompts?

### Takeaway

Almost every free tier keeps the right to use your data:

- **NVIDIA's** trial terms allow using inputs and outputs "to improve NVIDIA products and services, including AI models".
- **Mistral's** free plan shows training as "Opt-out". An Aug 2026 source said the free tier _requires_ opting in, so the two sources conflict.
- **Google AI Studio's** free tier trains on data outside the EU/UK/CH, and that includes Ukraine.
- **Kilo and OpenCode** free models may train on prompts.
- **OpenRouter** says it retains prompts only if you opt in, but free-model _providers_ have their own policies, controlled by separate "free model" privacy settings.

For real tenant or billing data (names, addresses, debts), none of the free endpoints should be treated as private.

### Cited Findings

- NVIDIA API Trial Terms §3.3: "NVIDIA will collect ... (iv) User Content and Generated Content to improve NVIDIA products and services, including AI models. Your use of the API Services will be logged for security, fraud or abuse monitoring and shared with third party service providers for this purpose." (v. September 19, 2025) — [NVIDIA API Trial Terms (PDF)](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf)
- OpenRouter: "Any prompt retention on OpenRouter is always opt-in. OpenRouter has never shared, sold, or licensed underlying prompt data to any third party. We document which providers may capture data for training". — [OpenRouter: Data collection](https://openrouter.ai/docs/guides/privacy/data-collection)
- OpenRouter lets you choose whether to "allow routing to providers that may train on your data", with "separate settings for paid and free models". "If you opt out of training in your account settings, OpenRouter will not route to providers that train." — [OpenRouter: Provider logging](https://openrouter.ai/docs/guides/privacy/provider-logging)
- Mistral pricing page: model training shows "Opt-out" across the consumer and Studio plans (Free/Pro/Team). — [mistral.ai/pricing](https://mistral.ai/pricing)
- A Mistral help article says for API services: "Customers retain full control over this processing and have the right to opt out at any time" (toggle "Anonymous improvement data"). — [Mistral Help Center](https://help.mistral.ai/en/articles/455207-can-i-opt-out-of-my-input-or-output-data-being-used-for-training)
- Contradiction: cheahjs (Aug 2026) says "Free tier (Experiment plan) requires opting into data training". — [cheahjs (Aug 2026)](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)
- Google AI Studio free tier: "Data is used for training when used outside of the UK/CH/EEA/EU." — [cheahjs (Aug 2026)](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)
- Kilo Gateway: "All free models may use your prompts for training." OpenCode Zen: "Free models may use data for improvement." — [cheahjs (Aug 2026)](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)
- Vercel AI Gateway: Zero Data Retention is "Pro and Enterprise" only, and the per-request `only` provider filter is available on all plans. — [Vercel docs: AI Gateway Pricing](https://vercel.com/docs/ai-gateway/pricing)
- GitHub Models' privacy terms no longer apply because the service is retired. — [GitHub Changelog](https://github.blog/changelog/2026-07-30-github-models-is-now-retired/)

### Inferences

- `google/gemma-4-31b-it:free` on OpenRouter is served by the "Google AI Studio" provider. Google's free-tier training policy for requests from outside the EU therefore probably applies to it. This is not confirmed; OpenRouter's per-provider data table did not load.
- Stealth models such as `stealth/space-bunny-alpha` are anonymous and usually exist to collect feedback. Treat them as logged.
- The app handles PII of Ukrainian residents: debtor lists, bank statements, meter readings. A privacy-conscious setup would use paid endpoints with no-training or ZDR terms for production, and free endpoints only for development or anonymized data.

### Gaps

- OpenRouter's per-provider data-policy table (training and retention for each free endpoint: ModelRun, AtlasCloud, Nvidia, Thinking Machines, Stealth) did not render. The endpoints API has no data-policy field.
- The Z.ai, Cloudflare Workers AI and Hugging Face routed-provider data-training policies for free usage were not checked in this pass.
- Whether Mistral's current "Free mode" API requires training opt-in could not be confirmed from a primary source; the relevant help article returns 404.

## Q4. Vercel AI SDK provider availability, and which versions work with `ai` ^6

### Takeaway

**`ai` v7 is now `latest` (7.0.116), and the app pins `ai` ^6.0.175.** A plain `npm i` of many providers will install v7-only majors. Use the `ai-v6` dist-tags, or pin the last v6 majors: `@openrouter/ai-sdk-provider@2.x` and `workers-ai-provider@3.x`.

### Cited Findings (npm registry, retrieved 2026-09-26)

- The project's `package.json` has `"ai": "^6.0.175"`, `"@ai-sdk/google": "^3.0.67"`, `"@ai-sdk/groq": "3.0.52"` and `"zod": "^4.4.3"` (local repo file).
- `ai` dist-tags: `latest: 7.0.116`, `ai-v6: 6.0.292`. — [npm: ai](https://www.npmjs.com/package/ai)
- `@openrouter/ai-sdk-provider`: `latest` 3.1.0 has peer `ai ^7.0.0`. **2.10.0 (2026-06-26) has peer `ai ^6.0.0`**; 3.0.0 came out on 2026-07-06. — [npm](https://www.npmjs.com/package/@openrouter/ai-sdk-provider)
- `workers-ai-provider` (Cloudflare): `latest` 4.0.0 (2026-07-22) has peer `ai ^7.0.0`. **3.3.1 has peer `ai ^6.0.0`**. — [npm](https://www.npmjs.com/package/workers-ai-provider)
- The official `@ai-sdk/*` packages publish an `ai-v6` dist-tag:

  | Package                               | `ai-v6` tag | `latest` (v7) |
  | ------------------------------------- | ----------- | ------------- |
  | `@ai-sdk/mistral`                     | 3.0.67      | 4.0.52        |
  | `@ai-sdk/openai-compatible`           | 2.0.78      | 3.0.57        |
  | `@ai-sdk/togetherai`                  | 2.0.84      | 3.0.58        |
  | `@ai-sdk/deepinfra`                   | 2.0.82      | —             |
  | `@ai-sdk/cerebras`                    | 2.0.84      | —             |
  | `@ai-sdk/groq`                        | 3.0.69      | —             |
  | `@ai-sdk/google`                      | 3.0.127     | —             |
  | `@ai-sdk/huggingface`                 | 1.0.80      | —             |
  | `@ai-sdk/alibaba`                     | 1.0.59      | —             |
  | `@ai-sdk/zai`                         | 2.0.6       | —             |
  | `@ai-sdk/cohere`                      | 3.0.64      | —             |
  | `@ai-sdk/gateway` (Vercel AI Gateway) | 3.0.202     | —             |

  Also available: `@ai-sdk/fireworks` 3.0.60 and `@ai-sdk/baseten` 2.1.35 (latest). The `latest` majors depend on `@ai-sdk/provider` 4.x, the v7 spec. — [npm registry](https://www.npmjs.com/package/@ai-sdk/mistral)

- Community `zhipu-ai-provider` 0.4.0 depends on `@ai-sdk/provider ^3.0.3`, which is v6-era. — [npm](https://www.npmjs.com/package/zhipu-ai-provider)
- There is no `@ai-sdk/nvidia` package (npm returned nothing). — [npm registry](https://www.npmjs.com/package/@ai-sdk/nvidia)

### Inferences

- Mapping for `ai` ^6:

  | Provider                       | Package to use                                                                                                    |
  | ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
  | OpenRouter                     | `@openrouter/ai-sdk-provider@^2.10.0`                                                                             |
  | Cloudflare                     | `workers-ai-provider@^3.3.1` (or the Cloudflare OpenAI-compatible endpoint via `@ai-sdk/openai-compatible@ai-v6`) |
  | Mistral                        | `@ai-sdk/mistral@ai-v6`                                                                                           |
  | Z.ai                           | `@ai-sdk/zai@ai-v6`                                                                                               |
  | HF                             | `@ai-sdk/huggingface@ai-v6`                                                                                       |
  | Alibaba                        | `@ai-sdk/alibaba@ai-v6`                                                                                           |
  | Cohere                         | `@ai-sdk/cohere@ai-v6`                                                                                            |
  | Vercel Gateway                 | `@ai-sdk/gateway@ai-v6`                                                                                           |
  | NVIDIA, Scaleway, Kilo, others | `@ai-sdk/openai-compatible@ai-v6` with the vendor's OpenAI-compatible base URL (base URLs not verified here)      |

- Upgrading the app to AI SDK v7 would unlock the `latest` providers, but that is a separate migration.

### Gaps

- I did not check the AI SDK community-providers page (ai-sdk.dev) for an official NVIDIA or Kilo provider.
- I did not verify that `workers-ai-provider@3.x` supports vision input and tool calls for the Gemma 4 and Qwen3.8 models on Cloudflare.

## Q5. Stability: how often do free models disappear, and what do the terms say about production use?

### Takeaway

Churn is high:

- GitHub Models was shut down with about six weeks' notice.
- Chutes ended its free tier (March 2026).
- The cheahjs list itself vanished (404 by September 2026).
- About a quarter of OpenRouter's free list turned over in seven weeks.

NVIDIA's terms explicitly forbid production use. Cohere separates evaluation keys from production keys, and OpenRouter calls free models "usually not suitable for production". Free tiers are fine for development or as a last-resort fallback. They should not be the main path for a billing app.

### Cited Findings

- OpenRouter free list, 2026-08-06 → 2026-09-26:
  - **Removed:** `openai/gpt-oss-20b:free`, `nvidia/nemotron-nano-12b-v2-vl:free`, `nvidia/nemotron-nano-9b-v2:free`, `nvidia/nemotron-3-nano-30b-a3b:free`, `inclusionai/ling-3.0-flash:free` (replaced by `-fin` and `-sante` variants).
  - **Added:** `qwen3.8-27b:free`, `thinkingmachines/inkling:free`, `inkling-small:free`, `dots-3-note-preview:free`, `nemotron-3.5-lightning:free`, `lfm-2.5-2.6b:free`, `stealth/space-bunny-alpha`.

  — compare [cheahjs (Aug 2026)](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources) with the [OpenRouter models API (2026-09-26)](https://openrouter.ai/api/v1/models)

- GitHub Models: closed to new customers 2026-06-16, then fully retired 2026-07-30. — [GitHub Changelog](https://github.blog/changelog/2026-06-16-github-models-is-no-longer-available-to-new-customers/); [GitHub Changelog](https://github.blog/changelog/2026-07-30-github-models-is-now-retired/)
- Chutes: the free 200 RPD perk was "fully retired" after March 15, 2026. — [Chutes, 2026-02-27](https://chutes.ai/news/community-announcement-february)
- NVIDIA: "limited trial purposes only and without use of the API Service or Generated Content in production". Pre-release versions are "not intended for use in production or business-critical systems". — [NVIDIA API Trial Terms (PDF)](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf)
- OpenRouter: free models are "usually not suitable for production use". — [OpenRouter FAQ](https://openrouter.ai/docs/faq)
- Cohere: "evaluation keys (free but limited in usage)" versus "production keys (paid ...)". — [Cohere docs: Rate limits](https://docs.cohere.com/docs/rate-limits)
- Z.ai: FlashX variants and cached-input storage are "Limited-time Free", while the Flash models are plain "Free". — [docs.z.ai pricing](https://docs.z.ai/guides/overview/pricing)
- Vercel: "Limits can change, so this page describes behavior rather than fixed numbers." — [Vercel docs: Rate Limits](https://vercel.com/docs/ai-gateway/rate-limits)
- Mistral: "API access can be suspended" if spending limits are reached. Free-mode limits are shown only in the Admin Panel. — [Mistral Docs](https://docs.mistral.ai/admin/user-management-finops/tier)
- The cheahjs repo returned 404 on 2026-09-26 (GitHub API `repos/cheahjs/free-llm-api-resources` → 404). Its last archive is from 2026-08-06. — [Wayback](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)

### Inferences

- A robust design is a provider-agnostic fallback chain (AI SDK makes this easy) with model IDs in config, so they can be swapped when free models disappear. A cheap paid tier, such as OpenRouter paid DeepSeek V4 Flash or GLM-5.3-Flash, or Mistral credits, can be the reliable baseline, with free models used opportunistically.
- A 50 RPD free OpenRouter quota shared by all users of a multi-tenant app would run out after a few multi-step sessions. The $10 top-up (1000 RPD) is the minimum for real use.

### Gaps

- There is no published statistic on how long OpenRouter free models typically stay free. The churn above is one 7-week window.
- I could not find Cloudflare's or Z.ai's terms on production use of free allocations or free models in this pass.
