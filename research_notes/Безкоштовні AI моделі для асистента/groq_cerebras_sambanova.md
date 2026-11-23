# Free tiers of fast-inference LLM providers (Groq, Cerebras, SambaNova Cloud), as of 26 Sept 2026: tool calling and vision for an in-app assistant

Scope: the free-tier model list, limits, tool calling, structured output and vision support for each provider, plus benchmarks, AI SDK v6 providers, privacy and model ID stability. The app currently uses `@ai-sdk/groq` with `openai/gpt-oss-120b`.

Method note: most facts come from the providers' live docs, fetched on 2026-09-26. Where the facts come from an aggregator, a search snippet or an older page, the item says so.

---

## 1. Groq: current free-tier models, limits and capabilities (vision, structured outputs, tool use), gpt-oss issues, deprecations

### Takeaway

As of Sept 2026, the Groq free tier has only four chat LLMs: `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `openai/gpt-oss-safeguard-20b` and `qwen/qwen3.8-27b` (preview). Each has the same limits: 30 RPM, 1K RPD, 8K TPM and 200K TPD. Of these, only `qwen/qwen3.8-27b` accepts images. It also supports tool use, parallel tool calls, strict JSON-schema output and a switchable reasoning mode. Kimi K2, Llama 4 Scout/Maverick, Llama 3.x and Qwen3-32B have all been removed from the free tier. gpt-oss is text-only on Groq, does not support parallel tool calls, and has a documented history of `tool_use_failed` / "Failed to parse tool call arguments as JSON" errors.

### Cited Findings

**Free-tier rate limits (fetched 2026-09-26; the page notes "there may be exceptions to these limits")**

- Free plan table, all LLMs: `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `openai/gpt-oss-safeguard-20b` and `qwen/qwen3.8-27b` each have **30 RPM / 1K RPD / 8K TPM / 200K TPD**. Other free entries: `meta-llama/llama-prompt-guard-2-22m/86m` (30 RPM, 14.4K RPD, 15K TPM, 500K TPD); `whisper-large-v3` and `whisper-large-v3-turbo` (20 RPM, 2K RPD, 7.2K ASH, 28.8K ASD); Orpheus TTS (10 RPM, 100 RPD). No other LLM is on the free table. `minimaxai/minimax-m2.7`, `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` are absent. — [Groq Rate Limits](https://console.groq.com/docs/rate-limits)

**Current model catalogue (fetched 2026-09-26)**

- Production: `llama-3.1-8b-instant` (131K context, "Contact sales"), `llama-3.3-70b-versatile` (131K context / 32K output, "Contact sales"), `openai/gpt-oss-120b` (131K context / 65,536 output, ~500 T/s, $0.15 in / $0.60 out per 1M, with browser search, code execution and reasoning), `openai/gpt-oss-20b` (131K / 65,536, ~1,000 T/s, $0.075 / $0.30), and Whisper. — [Groq Models](https://console.groq.com/docs/models)
- Preview: `minimaxai/minimax-m2.7` (196,608 context / 131,072 output, ~260 T/s, "Contact sales"), `openai/gpt-oss-safeguard-20b`, `qwen/qwen3.8-27b` (131,072 context / **16,384 max output**, ~450 T/s, $0.80 in / $4.00 out per 1M) and Orpheus TTS. — [Groq Models](https://console.groq.com/docs/models)
- The Groq changelog's only 2026 entry (April 18, 2026) adds `minimaxai/minimax-m2.5` and `qwen/qwen3-vl-32b-instruct` "for Enterprise workloads". Neither appears on the current public model list or the free table. — [Groq Changelog](https://console.groq.com/docs/changelog)

**qwen/qwen3.8-27b on Groq (the only free vision model)**

- Status is **Preview**. Input is text and images: up to **3 images per request**, a 20 MB maximum for requests with an image URL, and **each image counts as 2,048 input tokens**. Output is text. Features: tool use, JSON Object Mode, JSON Schema Mode, reasoning and vision. — [Groq model page: qwen3.8-27b](https://console.groq.com/docs/model/qwen/qwen3.8-27b); [Groq Vision docs](https://console.groq.com/docs/vision)
- Reasoning controls: `reasoning_effort` accepts "default" (thinking), "low", "medium", "high" or "none" (instruct mode). `reasoning_format` accepts "hidden" or "parsed". Recommended sampling for thinking mode is temp 1.0, top_p 0.95, top_k 20. For instruct mode it is temp 0.7, top_p 0.8, top_k 20, presence_penalty 1.5. — [Groq model page: qwen3.8-27b](https://console.groq.com/docs/model/qwen/qwen3.8-27b)
- The Vision docs name `qwen/qwen3.8-27b` as the only supported vision model. They show tool calling with image input (inferring a location from an image and then calling a weather tool) and JSON output from image analysis. — [Groq Vision docs](https://console.groq.com/docs/vision)

**Structured outputs**

- Strict mode (`strict: true`, constrained decoding) works on `openai/gpt-oss-20b`, `openai/gpt-oss-120b` and `qwen/qwen3.8-27b`. Best-effort mode (`strict: false`) works on those three plus `openai/gpt-oss-safeguard-20b`. — [Groq Structured Outputs](https://console.groq.com/docs/structured-outputs)
- Limitations: "Streaming and tool use are not currently supported with Structured Outputs". In strict mode every field must be `required`, and every object must set `additionalProperties: false`. Optional fields are not allowed; use a union with `null` instead. — [Groq Structured Outputs](https://console.groq.com/docs/structured-outputs)

**Tool use**

- The Groq docs say all hosted models support tool use. The table lists `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `openai/gpt-oss-safeguard-20b`, `qwen/qwen3.8-27b`, `minimaxai/minimax-m2.7`, `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`. — [Groq Tool Use](https://console.groq.com/docs/tool-use)
- **gpt-oss-20b and gpt-oss-120b do NOT support parallel tool use.** `qwen/qwen3.8-27b` and `llama-3.3-70b-versatile` do. — [Groq Tool Use](https://console.groq.com/docs/tool-use)

**gpt-oss tool-calling problems (developer reports, mostly Aug 2025; later status unknown)**

- OpenHands issue #10187 (opened Aug 10, 2025): with Groq GPT-OSS 20b and 120b, the Groq API returned 400 `tool_use_failed` "Failed to parse tool call arguments as JSON" because the model produced malformed tool arguments. The issue was closed as stale, with no Groq staff reply and no workaround. — [OpenHands #10187](https://github.com/OpenHands/OpenHands/issues/10187)
- Other reports on gpt-oss-120b: the harmony format is not followed consistently (for example, refusals emitted without channel tokens), and tool calls break parsers because of non-standard fields such as `reasoning_content`. These reports cover several hosts and frameworks, not only Groq. — [openai/harmony #80](https://github.com/openai/harmony/issues/80); [openclaw #9956](https://github.com/openclaw/openclaw/issues/9956); [LangChain forum](https://forum.langchain.com/t/harmony-response-format-sometimes-outputted-when-using-gpt-oss-120b-as-an-agent/2554); [vLLM #22578](https://github.com/vllm-project/vllm/issues/22578)
- The OpenAI model card says proper use of the harmony format "is critical to deploy our gpt-oss models properly to achieve their best capabilities". — [gpt-oss model card (arXiv 2508.10925)](https://arxiv.org/html/2508.10925v1)
- SambaNova's docs recommend setting `reasoning_effort` to `high` "to get better quality in tool calling requests with gpt-oss-120b". This is general advice about the model, not specific to Groq. — [SambaNova Function Calling](https://docs.sambanova.ai/docs/en/features/function-calling)

**Deprecations, 2025–2026 (from the Groq deprecations page, fetched 2026-09-26)**

- 2026-09-21: `groq/compound` and `groq/compound-mini` shut down (announced Aug 24, 2026; no replacement).
- 2026-09-14: `qwen/qwen3.6-27b` replaced by `qwen/qwen3.8-27b` (free and developer tiers; committed-spend enterprise not affected).
- 2026-08-16: `llama-3.1-8b-instant` and `llama-3.3-70b-versatile` removed from free and developer tiers (announced Jun 17, 2026). Replacements: gpt-oss-20b, gpt-oss-120b or qwen3.6-27b.
- 2026-07-17: `qwen/qwen3-32b` and `meta-llama/llama-4-scout-17b-16e-instruct` removed (free and developer tiers; announced Jun 17, 2026). Replacements: gpt-oss-120b or qwen3.6-27b.
- 2026-04-15: `moonshotai/kimi-k2-instruct-0905` shut down (announced Mar 23, 2026). Replacement: `openai/gpt-oss-120b`.
- 2026-03-09: `meta-llama/llama-4-maverick-17b-128e-instruct` shut down (announced Feb 20, 2026; free and developer tiers). Replacement: gpt-oss-120b.
- 2026-03-05: Llama Guard 4 replaced by `openai/gpt-oss-safeguard-20b` (announced Feb 10, 2026).
- 2025-12-31: `playai-tts` and `playai-tts-arabic` replaced by Orpheus.
- 2025: `moonshotai/kimi-k2-instruct` (Oct 10) → gpt-oss-120b; `gemma2-9b-it` (Oct 8); `deepseek-r1-distill-llama-70b` (Oct 2); `llama3-70b-8192` and `llama3-8b-8192` (Aug 30); `distil-whisper` (Aug 23); `mistral-saba-24b` (Jul 30) → qwen3-32b; `qwen-qwq-32b` (Jul 14) → qwen3-32b.
- Source for all of the above: [Groq Deprecations](https://console.groq.com/docs/deprecations)

### Inferences

- The only free Groq model that covers both requirements (tool calling from Ukrainian text, and extraction from a photo with no text) is `qwen/qwen3.8-27b`. gpt-oss-120b cannot read images on Groq at all, so the photo-only flow cannot run on the current model.
- **8K TPM is the binding free-tier constraint.** A request that includes a system prompt, several tool schemas, the chat history and one image (2,048 tokens) can use most of a minute's budget in a single call. Qwen3.8's thinking mode adds a large number of reasoning tokens (see §4, where AA commenters report 2.3x more tokens at its default). For tool loops, `reasoning_effort: "none"` or `"low"` and a compact tool set will probably be needed to stay under 8K TPM and 200K TPD.
- Groq does not support Structured Outputs combined with tool use or streaming. The photo-extraction step should therefore be a separate, non-streaming call with a strict JSON schema (for example, AI SDK `generateText` with `Output.object`/`generateObject`, no tools). Its result can then feed the tool-calling step.
- Strict mode requires every field to be `required`. With AI SDK defaults (`structuredOutputs: true`, `strictJsonSchema: true`; see §5), Zod `.optional()` fields will likely fail or behave unexpectedly. Use `.nullable()` instead.
- Part of the owner's "too weak" complaint about gpt-oss-120b may come from its lack of parallel tool calls, the documented tool-call parse failures, and possibly a non-high reasoning effort. gpt-oss's Tau-Bench score drops sharply at lower effort (see §4).
- `qwen/qwen3.8-27b` is labelled **Preview** on Groq. The Qwen ID on Groq has changed three times in about 14 months: qwen-qwq-32b → qwen3-32b → qwen3.6-27b → qwen3.8-27b. Expect it to change again. Keep the model ID in config or env, not hard-coded.

### Gaps

- I did not find a Groq doc that gives the default `reasoning_effort` for gpt-oss-120b, or whether the free tier caps the effort level.
- I could not confirm whether the Aug 2025 gpt-oss `tool_use_failed` problems on Groq were fixed later. I found no 2026 reports either way.
- The date `qwen/qwen3.8-27b` was added to Groq is not in the changelog. The changelog appears incomplete for 2026.
- I found no Groq documentation on Ukrainian or Cyrillic OCR quality for qwen3.8-27b. The docs only mention "Multilingual Image Analysis" in general terms.
- Groq does not document image resolution limits or base64 size limits. Only the 20 MB URL limit is stated.

---

## 2. Cerebras: free-tier models, limits, tool calling, structured output, vision

### Takeaway

**Cerebras no longer has a permanent free tier.** Since Aug 17, 2026, new use requires adding a payment method, which unlocks a one-time $5 credit that expires after 30 days. The Free Trial allows only 5 RPM. Shared Inference now serves just two models: `gpt-oss-120b` (text) and `qwen-3.8-27b` (vision, tool calling, strict mode, parallel calls). The same Qwen3.8-27B that Groq offers runs here at about 1,850 tok/s, but the free trial caps context at 64K and allows 2 images per request.

### Cited Findings

- Cerebras email quoted on X: "The current free API tier will remain available to you until August 17, 2026. On that date, your account will be transitioned to the new free credit-based experience. You'll be required to add a payment method to unlock…" — [Hot Aisle on X](https://x.com/HotAisle/status/2077890927709032509)
- The rate-limits doc says "New accounts receive **$5 in free credits** after adding a verified payment method", that the credits expire 30 days after they are granted, and that the Free Trial is "time- and credit-bounded". After it ends, the account must upgrade to the Developer tier. — [Cerebras Rate Limits](https://inference-docs.cerebras.ai/support/rate-limits)
- Community trackers confirm that Cerebras "has no permanent free tier", that the old "1M tokens/day free" is gone, and that API and Playground stay inactive until a card is added. These are secondary sources. — [agentdeals #1910](https://github.com/robhunter/agentdeals/issues/1910); [OmniRoute #11773](https://github.com/diegosouzapw/OmniRoute/issues/11773); [toolfreebie](https://toolfreebie.com/cerebras-free-api/)
- Free Trial limits, identical for `gpt-oss-120b` and `qwen-3.8-27b`: **5 RPM**, 30K uncached TPM, 90K total TPM, 1M TPH, 1M TPD. For qwen-3.8-27b: 2 images per request and a 10 MiB total payload. — [Cerebras Rate Limits](https://inference-docs.cerebras.ai/support/rate-limits)
- Model catalogue: `gpt-oss-120b` (65K context on free / 131K paid, ~3,000 tok/s, production) and `qwen-3.8-27b` (64K free / 128K paid, ~1,850 tok/s, production). Cerebras says all Shared Inference models are "original, unpruned versions" and uses weight-only quantization only in storage. — [Cerebras Models Overview](https://inference-docs.cerebras.ai/models/overview)
- qwen-3.8-27b: a dense multimodal model "designed for agentic coding and tool use". Max output is 32K on free and 40K on paid. Input is text plus base64 PNG/JPEG (2 images on free, 10 on Developer/Enterprise). Tool calling includes parallel calls and `strict: true`. Reasoning is on by default at `high` and can be turned off with `reasoning_effort: "none"`. Price: $0.99 in / $1.49 out per 1M. Developer tier: 300 RPM. — [Cerebras qwen-3.8-27b](https://inference-docs.cerebras.ai/models/qwen-3.8-27b.md)
- Tool calling is supported on `qwen-3.8-27b` and `gpt-oss-120b` (Shared), `gemma-4-31b` (Dedicated only) and `kimi-k2.7-code` (customer trials only). All four support `tool_choice` none, auto, required or a named function, plus strict mode, parallel calls and multi-turn. In strict mode, every object needs `additionalProperties:false`, and **for qwen-3.8-27b strict schemas must not use `pattern`, `minLength` or `maxLength`**. — [Cerebras Tool Use](https://inference-docs.cerebras.ai/capabilities/tool-use.md)
- Image input: qwen-3.8-27b, gemma-4-31b (Dedicated) and kimi-k2.7-code (trials). Only PNG and JPEG are accepted, **only as base64 data URIs** (no URLs), with a 10 MiB payload and a maximum of 15,000 px per side. "qwen-3.8-27b currently accepts image content only in `user` messages. Images in `tool` messages aren't supported." The free-trial limit of 2 images applies "during Public Preview". — [Cerebras Image Inputs](https://inference-docs.cerebras.ai/capabilities/image-inputs.md)
- Deprecations (Cerebras): `gemma-4-31b` on 2026-09-03 (→ qwen-3.8-27b); `zai-glm-4.7` on 2026-08-17; `llama3.1-8b` and `qwen-3-235b-a22b-instruct-2507` on 2026-05-27 (→ gpt-oss-120b); `qwen-3-32b` and `llama-3.3-70b` on 2026-02-16; `zai-glm-4.6` on 2026-01-20 (→ GLM 4.7); `qwen-3-235b-a22b-thinking-2507` on 2025-11-14; `qwen-3-coder-480b` on 2025-11-05; `llama-4-scout-17b-16e-instruct` on 2025-11-03; `llama-4-maverick-17b-128e-instruct` on 2025-10-15; `deepseek-r1-distill-llama-70b` on 2025-08-12; `qwen-3-235b-a22b` on 2025-07-29. The `disable_reasoning` parameter is removed from July 21, 2026; use `reasoning_effort="none"` instead. — [Cerebras Deprecations](https://inference-docs.cerebras.ai/support/deprecation.md)

### Inferences

- For a free, always-on backend, Cerebras is no longer a real option. The $5 credit runs out after 30 days, a card is required, and 5 RPM is too low for multi-step agent loops, where every tool step is a request. It could serve as a paid fallback running the same Qwen3.8-27B at about 4x Groq's speed, at a lower output price than Groq ($1.49 vs $4.00 per 1M output tokens).
- The image-input rules differ between providers. Cerebras accepts base64 only, Groq also accepts URLs, and Cerebras does not allow images in tool messages. Sending images as base64 in the user message works on both.
- Cerebras has moved away from GLM, Llama and big Qwen MoEs in the last 12 months. Its model list has changed more than Groq's.

### Gaps

- I could not render the Cerebras pricing page (www.cerebras.ai/pricing) in full. Per-model prices come from the model doc pages.
- I found no Cerebras statement on Ukrainian quality.
- The Cerebras docs do not say whether structured outputs (`response_format` json_schema) can be combined with image input on qwen-3.8-27b.

---

## 3. SambaNova Cloud: free-tier models, limits, tool calling, vision

### Takeaway

SambaNova's free tier (an account with no payment method) is the most restricted of the three: **20 RPM, 20 requests per day, 200K tokens per day**, shared across all free models. The free models are DeepSeek-V3.1, Meta-Llama-3.3-70B-Instruct, gpt-oss-120b, DeepSeek-V3.2 (preview, 32K context) and gemma-4-31B-it (preview, text + image + video). The only free vision model, gemma-4-31B-it, is not on SambaNova's function-calling list. MiniMax-M3 (1M context, text + image) and MiniMax-M2.7 require the paid Developer tier.

### Cited Findings

- Free tier (accounts without an active payment method): **20 RPM, 20 RPD, 200,000 TPD**, the same for every free model. Free models: DeepSeek-V3.1, Meta-Llama-3.3-70B-Instruct, gpt-oss-120b, DeepSeek-V3.2 and gemma-4-31B-it. The Developer tier (payment method linked) gets 60–240 RPM, 12,000–48,000 RPD and "20M tokens per day" across all models. — [SambaNova Rate Limits](https://docs.sambanova.ai/docs/en/models/rate-limits)
- Tracker issue opened July 19, 2026: a "previously undocumented" 20 RPD cap was found, and several models were dropped from the free tier: Llama-4-Scout, Llama-4-Maverick, DeepSeek-R1, MiniMax-M2.7 (now developer-tier only) and Qwen3-32B. The reviewer judges the free tier fit only for "light eval". — [digithings #1593](https://github.com/digithings-ai/digithings/issues/1593). Some third-party pages still show older numbers (for example, 30 RPM with no daily cap). — [search summary incl. itsfree.ai / costbench](https://itsfree.ai/provider/sambanova/)
- Model catalogue. Production: MiniMax-M2.7 (192K, text), DeepSeek-V3.1 (128K, text), Meta-Llama-3.3-70B-Instruct (128K, text) and gpt-oss-120b (128K, text). Preview: MiniMax-M3 (1M context, text + image), DeepSeek-V3.2 (32K, text) and gemma-4-31B-it (128K, text + image + video). — [SambaCloud Models](https://docs.sambanova.ai/docs/en/models/sambacloud-models)
- Function calling is supported on `Meta-Llama-3.3-70B-Instruct`, `Qwen3-235B-A22B-Instruct-2507` (still listed there, though not in the current model catalogue, so the list is probably stale), `gpt-oss-120b`, `DeepSeek-V3.1`, `DeepSeek-V3.2` and `MiniMax-M2.7`. The docs show JSON mode and JSON schema examples. For gpt-oss-120b, the Responses API format and `allowed_tools` are not supported, and SambaNova recommends `reasoning_effort: high` for better tool calls. **gemma-4-31B-it and MiniMax-M3 are not on the function-calling list.** — [SambaNova Function Calling](https://docs.sambanova.ai/docs/en/features/function-calling)

### Inferences

- 20 requests per day is too few for an interactive agent. A single "create an invoice from this photo" task can take 3–6 requests in a tool loop. SambaNova's free tier is useful only for occasional evaluation, not as a production backend.
- gemma-4-31B-it on SambaNova could handle photo-only extraction (vision plus JSON schema), but tool calling with it is undocumented there. Among the free SambaNova models, the stronger tool-calling options are DeepSeek-V3.1 and V3.2, and both are text-only.

### Gaps

- Whether json_schema strict mode or constrained decoding is actually enforced on SambaNova. The docs only show examples.
- Image limits for gemma-4-31B-it on SambaCloud (count, size). The community AI SDK provider doc says "up to five (5) images per request and don't support URLs", but that text may be older than Gemma 4.
- Whether the preview models (DeepSeek-V3.2, gemma-4-31B-it) will stay on the free tier.

---

## 4. Benchmarks for notable models (BFCL, tau/tau2, agentic, multilingual/Ukrainian)

### Takeaway

I found no BFCL v4 or tau2 score for Qwen3.8-27B. Its official card reports big gains over Qwen3.6-27B in agentic, instruction-following and document-vision tasks, and it scores 52 on the Artificial Analysis Intelligence Index, against 38 for Qwen3.6-27B. gpt-oss-120b's function-calling score depends heavily on reasoning effort (Tau-Bench Retail: 49.4 at low, 67.8 at high). Gemma 4 31B-it reports tau2 76.9 and MMMLU 88.4. None of these models publishes Ukrainian-specific scores.

### Cited Findings

**openai/gpt-oss-120b / 20b (released Aug 5, 2025)**

- Tau-Bench Retail (function calling), low / medium / high reasoning: **gpt-oss-120b 49.4 / 62.0 / 67.8**; gpt-oss-20b 35.0 / 47.3 / 54.8. — [gpt-oss model card, Table 3](https://arxiv.org/html/2508.10925v1)
- MMMLU average, low / medium / high: gpt-oss-120b 74.1 / 79.3 / 81.3; gpt-oss-20b 67.0 / 73.5 / 75.7. The 14 languages tested were Arabic, Bengali, Chinese, French, German, Hindi, Indonesian, Italian, Japanese, Korean, Portuguese, Spanish, Swahili and Yoruba. **Ukrainian is not included.** — [gpt-oss model card](https://arxiv.org/html/2508.10925v1)
- Groq lists MMLU 90.0, SWE-Bench Verified 62.4 and MMMLU 81.3, and describes gpt-oss as a text-only MoE with 120B total and 5.1B active parameters. — [Groq gpt-oss-120b page](https://console.groq.com/docs/model/openai/gpt-oss-120b)

**Qwen3.8-27B (dense, 27B, vision-language, Apache-2.0)**

- Release date reported as **August 14, 2026**. This comes from an aggregator via search snippet, not the primary card. — [Northflank](https://northflank.com/blog/qwen3-8-27b-performance-benchmarks-gpu-requirements-and-how-to-run-it) / [Yotta Labs](https://www.yottalabs.ai/post/qwen-3-8-27b-specs-hardware-requirements-how-to-run-2026)
- Official card, Qwen3.8-27B vs Qwen3.6-27B. Text: Terminal Bench 2.1 73.0 vs 63.4; SWE-bench Pro 61.7 vs 53.5; QwenSWEBench 79.0 vs 49.3; **IFBench 79.5 vs 69.1**; GPQA Diamond 89.2 vs 87.8; LiveCodeBench v6 90.3 vs 83.9. Vision: OSWorld-Verified 84.3 vs 63.9; WebArena-Verified 64.8 vs 48.8; AndroidWorld 81.9 vs 70.3; MathVision 94.6 vs 85.1; **OmniDocBench 1.5 91.1 vs 89.4**; CharXiv (RQ) 90.2 vs 78.4. Architecture: a causal LM with a vision encoder, 64 layers, and a hybrid of Gated DeltaNet and Gated Attention. — [HF Qwen/Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B)
- My fetch of the card did not include BFCL-V4, TAU2, MMMLU or OCRBench numbers. — [HF Qwen/Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B)
- Artificial Analysis Intelligence Index: Qwen3.8 27B **52**, level with DeepSeek V4 Flash 0731 and GLM 5.2 as described in the post. Qwen3.6 27B scored 38. Commenters note it uses about 2.3x more tokens than a comparison model at its default "xhigh" reasoning. HN post from about mid-Aug 2026. — [Hacker News](https://news.ycombinator.com/item?id=49334544)

**Gemma 4 31B-it (on SambaNova free as preview; deprecated on Cerebras 2026-09-03)**

- Tau2 (average over 3) **76.9**; MMMLU **88.4**; OmniDocBench 1.5 edit distance 0.131 (lower is better); MMMU Pro 76.9; MMLU Pro 85.2; GPQA Diamond 84.3; LiveCodeBench v6 80.0. Pre-trained on 140+ languages, with 35+ supported out of the box. The card has "native support for structured tool use". The technical report is arXiv 2607.02770 (July 2026). The exact model release date is uncertain. — [HF google/gemma-4-31B-it](https://huggingface.co/google/gemma-4-31B-it)

**DeepSeek-V3.2 (SambaNova free, preview, 32K context)**

- The card mentions "a revised format for tool calling" and "thinking with tools". The Speciale variant has no tool calling. Numbers shown include SWE-bench Verified 70 and Apex Agents 7. Text-only. — [HF deepseek-ai/DeepSeek-V3.2](https://huggingface.co/deepseek-ai/DeepSeek-V3.2)

**Leaderboards**

- The BFCL leaderboard page shows "Last Updated: 2026-04-12". The table did not render in my fetch, so I have no per-model BFCL v4 numbers. — [BFCL leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html)
- Artificial Analysis τ²-Bench Telecom: the leaders visible in my fetch were GLM-5.2 (max) 99.1%, JT-35B-Flash 99.1% and GLM-4.7-Flash (Reasoning) 98.8%. Rows for gpt-oss, Qwen3.8, Gemma 4 and DeepSeek did not render. — [AA τ²-Bench](https://artificialanalysis.ai/evaluations/tau2-bench)

### Inferences

- Qwen3.8-27B's IFBench gain (+10.4) and strong agentic scores suggest it should follow tool schemas better than Qwen3.6. Its OmniDocBench 1.5 score of 91.1 suggests strong document OCR and layout parsing, which matters for invoices and bank statements. This is an indication, not a Ukrainian-specific measurement.
- On the only function-calling benchmark available for both, gpt-oss-120b at high effort (Tau-Bench Retail 67.8) is well below Gemma 4 31B's tau2 76.9. The two benchmarks differ (tau vs tau2), so the comparison is indicative only.

### Gaps

- There are no BFCL v3/v4 or tau2 scores for Qwen3.8-27B or gpt-oss-120b from the current leaderboards; the tables did not render.
- There is no Ukrainian or Cyrillic benchmark for any of these models: no Ukrainian MMMLU split, and no Cyrillic OCR test for invoices, meter readings or bank statements. An in-house eval on 20–50 real documents is the only reliable test.
- I found no BFCL or tau2 for MiniMax-M2.7 or M3. They are not on any free tier, so this matters little here.

---

## 5. Vercel AI SDK (v6) provider availability

### Takeaway

There are official packages for Groq (`@ai-sdk/groq`) and Cerebras (`@ai-sdk/cerebras`). For SambaNova there is the community `sambanova-ai-provider` (latest 1.2.2, which adds structured outputs), or `@ai-sdk/openai-compatible`. Both official providers' doc pages list models out of date, so rely on the providers' own docs for model IDs.

### Cited Findings

- `@ai-sdk/groq` provider options: `reasoningFormat` ('parsed' | 'raw' | 'hidden'), `reasoningEffort` ('low' | 'medium' | 'high' | 'none' | 'default'), **`structuredOutputs` (default true)**, **`strictJsonSchema` (default true)**, `parallelToolCalls` (default true), `serviceTier` ('on_demand' | 'performance' | 'flex' | 'auto') and `user`. Its capability table still lists `moonshotai/kimi-k2-instruct-0905` and `qwen/qwen3.6-27b`, both deprecated on Groq. — [AI SDK Groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq)
- `@ai-sdk/cerebras`: its table lists `gpt-oss-120b` and `gemma-4-31b`, all marked image input, object generation, tool usage, tool streaming and reasoning. `strictJsonSchema` defaults to true. `reasoningEffort` accepts none, low, medium or high. — [AI SDK Cerebras provider](https://ai-sdk.dev/providers/ai-sdk-providers/cerebras). **This contradicts Cerebras's own docs:** gemma-4-31b was removed from Shared Inference on 2026-09-03, gpt-oss-120b is not listed as image-capable, and qwen-3.8-27b is missing. — [Cerebras Image Inputs](https://inference-docs.cerebras.ai/capabilities/image-inputs.md); [Cerebras Deprecations](https://inference-docs.cerebras.ai/support/deprecation.md)
- SambaNova: the community provider `sambanova-ai-provider` is listed on ai-sdk.dev and supports text, streaming, image input, tool calling and embeddings. Vision takes up to 5 images per request and no URLs. It uses the `SAMBANOVA_API_KEY` env var and the `https://api.sambanova.ai/v1` base URL. — [AI SDK community: SambaNova](https://ai-sdk.dev/providers/community-providers/sambanova); [GitHub sambanova-ai-provider](https://github.com/sambanova/sambanova-ai-provider)
- The provider's changelog goes up to 1.2.2 ("Adding structured outputs option"). It has no dates and does not state which AI SDK major version or `@ai-sdk/provider` spec version it supports. — [sambanova-ai-provider CHANGELOG](https://github.com/sambanova/sambanova-ai-provider/blob/main/CHANGELOG.md)
- SambaNova's docs also document use through the OpenAI-compatible provider. — [SambaNova Vercel integration](https://docs.sambanova.ai/docs/en/integrations/vercel); [community thread](https://community.sambanova.ai/t/openai-sdk-compatibility-using-vercel-ai-sdk-with-openai-compatible-provider/1266)

### Inferences

- Moving the app from `openai/gpt-oss-120b` to `qwen/qwen3.8-27b` on Groq should need only a model-ID change, plus `providerOptions.groq.reasoningEffort` (for example `'none'` or `'low'` for tool loops) and schema fixes for strict mode. The AI SDK Groq provider passes model IDs through, so the stale doc table does not block it.
- For SambaNova on AI SDK v6, `@ai-sdk/openai-compatible` is probably the safer choice than the community package, whose v6 (LanguageModelV3) compatibility is unverified.

### Gaps

- I did not verify whether `sambanova-ai-provider` 1.2.2 declares AI SDK v6 compatibility (I did not read its package.json).
- I did not verify whether `@ai-sdk/groq` handles Groq's "no structured outputs + tools" restriction automatically, for example by falling back to json_object, when `Output.object` and tools are used together in a v6 `generateText` call.

---

## 6. Data privacy, retention and training on the free tier

### Takeaway

Groq and Cerebras both state that by default they do not keep inference inputs or outputs. Groq offers opt-in Zero Data Retention, and its docs draw no free vs paid distinction. SambaNova has not given a clear public answer about API prompt retention or training.

### Cited Findings

- Groq: "By default, Groq does not retain customer data for inference requests". Data is kept only when needed for batch, fine-tuning or reliability issues. Zero Data Retention is opt-in and switched on by org admins in Data Controls. Any retained data sits in GCP buckets in the US. Usage metadata excludes inputs and outputs. The page makes no free vs paid distinction and says nothing explicit about training. — [Groq: Your Data](https://console.groq.com/docs/your-data)
- Cerebras: per its support article, Cerebras does not retain prompt content, API requests or responses, or user inputs and outputs for inference. Logs are deleted when no longer needed. I have this from a search-result summary and did not fetch the page. — [Cerebras Support: Does Cerebras retain my data?](https://support.cerebras.net/articles/1811589793-does-cerebras-retain-my-data); [Cerebras Privacy Policy](https://www.cerebras.ai/privacy-policy)
- SambaNova: when a user asked in Feb 2025 whether developer-tier prompts are stored or used for training, staff said "This request has been passed on to our legal team". As of the thread's last posts (Apr 2025) there was no public answer. — [SambaNova community thread](https://community.sambanova.ai/t/privacy-data-use-in-developer-tier/899). Marketing copy says "SambaCloud never sees or collects any of your data or user prompts" (search snippet; undated). — [SambaCloud product page](https://sambanova.ai/products/sambacloud)

### Inferences

- The app sends Ukrainian personal and financial data: debtors, bank statements, invoices. On that basis Groq, with ZDR switched on, is the most clearly documented option. SambaNova's position is the weakest documented.

### Gaps

- None of the three explicitly says in the fetched docs whether free-tier inputs are ever used for training.
- I did not check Groq's Terms or Services Agreement for training clauses.

---

## 7. Model ID stability and deprecation history

### Takeaway

All three providers change their free-tier lineups often, retiring models 1–4 weeks after announcing it. On Groq, only gpt-oss (since Aug 2025) has stayed stable. Qwen IDs change with each Qwen point release, and Llama, Kimi and Maverick were all dropped in 2026. Cerebras and SambaNova have cut even more.

### Cited Findings

- Groq notice periods: Maverick was announced Feb 20 and shut down Mar 9, 2026 (17 days). Kimi K2 0905: Mar 23 → Apr 15, 2026 (23 days). Llama 3.x and Qwen3-32B: Jun 17 → Jul 17 or Aug 16, 2026. Compound: Aug 24 → Sep 21, 2026. Several 2026 deprecations apply only to free and developer tiers, not to committed-spend enterprise customers. — [Groq Deprecations](https://console.groq.com/docs/deprecations)
- The official replacement for Kimi K2, Maverick, Llama 4 Scout and Llama 3.x on Groq was `openai/gpt-oss-120b`. — [Groq Deprecations](https://console.groq.com/docs/deprecations)
- Cerebras retired 13 models between Jan 2025 and Sep 2026, including GLM 4.6/4.7, all Llama 4, Qwen3 235B/Coder 480B and Gemma 4 31B. — [Cerebras Deprecations](https://inference-docs.cerebras.ai/support/deprecation.md)
- SambaNova's free tier narrowed by July 2026: Llama 4 Scout and Maverick, DeepSeek-R1, Qwen3-32B and MiniMax-M2.7 were removed. — [digithings #1593](https://github.com/digithings-ai/digithings/issues/1593)

### Inferences

- The model ID and provider should be configuration, not code, and a fallback chain is worth having (for example Groq qwen3.8-27b → Groq gpt-oss-120b for text-only turns). Expect the Groq Qwen ID to change again within months. The 3.6 → 3.8 swap had a short notice window.
- gpt-oss-120b has been the default replacement on both Groq and Cerebras for more than a year. It is the most stable ID but has the weakest tool calling of the options.

### Gaps

- I did not find a formal provider SLA on minimum deprecation notice for free-tier models.
