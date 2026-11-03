# Замініть gpt-oss на Qwen3.8 і Flash-Lite

Станом на 26 вересня 2026 найкраща безкоштовна заміна `openai/gpt-oss-120b` для багатокрокового tool calling українською — **`qwen/qwen3.8-27b` на тому самому Groq-ключі**, із `gemini-3.5-flash-lite` як запасною. Для створення сутностей з фото без тексту основна модель — **`gemini-3.5-flash-lite`**, а `qwen/qwen3.8-27b` служить запасною і перехресною перевіркою. Поточний `gpt-oss-120b` на Groq зображень не приймає взагалі, тому фото-потік на ньому неможливий. Оскільки зараз активний `AI_PROVIDER=groq`, заміна текстової моделі зводиться до `GROQ_MODEL=qwen/qwen3.8-27b`. Проте слабке місце не лише в моделі. У `common/services/aiAssistant/tools/index.ts` є тільки `getMyPayments`, `findDomains`, `findCompanies` і `previewInvoice`. Жоден із них нічого не записує в базу, а **інструментів для створення компаній, доменів, послуг чи наповнення боржників немає зовсім**, тож сильніша модель цих можливостей не додасть.

Безкоштовних варіантів за рік поменшало. Cerebras скасував постійний free tier, GitHub Models закрили, SambaNova дає 20 запитів на добу, а Gemini Flash має близько 20 RPD на проєкт. Практично придатними лишилися два варіанти: Groq (30 RPM, 1K RPD, 8K TPM і 200K TPD на модель) та Gemini Flash-Lite (близько 15 RPM і 500 RPD). Вирішальне обмеження — приватність. Безкоштовний Gemini використовує запити й зображення для навчання, їх можуть читати люди-рецензенти, і Google прямо просить не надсилати туди персональні дані. Тому **реальні IBAN, ПІБ і борги мешканців можна надсилати в Gemini лише з проєкту з увімкненим білінгом**, що коштує центи. Публічних українських бенчмарків для жодної з цих моделей немає, тож вибір треба підтвердити на власних документах.

| Сценарій                                        | Основна модель                                       | Запасна                                                            | Ескалація (платно)                               |
| ----------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| Текст українською → багатокроковий tool calling | `qwen/qwen3.8-27b` (Groq, free)                      | `gemini-3.5-flash-lite` (Google); аварійно — `openai/gpt-oss-120b` | `gemini-3.8-flash`                               |
| Фото без тексту → JSON → сутності               | `gemini-3.5-flash-lite` (Google, проєкт із білінгом) | `qwen/qwen3.8-27b` (Groq, free), також як друга думка              | `gemini-3.8-flash`; для рукопису — Mistral OCR 4 |

Якщо власник категорично відмовляється від будь-якого білінгу, основною для фото стає `qwen/qwen3.8-27b` на Groq. Безкоштовний Gemini тоді придатний лише для тестових або знеособлених документів.

## Чотири інструменти, і жоден не пише в базу

Скарга «модель надто слабка» частково стосується набору інструментів, а не моделі. `buildAssistantTools` повертає рівно чотири інструменти, і три з них лише читають: `getMyPayments`, `findDomains` і `findCompanies`. Четвертий, `previewInvoice`, за власним описом «НІЧОГО не зберігає в базі». Він будує чернетку й відкриває заповнену форму `AddPaymentModal`, а зберігає її користувач. Отже, навіть інвойс асистент сьогодні не створює, а лише пропонує. Це свідоме рішення. `userContext` захоплюється в замиканні, модель задає тільки параметри, а права завжди беруться із сесії. Серверні POST-обробники для компаній (модель `RealEstate`), доменів і послуг уже є: `pages/api/real-estate/index.ts`, `pages/api/domain/index.ts` і `pages/api/service/index.ts`. Нові інструменти мають обгортати ту саму логіку з тими самими перевірками прав, а не дублювати її.

З боржниками складніше. **`pages/api/debtors/index.ts` обробляє тільки GET** і обчислює `totalDebt` з `RealEstate` та `Payment`, тож окремої сутності «боржник», у яку можна писати, не існує. Найближчий запис — POST у `pages/api/debt-calculation`, де зберігається один розрахунок на пару «домен — компанія». Тож «заповнити таблицю боржників зі списку» означає два кроки. Спершу кожен рядок треба зіставити з наявною компанією. Потім треба записати або вхідний борг як платіж, або дані розрахунку заборгованості. Це продуктове рішення слід ухвалити до написання інструменту, інакше жодній моделі нема куди покласти результат.

Ще три обмеження теж не залежать від моделі.

- **Ліміт кроків.** `AI_MAX_STEPS = 5` у `config.ts` не вмістить ланцюжок «знайти домен → створити компанію → створити послугу → підготувати інвойс → відповісти». Особливо це стосується `gpt-oss-120b`: на Groq він не підтримує паралельні виклики інструментів і витрачає окремий крок на кожен пошук ([Groq Tool Use](https://console.groq.com/docs/tool-use)).
- **Розмір запиту.** `pages/api/chat.ts` оголошує `bodyParser: true` без `sizeLimit`, тобто працює зі стандартним лімітом Next.js в 1 МБ ([Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)). Фото з телефона у вигляді data URL туди не пройде.
- **Підтвердження дій.** Інструменти для створення варто будувати за тим самим принципом «запропонуй — підтверди», що й `previewInvoice`. Це можуть бути чернетки, які відкривають заповнені форми. Інший варіант — прапорець `needsApproval`, який AI SDK 6 додав до визначення інструменту ([Vercel: AI SDK 6](https://vercel.com/blog/ai-sdk-6)). Він уже є у встановленій версії `ai` 6.0.238.

## У вересні 2026 реально працюють лише Groq і Gemini Flash-Lite

У таблиці нижче зведено всі варіанти, які на 26 вересня 2026 ще мають безкоштовний доступ до сильних моделей або мали його донедавна.

| Варіант                                                  | Безкоштовні ліміти                                               | Tool calling                           | Зображення                          | Головний ризик                                     |
| -------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------- | ----------------------------------- | -------------------------------------------------- |
| Groq `openai/gpt-oss-120b` (зараз)                       | 30 RPM, 1K RPD, 8K TPM, 200K TPD                                 | так, без паралельних викликів          | ні                                  | слабший tool calling, лише текст                   |
| Groq `qwen/qwen3.8-27b`                                  | ті самі, окремо для моделі                                       | так, паралельні, strict JSON Schema    | так, до 3 на запит, по 2048 токенів | статус Preview, ID часто змінюється                |
| Gemini `gemini-3.5-flash-lite` / `gemini-3.1-flash-lite` | ≈15 RPM, ≈500 RPD, ≈250K TPM на проєкт*                          | так                                    | так, включно з HEIC                 | навчання на даних free tier                        |
| Gemini `gemini-3.8-flash` (і 3.7/3.6/3.5 Flash)          | ≈5 RPM, ≈20 RPD на проєкт*                                       | так, найсильніший у лінійці            | так                                 | квоти вистачає на кілька задач на день             |
| Gemini API `gemma-4-31b-it`                              | ≈30 RPM, 14 400 RPD, ≈16K TPM*                                   | заявлено, через AI SDK не підтверджено | так                                 | малий TPM, навчання на даних                       |
| OpenRouter `:free` (Qwen3.8, Gemma 4, Nemotron 3)        | 20 RPM, 50 RPD на всі free-моделі (1000 після поповнення на $10) | так                                    | частково                            | Qwen free працює у fp4, політики провайдерів різні |
| Cerebras                                                 | лише $5 кредиту на 30 днів після прив'язки картки, 5 RPM         | так                                    | так                                 | постійного free tier більше немає                  |
| SambaNova                                                | 20 RPM, 20 RPD, 200K TPD                                         | так, крім Gemma 4                      | лише Gemma 4, без tools             | 20 запитів на добу                                 |
| Z.ai `GLM-4.6V-Flash`                                    | безкоштовно, ≈1 одночасний запит (сторонні дані)                 | так, нативно у vision-моделі           | так                                 | політика даних не перевірена                       |
| GitHub Models                                            | закрито 2026-07-30                                               | —                                      | —                                   | —                                                  |

\*Google не публікує безкоштовні ліміти, тож числа взято з архівного знімка списку cheahjs і з форуму розробників.

**У Groq безкоштовно доступні лише чотири чат-моделі, і в усіх однакові ліміти** ([Groq Rate Limits](https://console.groq.com/docs/rate-limits)). Llama 3.x, Llama 4, Kimi K2 і Qwen3-32B за 2026 рік прибрали з free tier. `qwen/qwen3.6-27b` замінили на `qwen/qwen3.8-27b` 14 вересня 2026 ([Groq Deprecations](https://console.groq.com/docs/deprecations)).

**Google свої безкоштовні ліміти не публікує.** Сторінка лімітів відсилає до AI Studio і попереджає, що квоти рахуються на проєкт, а не на ключ ([Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)). Числа в таблиці взято з архівного знімка списку cheahjs від 6 серпня ([cheahjs, архів](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)). Сам репозиторій тепер повертає 404, а схожий на нього `nherx/free-llm-api-resources` пропонує завантажити `.zip`, що є типовою пасткою зі шкідливим ПЗ. Ліміт у 20 RPD для `gemini-3.8-flash` підтверджує допис на форумі розробників від 3 вересня ([Google AI Developers Forum](https://discuss.ai.google.dev/t/gemini-3-8-flash-free-tier-20-rpd-is-too-limited-for-practical-evaluation/180609)). Квоти вже тричі різали без записів у changelog. У грудні 2025 їх зменшили на 80–92% ([Yahoo Tech](https://tech.yahoo.com/ai/gemini/articles/gemini-slashed-free-api-limits-140016369.html)). Далі Pro-моделі зникли з безкоштовного тарифу ([Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)), а з 18 вересня 2026 нові проєкти вже не можуть користуватися моделями 2.5 ([Gemini changelog](https://ai.google.dev/gemini-api/docs/changelog)).

Решта ринку ще гірша.

- **Cerebras** вимагає картку і дає лише $5 кредиту на 30 днів при 5 RPM ([Cerebras Rate Limits](https://inference-docs.cerebras.ai/support/rate-limits)).
- **SambaNova** має ліміт 20 RPD ([SambaNova Rate Limits](https://docs.sambanova.ai/docs/en/models/rate-limits)).
- **OpenRouter** обмежує free-моделі до 50 RPD на всіх разом ([OpenRouter Limits](https://openrouter.ai/docs/api-reference/limits)). Його безкоштовний Qwen3.8 працює в квантизації fp4 ([OpenRouter endpoints](https://openrouter.ai/api/v1/models/qwen/qwen3.8-27b:free/endpoints)).
- **GitHub Models** повністю закрили 30 липня 2026 ([GitHub Changelog](https://github.blog/changelog/2026-07-30-github-models-is-now-retired/)).
- **NVIDIA** прямо забороняє виробниче використання пробного доступу ([NVIDIA API Trial Terms](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf)).
- **Mistral** дає $10 кредитів на місяць, але ліміти показує лише в консолі ([Mistral pricing](https://mistral.ai/pricing)).
- **Cloudflare** дає 10 000 neurons на добу ([Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)). З моделлю Qwen3.8 цього вистачає приблизно на 25 кроків агента.

Звідси практичний висновок: безкоштовні моделі змінюються швидше, ніж релізиться застосунок. Groq вимикав моделі через 17–60 днів після оголошення, найчастіше менш ніж за місяць ([Groq Deprecations](https://console.groq.com/docs/deprecations)). OpenRouter між 6 серпня і 26 вересня прибрав п'ять безкоштовних моделей і додав сім, тобто замінив близько чверті списку ([OpenRouter models API](https://openrouter.ai/api/v1/models)). Тому ID моделі має лишатися конфігурацією, і `config.ts` це вже підтримує через `GROQ_MODEL` і `GOOGLE_MODEL`.

## Qwen3.8-27B замінює gpt-oss однією змінною середовища

Скарги на `gpt-oss-120b` мають конкретні причини.

- **Немає паралельних викликів.** На Groq ця модель не підтримує паралельні виклики інструментів.
- **Збої формату викликів.** У серпні 2025 розробники повідомляли про помилки 400 `tool_use_failed` («Failed to parse tool call arguments as JSON») на Groq. Задачу закрили як неактивну без відповіді Groq ([OpenHands #10187](https://github.com/OpenHands/OpenHands/issues/10187)).
- **Сильна залежність від reasoning effort.** Власний model card OpenAI показує Tau-Bench Retail **49.4 / 62.0 / 67.8** на низькому, середньому й високому рівні міркувань. Мультимовний MMMLU тестували на 14 мовах, серед яких немає української ([gpt-oss model card](https://arxiv.org/html/2508.10925v1)). `config.ts` рівень міркувань не передає, а Groq не документує значення за замовчуванням. Тож частина «слабкості» може бути просто наслідком низького рівня міркувань.

`qwen/qwen3.8-27b` за офіційною карткою помітно сильніший за попередника Qwen3.6-27B ([HF Qwen/Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B)):

- IFBench (виконання інструкцій): **79.5 проти 69.1**;
- Terminal Bench 2.1: 73.0 проти 63.4;
- OSWorld-Verified: 84.3 проти 63.9.

В Artificial Analysis Intelligence Index він набрав 52 проти 38 у Qwen3.6 ([Hacker News](https://news.ycombinator.com/item?id=49334544)). На Groq модель підтримує tool use, паралельні виклики, strict JSON Schema, reasoning і зображення ([Groq: qwen3.8-27b](https://console.groq.com/docs/model/qwen/qwen3.8-27b)). Для переходу досить виставити `GROQ_MODEL=qwen/qwen3.8-27b` і додати `providerOptions: { groq: { reasoningEffort: 'low' } }`. Встановлений `@ai-sdk/groq` 3.0.52 уже приймає значення `none | default | low | medium | high`, а ID моделі передає як рядок, хоча таблиця моделей у документації AI SDK застаріла ([AI SDK Groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq)). Нижчий рівень міркувань потрібен тому, що за замовчуванням Qwen3.8 думає довго: коментатори бачили приблизно в 2.3 раза більше токенів, ніж у моделі для порівняння ([Hacker News](https://news.ycombinator.com/item?id=49334544)).

**Справжнє вузьке місце Groq — 8K TPM і 200K TPD, а не якість моделі.** Далі моя оцінка. `prompt.ts` займає 8.5 КБ українського тексту, тобто приблизно 2K токенів. Разом зі схемами інструментів та історією розмови один крок займе 4–6K токенів, коли додадуться інструменти для створення. Кожен крок заново надсилає весь контекст. Тому хвилинного ліміту вистачить на два кроки, а добового — на 35–50 кроків. Це приблизно **10–12 чотирикрокових задач на добу на модель для всієї організації**. Пом'якшити це можна трьома способами:

- через `activeTools` або `prepareStep` передавати на кожному кроці лише потрібні схеми;
- покладатися на паралельні виклики, які Qwen підтримує;
- обрізати історію розмови.

Groq задає ліміти окремо для кожної моделі. Тому `openai/gpt-oss-120b`, найстабільніший ID у Groq з 2025 року, імовірно має власну квоту і годиться як аварійний запасний варіант. Коли адміністратори стабільно виконуватимуть понад 10–20 багатокрокових задач на добу, основну текстову модель варто перевести на `gemini-3.5-flash-lite` з білінгом. Ще один ризик — статус Preview. ID Qwen на Groq змінювався тричі приблизно за 14 місяців: `qwen-qwq-32b` → `qwen3-32b` → `qwen3.6-27b` → `qwen3.8-27b` ([Groq Deprecations](https://console.groq.com/docs/deprecations)).

**Запасна модель — `gemini-3.5-flash-lite` із зафіксованим ID.** Google сам радить для нових проєктів «3.5 Flash-Lite or 3.8 Flash» ([Gemini Models](https://ai.google.dev/gemini-api/docs/models)). Порівняно з 3.1 Flash-Lite вона має OSWorld-Verified 74.0 проти 54.3 і Terminal-bench 2.1 54.0 проти 31.0 ([Gemini 3.5 Flash-Lite model card](https://deepmind.google/models/model-cards/gemini-3-5-flash-lite/)). Отже, в агентних задачах вона слабша за Qwen3.8 (54.0 проти 73.0 на Terminal-bench 2.1). Натомість у неї значно більша квота, статус GA і не оголошено дати вимкнення ([Gemini Deprecations](https://ai.google.dev/gemini-api/docs/deprecations)).

Поточний аліас `gemini-flash-latest` варто прибрати. Останній задокументований перемикач 19 травня 2026 спрямував його на `gemini-3.5-flash` ([Gemini changelog](https://ai.google.dev/gemini-api/docs/changelog)). Цю модель Google тепер називає legacy, у платному тарифі вона найдорожча ($1.50 / $9.00 за 1M токенів), а безкоштовно дає близько 20 RPD. До того ж аліас можуть перемкнути будь-коли, і попереджають за два тижні лише про несумісні зміни ([Gemini Models](https://ai.google.dev/gemini-api/docs/models)).

На Gemini є кілька відомих пасток:

- **Режим виклику інструментів.** Режим `VALIDATED` на 3.8 Flash спричиняв `MALFORMED_FUNCTION_CALL`, а перехід на `AUTO` це виправив ([pi-oauth-antigravity #2](https://github.com/heyhuynhgiabuu/pi-oauth-antigravity/issues/2)). Той самий збій буває, якщо просити модель вивести JSON або XML безпосередньо перед викликом ([Gemini Function calling](https://ai.google.dev/gemini-api/docs/function-calling)).
- **Параметри семплінгу.** `temperature`, `top_p` і `top_k` офіційно застаріли з 21 липня 2026 ([What's new in Gemini 3.5](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5)).
- **`thinkingLevel`.** 3.8 Flash повертає помилку на `thinkingLevel: 'minimal'` ([Latest model guide](https://ai.google.dev/gemini-api/docs/latest-model)).
- **Output.object разом з інструментами.** Поєднання в одному виклику доступне лише як Preview для серії Gemini 3 ([Gemini Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)) і вже ламалося через AI SDK ([vercel/ai #11947](https://github.com/vercel/ai/issues/11947)).

Для ескалації найсильніший варіант — `gemini-3.8-flash` (Terminal-bench 2.1 89.4, Finance Agent v2 61.4) ([Gemini 3.8 Flash model card](https://deepmind.google/models/model-cards/gemini-3-8-flash/)). Безкоштовно вона дає лише 20 RPD. Платно коштує $0.75 / $3.75 до 31 грудня 2026, а потім $1.50 / $7.50 ([Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)).

Коментар у `config.ts` навмисно відкидає тихий відкат на слабшу модель, і це варто зберегти. Перемикатися на запасну модель слід лише на помилках 429, 5xx або 404, записувати перемикання в лог і показувати його адміністратору.

## Фото без тексту: Flash-Lite читає, Qwen перевіряє, людина підтверджує

Для розпізнавання документів найкращі незалежні дані є в Gemini.

- **IDP-лідерборд.** Gemini 3 Flash посідає **перше місце з 29 на OmniDocBench v1.5 (90.1)**, має 91.1 у витяганні ключових полів і 82.0 загалом. Для порівняння, Gemini 3 Pro має 82.8, а GPT-5.4 — 83.5 ([IDP Leaderboard: Gemini 3 Flash](https://benchmarking.nanonets.com/models/gemini-3-flash); [IDP Leaderboard](https://benchmarking.nanonets.com/)). Слабкі місця — старі скани (45.8) і колонтитули (27.4).
- **Кирилиця.** Gemini 3.1 Flash-Lite посів перше місце з 14 у GlotOCR Bench: точність Acc@5 **88.8%** і CER **3.0%** на кирилиці ([GlotOCR Bench](https://arxiv.org/html/2604.12978v1)). Проте це синтетичний друкований текст без рукопису і без окремого українського тесту.
- **Призначення моделі.** 3.5 Flash-Lite Google прямо позиціонує для «document parsing… simple data extraction» ([Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)).
- **Формати й розмір.** Gemini приймає HEIC і HEIF без конвертації, а вбудовані дані запиту обмежені 20 МБ ([Gemini Image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)).
- **Роздільна здатність.** У Gemini 3 зображення за замовчуванням уже коштує 1120 токенів, як у режимі `high` ([Gemini Media resolution](https://ai.google.dev/gemini-api/docs/media-resolution)). Встановлений `@ai-sdk/google` 3.0.103 для generateContent пропонує лише `MEDIA_RESOLUTION_*` без `ultra_high`, тож налаштування за замовчуванням достатньо.

Qwen3.8-27B на папері не гірший: 91.1 на OmniDocBench 1.5 за карткою самого розробника ([HF Qwen/Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B)). Але безкоштовний Groq дозволяє не більше трьох зображень на запит, і кожне коштує 2048 токенів ([Groq Vision](https://console.groq.com/docs/vision)). Тому триаркушна виписка майже вичерпує хвилинний ліміт у 8K TPM. До того ж Groq не поєднує structured outputs з інструментами чи стримінгом, а в strict-режимі кожне поле має бути обов'язковим ([Groq Structured Outputs](https://console.groq.com/docs/structured-outputs)). Звідси його роль: запасна модель і друга думка.

Не всі типи документів однаково надійні.

- **Лічильники.** Бенчмарк MeasureBench показав, що Gemini 2.5 Pro впізнає одиниці виміру у **96.2%** випадків, а правильне значення зчитує лише у **30.7%**. Цифрові дисплеї досягають 80.2%, стрілкові й лінійні прилади — лише 10–32% ([MeasureBench](https://arxiv.org/abs/2510.26865)). Барабанні лічильники води й газу ближчі до цифрових. Проте барабан може застигнути між цифрами, а червоні дробові розряди модель може прочитати як цілі. Тому цілу й дробову частину краще просити окремими полями.
- **Рукописні списки боржників.** Публічних бенчмарків немає взагалі, тож такі поля за замовчуванням вважаються малонадійними. Якщо рукопис стане основним сценарієм, є платна ескалація — Mistral OCR 4. Виробник заявляє 170 мов, розпізнавання рукопису і впевненість для кожного слова за $4 за 1000 сторінок ([Mistral OCR 4](https://mistral.ai/news/ocr-4/)).
- **Банківські виписки.** У застосунку вже є `pages/api/bankapi` і модель `BankTransactions`, тож фото виписки має лишатися запасним шляхом.

**Фото варто обробляти в окремому ендпоінті, а не в чаті.** Для цього знадобиться `pages/api/documents/extract.ts` із власними `VISION_PROVIDER` і `VISION_MODEL`. Модель у ньому не отримує інструментів і доступу до бази, а виклик робиться без стримінгу через `generateText` з `Output.object` ([AI SDK: Generating Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)).

На клієнті потрібна така підготовка фото:

- **HEIC.** Для браузерів, крім Safari, файли HEIC треба конвертувати в JPEG через heic2any ([heic2any](https://github.com/aselivanov/heic2any)).
- **Розмір.** Довгу сторону варто зменшити до 2000–2400 px, а файл тримати в межах 1.5 МБ при якості JPEG близько 0.85.
- **Ліміт тіла запиту.** Ендпоінт має явно задати `bodyParser.sizeLimit`. Якщо застосунок хоститься на Vercel, діє жорстка межа тіла запиту в 4.5 МБ ([Vercel Functions limits](https://vercel.com/docs/functions/limitations)).

`sharp` уже є в залежностях і може вирівняти орієнтацію та формат на сервері.

Схема має бути пласким `z.object` з `docType: z.enum([...])` і nullable-підоб'єктами для кожного типу, а не `z.discriminatedUnion`. AI SDK попереджає, що `z.union` і `z.record` з Gemini не працюють ([AI SDK v6 Google provider](https://ai-sdk.dev/v6/providers/ai-sdk-providers/google-generative-ai)), а strict-режим Groq вимагає `.nullable()` замість `.optional()`. Як саме `.nullable()` конвертується для обох провайдерів, варто перевірити тестом.

```ts
// pages/api/documents/extract.ts — окремо від /api/chat: без tools і без доступу до БД
import { generateText, Output } from 'ai'
import { z } from 'zod'

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } }

const raw = z.string().nullable() // рядок точно як надруковано: "1 234,56", "UA21 3223…"
const docSchema = z.object({
  docType: z.enum([
    'invoice',
    'utilityBill',
    'meterReading',
    'bankStatement',
    'debtorList',
    'unknown',
  ]),
  imageQuality: z.enum(['good', 'blurry', 'glare', 'cropped']),
  invoice: z
    .object({ edrpouRaw: raw, ibanRaw: raw, totalRaw: raw, periodRaw: raw })
    .nullable(),
  meter: z
    .object({
      serialRaw: raw,
      integerDigits: raw, // чорні барабани
      fractionDigits: raw, // червоні барабани
      displayType: z.enum(['drum', 'lcd', 'dial']).nullable(),
    })
    .nullable(),
  debtors: z
    .array(
      z.object({
        nameRaw: z.string(),
        flatRaw: raw,
        debtRaw: raw,
        confidence: z.enum(['high', 'medium', 'low']),
      })
    )
    .nullable(),
})

const { output } = await generateText({
  model: getVisionModel(), // VISION_PROVIDER / VISION_MODEL, окремо від чату
  output: Output.object({ schema: docSchema }),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: EXTRACT_PROMPT_UK }, // текст перед зображенням
        { type: 'image', image: jpegBytes, mediaType: 'image/jpeg' },
      ],
    },
  ],
  // Gemini 3.x: без temperature. Groq: providerOptions: { groq: { reasoningEffort: 'low' } }
})
// далі: validateIban / validateEdrpou / resolvePrevReading → форма підтвердження
```

Числа модель повертає тільки рядками, а нормалізує й рахує їх код. Детерміновані перевірки такі:

- **IBAN:** контрольна сума mod-97.
- **ЄДРПОУ:** контрольний розряд коду.
- **Суми:** сума рядків має дорівнювати підсумку, а ПДВ — 20%.
- **Лічильники:** нове показання не менше за попереднє. Для цього можна використати наявний `resolvePrevReading` з `common/components/Tables/PaymentsBulk/prevReading.ts`.

Поле, що не пройшло перевірку, позначається «перевірити» і ніколи не виправляється автоматично.

Для критичних полів (IBAN, ЄДРПОУ, суми, показання) варто запускати другу модель, Qwen3.8, і позначати розбіжності. ConfBench показав, що подача моделі і OCR-тексту, і зображення точніша, ніж саме зображення, на кожній протестованій моделі. Він також радить використовувати впевненість моделі, щоб визначати порядок перевірки, а не замість самої перевірки ([ConfBench](https://arxiv.org/html/2608.01792v1)).

Фінальний крок — екран, де фото й заповнена форма стоять поруч, а ЄДРПОУ та IBAN уже зіставлені з наявними компаніями. Зберігати дані можна лише через наявні POST-обробники або через інструмент із `needsApproval`.

## Безкоштовний Gemini навчається на IBAN і боргах мешканців

Умови Gemini API не залишають простору для тлумачень. На безкоштовній квоті Google використовує надіслане, включно із зображеннями й документами, «to provide, improve, and develop Google products… and machine learning technologies». Люди-рецензенти можуть читати вхідні й вихідні дані, а розробникам прямо сказано: **«Do not submit sensitive, confidential, or personal information to the Unpaid Services»** ([Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)). Для користувачів з ЄЕЗ, Швейцарії та Великої Британії навіть безкоштовна квота діє на платних умовах щодо даних, але Україна під цей виняток не підпадає. Застосунки, які обслуговують користувачів із цих країн, мусять використовувати лише платні сервіси (там само). Платний тариф на запитах не навчається і зберігає логи лише обмежений час для виявлення зловживань. «Платним» вважається доступ тільки через Cloud-проєкт з активним білінгом. Щоб перейти на Tier 1, досить прив'язати платіжний акаунт з лімітом у $250, і перехід зазвичай відбувається миттєво ([Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)). За цінами $0.30 / $2.50 за 1M токенів для 3.5 Flash-Lite ([Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)) один запит із фото коштує, за оцінкою, **$0.001–0.009**, тобто тисяча фото на місяць обійдеться в кілька доларів.

Витік стосується не лише фото. Текстовий цикл теж передає моделі дані з бази: результат `getMyPayments` потрапляє в контекст. Тому безкоштовний Gemini як основна текстова модель відправляв би платежі мешканців у конвеєр навчання. Саме це робить Groq кращим безкоштовним вибором для тексту. За замовчуванням Groq не зберігає дані запитів. Адміністратор організації може ввімкнути Zero Data Retention у Data Controls, а якщо дані все ж зберігаються, вони лежать у бакетах GCP у США ([Groq: Your Data](https://console.groq.com/docs/your-data)). Проте ця сторінка не розрізняє безкоштовний і платний тарифи і нічого прямо не каже про навчання. Умови обслуговування Groq у цьому дослідженні не перевірялися, тому «не зберігає» не дорівнює договірному «не навчає».

В інших провайдерів картина гірша або невизначена.

- **OpenRouter** сам зберігає запити лише за згодою, але провайдери безкоштовних моделей мають власні політики. Для free-моделей є окреме налаштування, що забороняє маршрутизацію до провайдерів, які навчаються на даних ([OpenRouter: Provider logging](https://openrouter.ai/docs/guides/privacy/provider-logging)).
- **NVIDIA** за пробними умовами збирає контент для покращення своїх моделей ([NVIDIA API Trial Terms](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf)).
- **Mistral** на сторінці цін показує навчання як «Opt-out» ([Mistral pricing](https://mistral.ai/pricing)). Джерело від серпня 2026 натомість стверджує, що безкоштовний план вимагає згоди на навчання ([cheahjs, архів](http://web.archive.org/web/20260806034947/https://github.com/cheahjs/free-llm-api-resources)).
- **SambaNova** на пряме запитання про зберігання й навчання публічно так і не відповіла ([SambaNova community](https://community.sambanova.ai/t/privacy-data-use-in-developer-tier/899)).

Відповідність українському законодавству про персональні дані в цьому дослідженні не аналізувалася. Це рішення власника продукту, і його варто ухвалити до запуску на реальних даних.

## Пакети лишаються на ai-v6, а змін у коді — три

`ai` 7.0.116 уже має тег `latest`, тож звичайний `npm i ai` поставить несумісну мажорну версію ([npm: ai](https://www.npmjs.com/package/ai)). Офіційні пакети `@ai-sdk/*` публікують dist-тег `ai-v6`, а сторонні провайдери підтримують v6 лише у старших мажорних версіях 2.x і 3.x ([npm: @openrouter/ai-sdk-provider](https://www.npmjs.com/package/@openrouter/ai-sdk-provider)).

| Пакет                              | Зараз (`package.json` / встановлено) | Рекомендовано                                            | Примітка                                                             |
| ---------------------------------- | ------------------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------- |
| `ai`                               | `^6.0.175` / 6.0.238                 | `ai@ai-v6` (6.0.292)                                     | `latest` — це вже v7                                                 |
| `@ai-sdk/google`                   | `^3.0.67` / 3.0.103                  | `@ai-sdk/google@ai-v6` (3.0.127)                         | невідомі ID `gemini-*` провайдер трактує як найновіше покоління      |
| `@ai-sdk/groq`                     | `3.0.52` (зафіксовано)               | за бажанням `@ai-sdk/groq@ai-v6` (3.0.69)                | ID Qwen3.8 передається рядком, а `reasoningEffort` уже підтримується |
| `@openrouter/ai-sdk-provider`      | —                                    | `^2.10.0`, лише за потреби                               | 3.x вимагає `ai ^7`                                                  |
| `workers-ai-provider` (Cloudflare) | —                                    | `^3.3.1`, лише за потреби                                | 4.x вимагає `ai ^7`                                                  |
| `@ai-sdk/mistral`                  | —                                    | `@ai-sdk/mistral@ai-v6` (3.0.67), лише для OCR-ескалації | —                                                                    |
| `zod`                              | `^4.4.3`                             | без змін                                                 | —                                                                    |

Провайдер Google з AI SDK v6 підтримує зображення, генерацію об'єктів та інструменти для всіх ID 3.x Flash ([AI SDK v6 Google provider](https://ai-sdk.dev/v6/providers/ai-sdk-providers/google-generative-ai)), тож переходити на v7 не потрібно.

Змін у коді три:

1. **`config.ts`.** Нові значення за замовчуванням: `qwen/qwen3.8-27b` для Groq і зафіксований `gemini-3.5-flash-lite` для Google. Крім того, потрібні `providerOptions` для кожного провайдера, окрема vision-конфігурація і явний запасний варіант на помилках 429, 5xx і 404.
2. **`tools/index.ts`.** Інструменти для створення компаній, доменів і послуг, кожен із `needsApproval` або формою-чернеткою. Сюди ж — рішення про модель запису боргів і `AI_MAX_STEPS` на рівні 8–10 разом з `activeTools`.
3. **Новий ендпоінт `pages/api/documents/extract.ts`.** Із власним лімітом тіла запиту та детермінованими валідаторами.

## Висновок

Безкоштовний tier у 2026 році перестав бути виробничою платформою. Кожен провайдер урізав квоти або закрився, а головний кандидат, Gemini, власними умовами виключає персональні дані. Звідси нерозумна з першого погляду, але вигідна конфігурація. Ключ Gemini з білінгом за кілька доларів на місяць плюс безкоштовний Groq як запасний дають більше надійності й приватності, ніж будь-яка суто безкоштовна модель. Безкоштовні квоти варто використовувати для розробки, як запасний варіант і для другої думки.

Довговічна інвестиція тут — не вибір моделі, бо ID змінюються кожні два-три місяці. Важать три речі, що від моделі не залежать:

- інструменти для створення сутностей з підтвердженням;
- детерміновані валідатори (IBAN, ЄДРПОУ, монотонність показань);
- власний український набір із 30–50 реальних документів на кожен тип.

Жодна публічна метрика не вимірює ні українське tool calling, ні українське OCR, тож лише такий набір покаже, чи Qwen3.8 справді кращий за Flash-Lite на ваших рахунках і лічильниках. Коли ці три речі є, заміна моделі зводиться до зміни однієї змінної середовища. Без них навіть `gemini-3.8-flash` не створить жодної компанії.
