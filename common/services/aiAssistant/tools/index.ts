import { tool, type ToolSet } from 'ai'
import { z } from 'zod'
import {
  getPayments,
  type UserContext,
} from '@common/services/paymentService/payment.service'
import {
  buildCreditDraft,
  findCompaniesByName,
  findDomainsByName,
} from '@common/services/aiAssistant/invoiceActions'
import { buildPartiesInvoiceDraft } from '@common/services/aiAssistant/invoicePartiesActions'
import { buildExpenseDraft } from '@common/services/aiAssistant/expenseActions'
import { buildServiceDraft } from '@common/services/aiAssistant/serviceActions'
import { buildDomainDraft } from '@common/services/aiAssistant/domainActions'
import { buildStreetDraft } from '@common/services/aiAssistant/streetActions'
import { buildCompanyDraft } from '@common/services/aiAssistant/companyActions'
import { sumProfitItems, PROFIT_DEFAULT_CATEGORIES } from '@utils/profit-items'

/**
 * Builds the tool set the assistant may call, bound to a specific user.
 *
 * The `userContext` is captured in a closure and never exposed to the model:
 * the LLM only supplies the declared input parameters, while identity and role
 * always come from the authenticated session. This is the core safety
 * invariant — an action can never run with wider permissions than the user
 * who triggered it. New tools (including future mutations) must follow the
 * same pattern.
 */

// What the model reads back from a preview tool: everything but `draft`. The
// widget opens the form from the full output; the draft itself (an invoice
// with every line, provider and receiver) would only be resent with every
// step, against Groq's 8K tokens-per-minute budget.
const withoutDraftForModel = {
  toModelOutput: ({ output }: { output: unknown }) => {
    const { draft: _draft, ...rest } = (output ?? {}) as Record<string, any>
    return { type: 'json' as const, value: rest }
  },
}

// Input for previewInvoice. The model supplies WHO/WHEN and the lines the user
// named, never the final amounts - those are computed server-side (tariffs
// from the Service record, quantity × price for named lines). Built per
// request: "the current month" must be today's, not the month the server
// process happened to start in.
const makePreviewInputSchema = (now: Date) =>
  z.object({
    companyId: z.string().optional().describe('Знайдена компанія-отримувач.'),
    companyName: z
      .string()
      .optional()
      .describe('Отримувач, якого не знайдено (створиться).'),
    companyEmail: z.string().optional(),
    domainId: z.string().optional().describe('Знайдений надавач.'),
    domainName: z
      .string()
      .optional()
      .describe('Надавач, якого не знайдено (створиться).'),
    street: z
      .string()
      .optional()
      .describe('Адреса нової компанії, якщо названа.'),
    city: z.string().optional(),
    month: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe(`Поточний: ${now.getMonth() + 1}.`),
    year: z
      .number()
      .int()
      .optional()
      .describe(`Поточний: ${now.getFullYear()}.`),
    currency: z
      .enum(['UAH', 'USD', 'EUR'])
      .optional()
      .describe('Лише якщо названа: $/баксі - USD, € - EUR.'),
    extraLines: z
      .array(
        z.object({
          name: z.string(),
          quantity: z.number().optional(),
          price: z.number().optional().describe('За одиницю.'),
          sum: z.number().optional(),
          description: z
            .string()
            .optional()
            .describe('Решта тексту позиції: що зроблено, період, коментар.'),
        })
      )
      .optional()
      .describe(
        'Названі позиції: «168 год по 6» -> {quantity:168, price:6}; «оренда 5000» -> {sum:5000}; «Andrii $1,980 - бекенд, жовтень» -> {name:"Andrii", sum:1980, description:"бекенд, жовтень"}.'
      ),
    onlyNamedLines: z
      .boolean()
      .optional()
      .describe('Рахунок лише з extraLines, без інших позицій компанії.'),
  })

type PreviewInput = z.infer<ReturnType<typeof makePreviewInputSchema>>

// Normalises month/year defaults.
function withDefaults(input: PreviewInput, now: Date) {
  return {
    ...input,
    month: input.month ?? now.getMonth() + 1,
    year: input.year ?? now.getFullYear(),
    lines: input.extraLines,
  }
}

// Compact, model-friendly view of a draft — lets the model describe the invoice
// in text without echoing the full payload. The full `draft` is returned
// alongside this for the frontend to open the prefilled form.
function toDraftSummary(draft: {
  reciever?: { companyName?: string }
  period: { year: number; month: number }
  generalSum: number
  currency: string
  invoice: any[]
}) {
  return {
    company: draft.reciever?.companyName ?? null,
    // The billed month, not the issue date - asking for March in April must
    // not be reported as April.
    month: draft.period.month,
    year: draft.period.year,
    generalSum: draft.generalSum,
    currency: draft.currency,
    lines: draft.invoice.map((line: any) => ({
      name: line.name ?? line.customName ?? line.type,
      ...(line.amount > 1 ? { quantity: line.amount, price: line.price } : {}),
      sum: line.sum,
      ...(line.description ? { description: line.description } : {}),
    })),
  }
}

// One call for a whole list: every line is an item of a single record, so a
// long receipt costs one tool round-trip, not one per line.
const expenseInputSchema = z.object({
  type: z
    .enum(['debit', 'credit'])
    .default('debit')
    .describe('debit - витрата, credit - прибуток.'),
  companyName: z
    .string()
    .optional()
    .describe('Компанія, якщо названа - словами, без findCompanies.'),
  domainName: z
    .string()
    .optional()
    .describe('Надавач, якщо названий (і не компанія) - словами.'),
  date: z.string().optional().describe('YYYY-MM-DD, якщо названа.'),
  periodMonth: z.string().optional().describe('YYYY-MM, якщо названий.'),
  currency: z.enum(['UAH', 'USD', 'EUR']).optional(),
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        category: z
          .string()
          .optional()
          .describe(
            `ЩО це - завжди: ${PROFIT_DEFAULT_CATEGORIES.join(', ')} або назва з рядка («Цукерки», «Віск», «Посилка»).`
          ),
        amount: z.number().describe('Додатне: «-2600» -> 2600.'),
        description: z
          .string()
          .optional()
          .describe(
            'Лише решта рядка після суми чи в дужках: «суші, піца», «за посилку косметики». Не назва позиції.'
          ),
        expression: z.string().optional().describe('«13*200», якщо є.'),
      })
    )
    .min(1)
    .max(50),
})

export function buildAssistantTools(userContext: UserContext): ToolSet {
  const now = new Date()

  return {
    getMyPayments: tool({
      description: 'Останні рахунки/оплати користувача.',
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe('За замовчуванням 5.'),
        type: z
          .enum(['debit', 'credit'])
          .optional()
          .describe('debit - рахунки, credit - оплати.'),
      }),
      execute: async ({ limit = 5, type }) => {
        const result = await getPayments(
          { limit: String(limit), skip: '0', type },
          userContext
        )

        // Return a compact, model-friendly shape — never the raw mongoose docs.
        const payments = result.data.map((payment: any) => ({
          invoiceNumber: payment.invoiceNumber,
          type: payment.type,
          generalSum: payment.generalSum,
          date: payment.invoiceCreationDate,
          domain: payment.domain?.name ?? null,
          company: payment.company?.companyName ?? null,
        }))

        return { total: result.total, payments }
      },
    }),

    findDomains: tool({
      description: 'Надавачі користувача за частиною назви.',
      inputSchema: z.object({ name: z.string() }),
      execute: async ({ name }) => {
        const domains = await findDomainsByName(name, userContext)
        return { domains }
      },
    }),

    findCompanies: tool({
      description:
        'Компанії користувача за частиною назви (з їхнім надавачем).',
      inputSchema: z.object({
        name: z.string(),
        domainId: z.string().optional(),
      }),
      execute: async ({ name, domainId }) => {
        const companies = await findCompaniesByName(name, userContext, domainId)
        return { companies }
      },
    }),

    previewInvoice: tool({
      description:
        'Відкрити форму рахунку, заповнену чернеткою. Наявній компанії - ' +
        'позиції з Послуги за місяць; extraLines з тією ж назвою змінюють ' +
        'ціну такої позиції, інші додаються.',
      inputSchema: makePreviewInputSchema(now),
      ...withoutDraftForModel,
      execute: async (input) => {
        const result = await buildPartiesInvoiceDraft({
          ...withDefaults(input, now),
          ctx: userContext,
        })
        const { draft } = result
        // `draft` is consumed by the frontend to open a prefilled AddPaymentModal;
        // `summary` lets the model describe the invoice in its reply.
        return {
          draft,
          summary: {
            ...toDraftSummary({
              ...draft,
              reciever: (draft as any).reciever ?? {
                companyName: result.created.company,
              },
            }),
            // Created on save, together with the invoice.
            willCreate: result.created,
            missingCompanyEmail:
              !!result.created.company && !(draft as any).companyEmail,
            invalidEmail: result.invalidEmail,
          },
        }
      },
    }),

    previewCompany: tool({
      description:
        'Відкрити форму нової компанії. Передавай лише назване користувачем.',
      inputSchema: z.object({
        domainId: z.string(),
        companyName: z.string(),
        street: z.string().optional(),
        description: z
          .string()
          .optional()
          .describe('Реквізити, договір, директор.'),
        adminEmails: z.array(z.string()).optional(),
        totalArea: z.number().optional().describe('м²'),
        pricePerMeter: z.number().optional(),
        currency: z.enum(['UAH', 'USD', 'EUR']).optional(),
        contractNumber: z.string().optional(),
        contractDate: z.string().optional().describe('YYYY-MM-DD'),
        prices: z
          .array(z.object({ name: z.string(), price: z.number() }))
          .optional()
          .describe('Власні ціни компанії на послуги надавача.'),
      }),
      ...withoutDraftForModel,
      execute: async (input) => {
        const result = await buildCompanyDraft({ ...input, ctx: userContext })
        // `draft` opens the prefilled RealEstateModal; the rest is for the reply.
        return {
          draft: result.draft,
          summary: {
            companyName: result.draft.companyName,
            domain: result.domainName,
            street: result.streetAddress,
            missingDescription: !result.draft.description,
            unmatched: result.unmatched,
            invalidEmails: result.invalidEmails,
            similar: result.similar,
          },
        }
      },
    }),

    previewDomain: tool({
      description: 'Відкрити форму нового надавача: назва й реквізити.',
      inputSchema: z.object({
        name: z.string(),
        adminEmails: z.array(z.string()).optional(),
        iban: z.string().optional(),
        rnokpp: z.string().optional().describe('РНОКПП або ЄДРПОУ.'),
        mfo: z.string().optional(),
        description: z
          .string()
          .optional()
          .describe('Адреса, телефон, директор.'),
      }),
      ...withoutDraftForModel,
      execute: async (input) => {
        const result = await buildDomainDraft({ ...input, ctx: userContext })
        // `draft` opens the prefilled DomainModal; the rest is for the reply.
        return {
          draft: result.draft,
          summary: {
            name: result.draft.name,
            hasIban: !!result.draft.iban,
            invalid: result.invalid,
            invalidEmails: result.invalidEmails,
            similar: result.similar,
          },
        }
      },
    }),

    previewStreet: tool({
      description: 'Відкрити форму нової адреси надавача.',
      inputSchema: z.object({
        domainId: z.string(),
        address: z.string().describe('«вул. Шевченка, 5»'),
        city: z.string(),
      }),
      ...withoutDraftForModel,
      execute: async (input) => {
        const result = await buildStreetDraft({ ...input, ctx: userContext })
        // An address the domain already has opens nothing - it is reported.
        return {
          ...(result.existing ? {} : { draft: result.draft }),
          summary: {
            address: result.draft.address,
            city: result.draft.city,
            domain: result.domainName,
            alreadyExists: !!result.existing,
          },
        }
      },
    }),

    previewService: tool({
      description:
        'Відкрити форму тарифів надавача на місяць. Неназвані тарифи - з ' +
        'минулого місяця; наявний місяць відкривається на редагування.',
      inputSchema: z.object({
        domainId: z.string(),
        street: z.string().optional(),
        month: z
          .number()
          .int()
          .min(1)
          .max(12)
          .optional()
          .describe(`Поточний: ${now.getMonth() + 1}.`),
        year: z
          .number()
          .int()
          .optional()
          .describe(`Поточний: ${now.getFullYear()}.`),
        prices: z
          .array(
            z.object({
              name: z.string().describe('Словами: «електрика», «вода».'),
              price: z.number(),
            })
          )
          .min(1)
          .max(40),
        description: z.string().optional(),
      }),
      ...withoutDraftForModel,
      execute: async ({ month, year, ...input }) => {
        const result = await buildServiceDraft({
          ...input,
          month: month ?? now.getMonth() + 1,
          year: year ?? now.getFullYear(),
          ctx: userContext,
        })
        // `draft` opens the prefilled AddServiceModal; the rest is for the reply.
        return {
          draft: { mode: result.mode, service: result.service },
          summary: {
            mode: result.mode,
            domain: result.domainName,
            street: result.streetAddress,
            tariffs: result.lines.map(({ name, price, source }) => ({
              name,
              price,
              source,
            })),
            unmatched: result.unmatched,
          },
        }
      },
    }),

    previewCredit: tool({
      description: 'Відкрити форму оплати (гроші, що надійшли від компанії).',
      inputSchema: z.object({
        companyId: z.string(),
        amount: z.number().describe('Додатне.'),
        month: z
          .number()
          .int()
          .min(1)
          .max(12)
          .optional()
          .describe(`За який місяць; поточний: ${now.getMonth() + 1}.`),
        year: z
          .number()
          .int()
          .optional()
          .describe(`Поточний: ${now.getFullYear()}.`),
        date: z
          .string()
          .optional()
          .describe('Дата надходження YYYY-MM-DD, якщо названа.'),
        description: z
          .string()
          .optional()
          .describe('Призначення, якщо назване.'),
      }),
      ...withoutDraftForModel,
      execute: async ({ month, year, ...input }) => {
        const draft = await buildCreditDraft({
          ...input,
          month: month ?? now.getMonth() + 1,
          year: year ?? now.getFullYear(),
          ctx: userContext,
        })
        // `draft` opens the prefilled AddPaymentModal; `summary` is for the reply.
        return {
          draft,
          summary: {
            company: draft.reciever?.companyName ?? null,
            amount: draft.generalSum,
            currency: draft.currency,
            month: draft.period.month,
            year: draft.period.year,
          },
        }
      },
    }),

    previewExpenses: tool({
      description:
        'Відкрити форму витрати/прибутку: увесь список - позиції одного запису.',
      inputSchema: expenseInputSchema,
      ...withoutDraftForModel,
      execute: async (input) => {
        const { draft, warnings } = await buildExpenseDraft({
          ...input,
          ctx: userContext,
        })
        // `draft` opens the prefilled AddCostModal; the rest is for the reply.
        return {
          draft,
          summary: {
            type: draft.type,
            target: draft.scope?.label ?? null,
            lines: draft.items.length,
            total: sumProfitItems(draft.items),
            currency: draft.currency,
          },
          warnings,
        }
      },
    }),
  }
}
