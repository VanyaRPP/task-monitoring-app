# Vision / OCR models for extracting structured data from photos of Ukrainian business documents (state as of 2026-09-26)

Scope: photos with no user text (paper invoices, utility bills, meter displays, bank-statement screenshots, printed or handwritten debtor lists) → classify the document type → extract fields (EDRPOU, UA IBAN, UAH amounts, dates, meter numbers and readings, names, addresses, periods) into JSON → propose entities for user confirmation. Target stack: Next.js + Vercel AI SDK v6.

Local project facts (read from the repo on 2026-09-26, used below):

- Installed: `ai` 6.0.238, `@ai-sdk/google` 3.0.103, `@ai-sdk/groq` 3.0.52, `@ai-sdk/react` ^3.0.177, `zod` ^4.4.3 — [package.json / node_modules](file:///Users/admin/projects/task-monitoring-app/package.json)
- The assistant runs through `pages/api/chat.ts` (Pages Router) using `streamText` + `convertToModelMessages` + tools + `stopWhen: stepCountIs(AI_MAX_STEPS)`. The provider is picked by env: `google` → `gemini-flash-latest`, `groq` → `openai/gpt-oss-120b` — [common/services/aiAssistant/config.ts](file:///Users/admin/projects/task-monitoring-app/common/services/aiAssistant/config.ts), [pages/api/chat.ts](file:///Users/admin/projects/task-monitoring-app/pages/api/chat.ts)

---

## 1. Benchmark evidence: which models are best at document understanding and multilingual OCR?

### Takeaway

Leaderboards in 2026 rank three groups. (a) Specialised document parsers (PaddleOCR-VL 1.5/1.6, GLM-OCR, MinerU 2.5, Mistral OCR 4) lead OmniDocBench and olmOCR-bench. (b) Qwen 3.x vision models lead the open-weight general models on OCRBench v2 and CC-OCR. (c) Gemini 3 Pro/Flash are the strongest closed general models you can use for free. For KIE-style extraction (the IDP leaderboard), Gemini-3-Flash (82.0) is within about 1 point of Gemini-3-Pro and GPT-5.4. That makes Gemini Flash the best-supported free-tier choice for single-pass extraction. None of these leaderboards reports Ukrainian separately.

### Cited Findings

**OCRBench v2** (23 sub-tasks, 8 OCR capabilities; the leaderboard is updated about once a quarter):

- Latest period is **2026.06**. English track: Yaochi-DTS-A2T-1.9 73.4 (closed), Posicube_DVLM 69.8, KDL Frontier 68.1, **NVIDIA Nemotron 3 Nano Omni 30B 65.8 (open)**, **Qwen3.6-35B-A3B 65.5 (open)**, Qwen3.5-35B-A3B 65.3, **Gemini 3 Pro Preview 63.4**, Qwen3-Omni-30B-A3B 61.3, Gemini-2.5-Pro 59.3, **GLM-4.6V-Flash 59.0 (open)**. Chinese track: TeleMM-2.0 66.2, Qwen3.5-9B 64.1, Gemini 3 Pro Preview 63.8, Gemini-2.5-Pro 62.2. InternVL3, DeepSeek and Mistral/Pixtral rank lower — [OCRBench v2 site](https://99franklin.github.io/ocrbench_v2/)
- The 2026.03 leaderboard combined newly evaluated models with the best models carried over from 2025.09 — [OCRBench v2 site](https://99franklin.github.io/ocrbench_v2/) (via search snippet)
- Aggregators disagree on the top model. LLM-Stats (July 2026) puts Qwen3-VL-32B-Thinking first on OCRBench-v2 EN at 0.684 — [LLM Stats](<https://llm-stats.com/benchmarks/ocrbench-v2-(en)>). BenchLM (Aug 2026) puts "Qwen3.8 Max" first at 74.2% — [BenchLM](https://benchlm.ai/benchmarks/ocrbenchv2). The two use different subsets and snapshots, so they cannot be compared directly.

**OmniDocBench** (full-page parsing; v1.5 and v1.6 in use):

- OmniDocBench re-evaluated PaddleOCR-VL-1.5, DeepSeek-OCR-2, dots.ocr and others on 2026-03-31 — [OmniDocBench GitHub](https://github.com/opendatalab/OmniDocBench) (via search snippet)
- v1.6: PaddleOCR-VL 1.6 96.34, MinerU 2.5-Pro 95.75, GLM-OCR 95.22. v1.5: PaddleOCR-VL-1.5 94.50, dots.ocr 88.41, DeepSeek-OCR 87.01 — [Spheron blog](https://www.spheron.network/blog/best-open-source-ocr-vlm-self-host-gpu-cloud-2026/), [instavar](https://instavar.com/blog/ai-production-stack/OCR_SOTA_Feb_2026_Open_Document_AI_Leaderboard) (secondary sources, via search snippets)
- Gemini-3-Flash scores 90.1 on the OmniDocBench task of the IDP leaderboard — [Nanonets IDP leaderboard – Gemini 3 Flash](https://benchmarking.nanonets.com/models/gemini-3-flash). On v1.5, GLM-OCR scores 94.62 against Gemini 3 Pro's 90.33 — [decodethefuture](https://decodethefuture.org/en/glm-ocr-explained/) (via snippet)
- DeepSeek-OCR uses an MoE decoder with about 570M active parameters. Its selling point is throughput, not top accuracy — [Spheron blog](https://www.spheron.network/blog/best-open-source-ocr-vlm-self-host-gpu-cloud-2026/)

**olmOCR-bench:**

- Mistral OCR 4 (released 2026-06-23) claims olmOCR-Bench 85.20, OmniDocBench 93.07 and "Crawl Multilingual" 0.98, plus a 72% average win rate in human preference. These are vendor numbers; the page names no competitor scores — [Mistral OCR 4 announcement](https://mistral.ai/news/ocr-4/)
- Older olmOCR-bench reference points: Gemini Flash 2 57.8 ±1.1, Mistral OCR API (Mar 2025) 72.0 ±1.1, olmOCR v0.1.75 74.7 ±1.1 — [olmOCR 2 paper](https://arxiv.org/pdf/2510.19817). One snippet reports Gemini 3 Pro at 80.2 average; this is attributed to the [Falcon Perception paper](https://arxiv.org/pdf/2603.27365) but not verified in full text.

**IDP leaderboard (Nanonets; OlmOCR + OmniDoc + IDP/KIE tasks):**

- Overall: Nanonets OCR-3 85.9, GPT-5.4 83.5, Gemini-3-Pro 82.8, **Gemini-3-Flash 82.0**, Claude Sonnet 4.6 80.7, Qwen3-VL-Plus 80.1, Qwen3-VL-235B 79.6, **Qwen3.5-9B 76.7**, **Mistral Small 4 71.5**, GLM-OCR 64.2. PaddleOCR-VL, dots.ocr, DeepSeek-OCR, Llama 4 and Gemini Flash-Lite are not listed — [IDP leaderboard](https://benchmarking.nanonets.com/). Caveat: Nanonets runs the leaderboard and ranks its own model first.

**CC-OCR** (four tracks: multi-scene, multilingual, document parsing, KIE; 39 subsets, 7,058 images):

- The original paper (Dec 2024, ICCV 2025) found that "multilingual capabilities of most models are inferior to their performance in Chinese and English". Gemini-1.5-Pro was first in the multilingual track — [CC-OCR paper](https://arxiv.org/html/2412.02210)
- LLM-Stats CC-OCR table (Sept 2026, 0–1 scale). It lists only Qwen models: Qwen3.6 Plus 0.834, Qwen3-VL-235B-A22B-Instruct 0.822, Qwen3.6-35B-A3B 0.819, Qwen3.6-27B 0.812, Qwen3-VL-30B-A3B-Instruct 0.807, Qwen3-VL-32B-Instruct 0.803, Qwen3-VL-8B-Instruct 0.799, Qwen2.5-VL-72B 0.798, Qwen3-VL-4B-Instruct 0.762 — [LLM Stats CC-OCR](https://llm-stats.com/benchmarks/cc-ocr)
- Qwen3-VL-4B: OCRBench 873, OCRBench v2-EN 60.68, CC-OCR multilingual 74.2, CC-OCR overall 76.5. This comes from a search snippet that cites the tech report and Qianfan-OCR, and was not verified in the PDF — [Qwen3-VL Technical Report](https://arxiv.org/pdf/2511.21631), [Qianfan-OCR](https://arxiv.org/html/2603.13398v1)

**Model-card claims (vendor):**

- Qwen3-VL: "expanded OCR supports 32 languages (up from 10)", "robust in low light, blur, and tilt", and better long-document structure parsing. The 2B and 32B were released 2025-10-21 — [Qwen3-VL GitHub](https://github.com/qwenlm/qwen3-vl)
- PaddleOCR-VL (0.9B): 109 languages, including "Russian (Cyrillic script)"; the full list is in the tech report appendix — [PaddleOCR-VL HF card](https://huggingface.co/PaddlePaddle/PaddleOCR-VL)
- Mistral OCR 4: 170 languages in 10 language groups, handwriting, bounding boxes, block classification (tables, signatures), **inline per-page and per-word confidence scores**, structured JSON via Document AI schemas — [Mistral OCR 4](https://mistral.ai/news/ocr-4/)
- Gemma 4: OCR (including multilingual) and document/PDF parsing across 140+ languages. Vision budget per image can be set to 70/140/280/560/1120 tokens, and "undersized budgets degrade OCR and chart reading noticeably" — [Datature blog](https://datature.io/blog/gemma-4-what-computer-vision-engineers-actually-need-to-know), [Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4)
- Gemini 3.8 Flash (model card dated 2026-09-02): CharXiv 86.2% (no tools), GDP.PDF 35.0%. Paid price $0.75 in / $3.75 out per 1M tokens (discounted from $1.50 / $7.50). The card lists **no OmniDocBench or OCR score** — [Gemini 3.8 Flash model card](https://deepmind.google/models/model-cards/gemini-3-8-flash/)

### Inferences

- For a free-tier, single-pass photo → JSON pipeline, **Gemini Flash (3.x)** has the best combination of benchmark results (IDP 82.0, OmniDoc about 90), native HEIC input, large request limits and support for structured output together with tools. Among open models, **Qwen3.5/3.6 (27B–35B-A3B)** and **GLM-4.6V-Flash** are the strongest, but you only get them free through third-party hosts.
- Specialised parsers (PaddleOCR-VL, GLM-OCR, dots.ocr, DeepSeek-OCR) are best as a self-hosted first stage (image → markdown/table). They are not free hosted APIs, and they do no schema extraction themselves.
- Leaderboard numbers come from clean scans and PDFs and are mostly Chinese/English. Expect a real drop on phone photos of Ukrainian paper with glare, fold marks and stamps.

### Gaps

- No current (2025–2026) document-OCR numbers found for **Llama 4 Scout/Maverick, InternVL3, MiniCPM-V, Pixtral/Mistral Small 3.x vision, GPT-4.1/4o-mini, or Gemini Flash-Lite** on the same benchmarks. Their absence from the 2026 top lists is weak evidence that they rank lower.
- Could not extract the Qwen3-VL tech report tables. The PDF did not parse, so its DocVQA/InfoVQA/OmniDocBench numbers are missing.
- No official Google OCR benchmark number for Gemini 3.5/3.6/3.8 Flash. The IDP leaderboard entry is "Gemini-3-Flash" (Dec 2025 model); newer Flash versions were not evaluated there.
- DocVQA and ChartQA are saturated and were not collected per model. CharXiv is the only chart number for Gemini 3.8 Flash.

---

## 2. Evidence on Ukrainian/Cyrillic text, handwriting, meter digits and bank-statement tables

### Takeaway

There is **no public benchmark that measures Ukrainian OCR or KIE for VLMs**. The best proxies are "Cyrillic/Russian" coverage claims and the general finding that multilingual OCR lags Chinese and English. Meter reading is a known weak spot: models read digital displays reasonably well but are poor at needles and dials. Handwriting and Ukrainian-specific failures (і/ї/є/ґ, the apostrophe) need an in-house test set.

### Cited Findings

- CC-OCR (multilingual track) found most LMMs worse at multilingual text than at Chinese or English — [CC-OCR paper](https://arxiv.org/html/2412.02210)
- A 2026 snippet says Qwen3.5-9B is the strongest on-device model (average 88.8) on a multilingual benchmark, but "decreases noticeably on Arabic, Luxembourgish, Korean, and Russian". The exact paper is uncertain; it appeared with [METATR](https://arxiv.org/pdf/2605.26712) and [ABot-OCR](https://arxiv.org/pdf/2605.27978) in search results and was not verified.
- Ukrainian multimodal benchmarking exists for academic and cultural VQA, not OCR — [Benchmarking Multimodal Models for Ukrainian](https://arxiv.org/pdf/2411.14647). UNLP 2026 (May 29–30, 2026) published Ukrainian benchmarks, none on document OCR — [UNLP 2026](https://aclanthology.org/2026.unlp-1.12.pdf)
- PaddleOCR-VL states Russian/Cyrillic support; whether Ukrainian is in its 109 languages is only in the appendix — [PaddleOCR-VL HF](https://huggingface.co/PaddlePaddle/PaddleOCR-VL). Mistral OCR 4 claims 170 languages including handwriting — [Mistral OCR 4](https://mistral.ai/news/ocr-4/)
- **Meters (MeasureBench, CVPR 2026):** units are recognised above 90%, but values are read far less accurately. Gemini 2.5 Pro scores **96.2% on unit vs 30.7% on value** on real images. **Digital displays reach up to 80.2%** (Gemini 2.5 Pro, real images); dial and linear instruments score about **10–32%**. The main failure is locating the indicator, and larger models are not reliably better — [MeasureBench arXiv](https://arxiv.org/abs/2510.26865), [CVPR 2026 paper](https://openaccess.thecvf.com/content/CVPR2026/papers/Lin_Do_Vision-Language_Models_Measure_Up_Benchmarking_Visual_Measurement_Reading_with_CVPR_2026_paper.pdf)
- Pointer meters are the subject of a separate benchmark (DialBench) because foundation models struggle with them — [DialBench](https://arxiv.org/html/2511.21982)
- Tables: OmniDocBench and olmOCR-bench include table sub-scores, and the specialised parsers lead them (PaddleOCR-VL 1.6 overall 96.34 on v1.6) — [Spheron](https://www.spheron.network/blog/best-open-source-ocr-vlm-self-host-gpu-cloud-2026/). Mistral OCR 4 claims block classification for tables — [Mistral OCR 4](https://mistral.ai/news/ocr-4/)

### Inferences

- Mechanical (odometer-style) water and gas meters behave more like "digital" displays than dials, because each drum shows a printed digit. Two risks remain: **a drum caught half-way between digits**, and **red fractional drums** being read as whole units. Ask the model to return the black integer digits and the red decimal digits in separate fields. Check the result against the previous reading (monotonic, and a plausible consumption delta) and always require confirmation.
- Bank-statement screenshots are digital-born and sharp, so OCR quality is not the bottleneck. Long tables and row alignment are the risks (a row shifted by one, debit and credit swapped). Where a bank can export CSV/XLSX/MT940 or offers an API, that is more reliable than OCR.
- Handwritten debtor lists are the highest-risk case: Cyrillic handwriting, surnames and apartment numbers. Treat all handwritten fields as low confidence by default.
- Ukrainian-specific checks are worth running in the validator: letters і/ї/є/ґ, apostrophes (’ vs ') in names, and a model confusing Ukrainian and Russian spellings (и/і, е/є). Nothing measured these, so an internal test set of about 30–50 real photos per document type is needed to pick a model.

### Gaps

- No benchmark numbers for **Ukrainian** OCR, Cyrillic handwriting, or mechanical-drum meters for any model.
- No KIE benchmark on Ukrainian invoices or utility bills (for example, EDRPOU/IBAN field accuracy).
- No source compared VLMs on bank-statement table extraction specifically.

---

## 3. What is available for free via API (Sept 2026) and what are the image limits?

### Takeaway

The only free source that is both strong and stable is the **Gemini API free tier**: Flash and Flash-Lite, native HEIC, 20 MB inline request. Quotas are small and change often, and **free-tier inputs may be used for training and read by human reviewers**, which matters for IBANs and bank statements. **Groq no longer serves Llama 4 Scout** (shut down 2026-07-17); its vision model is now `qwen/qwen3.8-27b`. OpenRouter's `:free` pool (Gemma 4, Nemotron Omni) and Cloudflare Workers AI (Gemma 3/4, Llama vision) work as fallbacks. **Mistral OCR 4 and Document AI are paid** per page.

### Cited Findings

**Google Gemini API**

- Image types: `image/png`, `image/jpeg`, `image/webp`, **`image/heic`, `image/heif`**. Up to 3,600 images per request. Inline data is capped at **20 MB total request size**. Tokens: images ≤384 px on both sides cost 258 tokens; larger images are tiled into 768×768 tiles at 258 tokens each. `media_resolution` controls tokens per image — [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- The installed `@ai-sdk/google` 3.0.103 exposes provider option `mediaResolution: "low" | "medium" | "high" | "ultra_high"`. Model IDs it knows include `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.1-flash-lite-preview`, `gemini-flash-latest`, `gemini-flash-lite-latest` and `gemma-3-27b-it` — [local node_modules/@ai-sdk/google/dist/index.d.ts](file:///Users/admin/projects/task-monitoring-app/node_modules/@ai-sdk/google/dist/index.d.ts)
- Google's docs, fetched 2026-09-26, name **Gemini 3.8 Flash** (card dated 2026-09-02) and **Gemini 3.5 Flash-Lite**. The rate-limits page gives no numbers and says to check AI Studio — [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [3.8 Flash card](https://deepmind.google/models/model-cards/gemini-3-8-flash/)
- Third-party reports: free quotas were cut 50–80% in Dec 2025; free Pro-model access ended 2026-04-01; "as of September 2026, Gemini 3.5 Flash-Lite and 3.1 Flash-Lite provide 500 free requests per day" — [scriptbyai](https://www.scriptbyai.com/gemini-api-free-tier-limits/), [tinkerllm](https://tinkerllm.com/blog/gemini-api-free-tier-limits-rate-quotas/) (secondary; treat the numbers as indicative)
- **Data use:** on Unpaid Services, Google uses submitted content "to provide, improve, and develop Google products… and machine learning technologies"; human reviewers may read inputs and outputs; "do not submit sensitive, confidential, or personal information". Paid Services do not use prompts or files for training — [Gemini API terms](https://ai.google.dev/gemini-api/terms)
- Gemini 3 can combine **Structured Outputs with function calling** and built-in tools in one request — [Google Developers Blog: Gemini 3 API updates](https://developers.googleblog.com/new-gemini-api-updates-for-gemini-3/), [structured output docs](https://ai.google.dev/gemini-api/docs/structured-output)

**Groq**

- **Llama 4 Scout shut down 2026-07-17** (free and developer tiers). Replacements: `openai/gpt-oss-120b` or `qwen/qwen3.6-27b`. **Llama 4 Maverick shut down 2026-03-09**. **Qwen 3.6 27B shut down 2026-09-14**, replaced by `qwen/qwen3.8-27b` ("a 27B multimodal model") — [Groq deprecations](https://console.groq.com/docs/deprecations)
- Current vision model `qwen/qwen3.8-27b`: **max 3 images per request**, 20 MB max for image-URL requests, **2,048 input tokens per image**, 131K context, and **tool use and JSON mode both work with images** — [Groq vision docs](https://console.groq.com/docs/vision)
- The project's Groq default `openai/gpt-oss-120b` is text-only — [config.ts](file:///Users/admin/projects/task-monitoring-app/common/services/aiAssistant/config.ts); the Groq docs above list only qwen3.8-27b as the vision model. The installed `@ai-sdk/groq` 3.0.52 type list still contains `meta-llama/llama-4-scout-17b-16e-instruct` (now retired) — [local node_modules/@ai-sdk/groq](file:///Users/admin/projects/task-monitoring-app/node_modules/@ai-sdk/groq/dist/index.d.ts)

**OpenRouter**

- The `openrouter/free` router picks free models at random and filters for required features "such as image understanding". Free vision-capable models listed in 2026 include **Gemma-4-31B** (262K ctx, 140+ languages), **Gemma-4-26B-A4B** and **NVIDIA Nemotron-3 Nano Omni** (256K) — [OpenRouter free router](https://openrouter.ai/openrouter/free), [free models collection](https://openrouter.ai/collections/free-models), [Medium write-up](https://medium.com/@csv610/exploring-openrouter-free-vision-models-5373c94b00e1)

**Mistral**

- The free "Experiment" plan gives rate-limited access to API models (reported about 1B tokens/month and about 1 req/s; exact limits are only in the Admin Console) and requires phone verification — [cloudzero](https://www.cloudzero.com/blog/mistral-api-pricing/), [Mistral help](https://help.mistral.ai/en/articles/455206-how-can-i-try-the-api-for-free-with-the-experiment-plan)
- **OCR pricing:** OCR 4 costs $4 per 1,000 pages ($2 batch); Document AI (annotations) costs $5 per 1,000 pages; the announcement mentions no free tier — [Mistral OCR 4](https://mistral.ai/news/ocr-4/). **Conflict:** one review says OCR has no subscription fee on the "Free" plan, with data used for training — [aiproductivity review](https://aiproductivity.ai/tools/mistral-ocr/) — while another says OCR is a separate paid service not included in Experiment — [cloudzero](https://www.cloudzero.com/blog/mistral-api-pricing/). Check in the console.
- Annotations: `document_annotation` takes a JSON Schema, Pydantic or Zod schema and works over "the output text in Markdown, along with the first eight extracted image" boxes. `bbox_annotation` handles figures and charts. Inputs are PDF URL, image URL or base64 image — [Mistral annotations docs](https://docs.mistral.ai/capabilities/OCR/annotations), [Mistral cookbook](https://docs.mistral.ai/resources/cookbooks/mistral-ocr-data_extraction)

**GitHub Models**

- `gpt-4.1` has been free since 2026-05-10 at **10 RPM / 50 RPD**. Mini models get about 150 RPD. **Per-request limit is 8K input / 4K output tokens**, which leaves little room for a high-resolution image plus a schema — [free-model.com](https://www.free-model.com/models/github-models/gpt-4-1/), [getaitools](https://getaitools.dev/service/github-models) (secondary)

**Cloudflare Workers AI**

- 10,000 Neurons/day free. Vision models include Llama 4 Scout, Llama 3.2 11B Vision, Gemma 3 12B and **Gemma 4 26B-A4B (vision + function calling, 256K)** — [toolfreebie](https://toolfreebie.com/cloudflare-workers-ai/), [CF Gemma 4 model page](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/)

### Inferences

- A practical free setup: primary **Gemini Flash** (or Flash-Lite for classification only); fallback **Groq `qwen/qwen3.8-27b`** (fast, supports images and tools, but only 3 images per request and a short model lifetime — Groq retired three vision-capable models in 2026); second fallback **OpenRouter Gemma 4**. Keep the model ID in env, as the project already does.
- **The current `AI_PROVIDER=groq` setup cannot see images.** gpt-oss-120b is text-only, so attaching a photo would fail or be ignored. The extraction path needs its own vision-model setting (for example `VISION_PROVIDER` / `VISION_MODEL`), separate from the chat model.
- Privacy: a free-tier Gemini key sends IBANs, names and debt amounts into Google's training and review pipeline. For production with real tenant data, a paid key (Gemini paid tier is cheap) or a self-hosted parser is the defensible choice. Flag this to the product owner.

### Gaps

- NVIDIA NIM (build.nvidia.com) and Hugging Face Inference Providers free vision offerings and limits were not researched in this session.
- Exact current Gemini free RPD per model (they are account-specific and live in AI Studio), and whether Gemini 3.8 Flash is on the free tier at all.
- OpenRouter `:free` rate limits for 2026 and per-model image limits were not verified.
- GitHub Models image token accounting and max images per request were not found.
- Z.ai/Zhipu free GLM-4.6V-Flash API availability was not verified.

---

## 4. Architecture for a Vercel AI SDK v6 Next.js app

### Takeaway

Use a **dedicated extraction endpoint**, not the chat tool loop: client-side HEIC→JPEG and resize → one VLM call with `generateText` + `Output.object` (Zod, discriminated by `docType`) and the image as a file/image part → deterministic validators (IBAN mod-97, EDRPOU checksum, sums, dates, meter monotonicity) → a confirmation UI (or AI SDK 6 tool-approval) that creates entities only after the user approves. ConfBench found that giving the model both **OCR text and the image** beats image-only for accuracy and confidence. A hybrid "transcribe → extract from image + transcript" is worth its extra call for amounts and IDs.

### Cited Findings

**AI SDK v6 mechanics**

- Structured output is `generateText`/`streamText` with `output: Output.object({ schema })` (Zod, Valibot or JSON Schema; `.describe()` improves quality). It can be combined with tools; "generating the structured output counts as a step", so `stopWhen` must allow enough steps. Errors: `NoObjectGeneratedError` (parse or validation failure) and `NoOutputGeneratedError` (final step had no output) — [AI SDK: Generating Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data). `generateObject`/`streamObject` are still exported in `ai` 6.0.238 — [local node_modules/ai/dist/index.d.ts](file:///Users/admin/projects/task-monitoring-app/node_modules/ai/dist/index.d.ts)
- Prompt part types in the installed SDK: `ImagePart { type: 'image'; image: DataContent | URL; mediaType?: string }` and `FilePart { type: 'file'; data: DataContent | URL; mediaType: string; filename?: string }`. DataContent is base64 string, Uint8Array, ArrayBuffer or Buffer — [local node_modules/@ai-sdk/provider-utils/dist/index.d.ts](file:///Users/admin/projects/task-monitoring-app/node_modules/@ai-sdk/provider-utils/dist/index.d.ts). The docs page shows the `type:'file'` form for images and says the SDK downloads URLs itself when the provider cannot fetch them (`experimental_download` lets you customise this) — [AI SDK prompts](https://ai-sdk.dev/docs/foundations/prompts)
- UI side: `sendMessage({ text?, files?: FileList | FileUIPart[] })`. `FileUIPart = { type:'file'; mediaType; filename?; url }` where `url` is a hosted URL or a **data URL**. `convertFileListToFileUIParts()` and `convertToModelMessages()` are exported — [local node_modules/ai/dist/index.d.ts](file:///Users/admin/projects/task-monitoring-app/node_modules/ai/dist/index.d.ts). UIMessages do not carry provider options, so convert first — [AI SDK prompts](https://ai-sdk.dev/docs/foundations/prompts)
- AI SDK 6 ships tool-approval primitives (`ToolApprovalRequestOutput`, `ChatAddToolApproveResponseFunction`, `lastAssistantMessageIsCompleteWithApprovalResponses`) in the installed package — [local node_modules/ai/dist/index.d.ts](file:///Users/admin/projects/task-monitoring-app/node_modules/ai/dist/index.d.ts); the AI SDK 6 release post covers them — [Vercel: AI SDK 6](https://vercel.com/blog/ai-sdk-6)

**Providers that take images and tools in the same call**

- Gemini 3: structured outputs together with function calling — [Google Developers Blog](https://developers.googleblog.com/new-gemini-api-updates-for-gemini-3/). Groq `qwen/qwen3.8-27b`: tool use and JSON mode with images — [Groq vision](https://console.groq.com/docs/vision). Cloudflare Gemma 4 26B-A4B: vision and function calling — [CF docs](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/)

**Payload limits and HEIC**

- Vercel Functions: **4.5 MB max request or response body**, beyond which you get 413 `FUNCTION_PAYLOAD_TOO_LARGE`. Workarounds: upload from the client to storage (for example Vercel Blob) and pass a URL — [Vercel limits](https://vercel.com/docs/functions/limitations), [Vercel KB](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions)
- iOS: with `accept="image/jpeg"` iOS converts to JPEG automatically. Safari 17+ with `accept="image/*,image/heic"` hands over a `.heic` file. Chrome does not decode HEIC, so a JS converter (heic2any) is the common fallback — [Apple dev forums](https://developer.apple.com/forums/thread/743049), [shkspr.mobi](https://shkspr.mobi/blog/2020/12/coping-with-heic-in-the-browser/), [heic2any](https://github.com/aselivanov/heic2any)
- Gemini accepts HEIC and HEIF natively — [Gemini image docs](https://ai.google.dev/gemini-api/docs/image-understanding). Groq and OpenAI-compatible hosts were not confirmed to.

**Single-pass vs two-stage**

- ConfBench (Aug 2026; 75 verified invoices with 1,346 degraded variants and 70K+ entity evaluations): "**OCR+Image** consistently occupies the upper-right region" for both accuracy and AUROC, beating image-only and OCR-only on every model tested — [ConfBench](https://arxiv.org/html/2608.01792v1)
- Mistral's own two-stage product runs OCR → markdown, then the annotation LLM applies a JSON schema over the markdown plus up to 8 extracted images — [Mistral annotations](https://docs.mistral.ai/capabilities/OCR/annotations)

### Inferences (recommended design for this repo)

1. **Client:** accept `image/*` (and PDF). If the file is HEIC and the browser is not Safari, convert with heic2any; otherwise draw to canvas. Resize the long edge to about 2000–2400 px, JPEG quality about 0.85, EXIF orientation applied; keep ≤1.5 MB. The base64 data URL grows by about 33%, so this stays under the 4.5 MB Vercel body limit. Multi-page documents go up as separate images, or through Blob URLs.
2. **Endpoint** `pages/api/documents/extract.ts`, separate from `/api/chat` so the chat's text-only Groq default does not break it. Use `generateText({ model: visionModel, output: Output.object({ schema }), messages: [{ role:'user', content:[{type:'text', text: SYSTEM_EXTRACT_PROMPT}, {type:'image', image: bytes, mediaType:'image/jpeg'}] }], temperature: 0, providerOptions: { google: { mediaResolution: 'high' } } })`. No tools here, and no DB access from the model.
3. **Classification:** either (a) one call whose schema is `z.discriminatedUnion('docType', [invoice, utilityBill, meterReading, bankStatement, debtorList, unknown])`, or (b) a cheap Flash-Lite classify call (`docType` + `confidence` + `language` + `isHandwritten`) followed by a type-specific schema. Option (b) keeps each schema small, which helps smaller and free models and makes routing easy (for example, handwriting → force manual review; meter → meter-specific prompt).
4. **Schema design for numbers:** return every number as a **string exactly as printed** (`amountRaw: "1 234,56"`, `ibanRaw`, `edrpouRaw`) plus a normalised value computed in code, never by the model. Add per-field `confidence: 'high'|'medium'|'low'`, `sourceText` and `notFound` flags. For meters, use `integerDigits`, `fractionDigits`, `meterSerial`, `unit`, `displayType: 'drum'|'lcd'|'dial'`.
5. **Validators (deterministic, server-side):** UA IBAN format and ISO 13616 mod-97, with the bank MFO inside the IBAN matched against a bank list; EDRPOU 8-digit checksum; sum of line items vs total and VAT (20%) arithmetic; dates within a plausible range, period as a month; meter reading ≥ previous reading and a delta within the historical range. Any failure → field marked "check", never silently corrected.
6. **Human in the loop:** show the photo and the pre-filled form side by side, with failed or low-confidence fields highlighted. Match extracted EDRPOU/IBAN against existing companies and domains (the "propose, don't create" step). Only the user's confirm button, or an AI SDK 6 tool-approval response when done inside chat, calls the existing create APIs, with normal ownership and permission checks.
7. **Hybrid for money fields (optional):** call 1 "transcribe verbatim to markdown" → call 2 "extract JSON from image + transcript". This follows ConfBench's OCR+Image result and gives a text trail for the review UI. It doubles free-tier quota use.

### Gaps

- Not confirmed: whether Gemini's structured output accepts a Zod `discriminatedUnion` (anyOf) schema without the AI SDK falling back to JSON mode. Test it or use option (b).
- No source compared single-pass and two-stage accuracy specifically on photos of Cyrillic documents.
- The IBAN mod-97 and EDRPOU checksum algorithms were not sourced in this session. The EDRPOU rule usually cited: weights 1–7 (or 7,1–6 for codes between 30000000 and 60000000), with a +2 weight retry when the remainder is 10. Verify against an official description before implementing.

---

## 5. Hallucination risk and confidence handling for numbers

### Takeaway

With generative OCR the main risk is **plausible invented values**, not garbled characters. Token log-probabilities are poorly calibrated for extraction, and verbalized confidence is only as good as the model. Rely on **deterministic validation, cross-call or cross-model agreement, and mandatory human confirmation** for every money, ID and meter value.

### Cited Findings

- On DocILE (55-field invoices), frontier LLMs fail on **26% of fields**, and logprob-mean confidence underperforms. **ExtractConf**, which combines cross-call disagreement, LLM uncertainty, OCR, image quality and layout, reaches **0.928 ROC AUC** and reduces selective-prediction risk by **70%** over logprob-mean — [search snippet citing arXiv 2606.24420](https://arxiv.org/html/2606.24420)
- ConfBench: verbalized vs logprob confidence depends on the model. Qwen 3.6-27B: verbalized AUROC 0.72 vs logprob first-token 0.62. Gemma 3-12B: the reverse, 0.64 vs 0.58. Bigger is not better: Qwen 3.6-27B (0.72) beat Qwen3-VL-235B (0.62). First-token logprob beat mean-token. Recommendations: use OCR+Image input, choose models on accuracy and AUROC together, and use confidence to prioritise review rather than replace it — [ConfBench](https://arxiv.org/html/2608.01792v1)
- Weighted accuracy on invoices (ConfBench): Gemma 3-12B 0.65 WOA, F1 0.28, well below the frontier models (0.71–0.77 WOA) — [ConfBench](https://arxiv.org/html/2608.01792v1)
- "Generative OCR shifts the core risk from misrecognition to hallucination" — [processconverted](https://processconverted.com/posts/vision-language-models-vs-traditional-ocr-in-enterprise-pipelines). See also the NeurIPS 2025 work on OCR hallucinations in degraded documents — [Seeing is Believing?](https://papers.nips.cc/paper_files/paper/2025/file/6b628a3d7cb8055eb6fd2dd48c586347-Paper-Conference.pdf)
- MeasureBench: models give plausible-sounding reasoning but "big numeric errors" when they locate the indicator wrongly — [MeasureBench](https://arxiv.org/abs/2510.26865)
- Mistral OCR 4 returns per-word confidence scores, which can flag weak digits — [Mistral OCR 4](https://mistral.ai/news/ocr-4/)
- Gemma 4 OCR gets noticeably worse at small vision-token budgets. Gemini exposes `media_resolution`, so use a high setting for small print — [Datature](https://datature.io/blog/gemma-4-what-computer-vision-engineers-actually-need-to-know), [Gemini docs](https://ai.google.dev/gemini-api/docs/image-understanding)

### Inferences

- Cheap free-tier confidence signal: run extraction **twice** (for example Gemini Flash + Groq qwen3.8-27b, or the same model at two resolutions) and compare critical fields character by character (IBAN, EDRPOU, amounts, readings). If they disagree, mark the field "check". This is a simple version of the cross-call-disagreement signal that ExtractConf found most useful.
- Tell the model to return `null` plus `notFound: true` rather than guess. Reject outputs whose `sourceText` is absent or does not contain the normalised value.
- Never let the model do arithmetic (VAT, totals, consumption). Compute these in code and compare with the printed values.
- Blurry or glare photos: ask for a retake, using a simple client-side blur/brightness check or the model's own `imageQuality` field, before extracting at all.

### Gaps

- No calibration data specific to Gemini Flash (3.x), Qwen3.8 or Gemma 4 on invoice extraction.
- No measured hallucination rate for Cyrillic digits and amounts in phone photos.
