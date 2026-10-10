import { tool, type ToolSet } from 'ai'
import { z } from 'zod'
import {
  getPayments,
  type UserContext,
} from '@common/services/paymentService/payment.service'
import {
  buildCreditDraft,
  buildInvoiceDraft,
  findCompaniesByName,
  findDomainsByName,
} from '@common/services/aiAssistant/invoiceActions'
import { buildExpenseDraft } from '@common/services/aiAssistant/expenseActions'
import { buildServiceDraft } from '@common/services/aiAssistant/serviceActions'
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

// Identifier-only input for previewInvoice. The model supplies WHO/WHEN, never
// the final amounts — those are computed server-side from the Service record.
// Built per request: "the current month" must be today's, not the month the
// server process happened to start in.
const makePreviewInputSchema = (now: Date) =>
  z.object({
    companyId: z
      .string()
      .describe('id компанії (отримай через findCompanies за назвою).'),
    month: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe(
        `Місяць 1-12 (за замовчуванням поточний: ${now.getMonth() + 1}).`
      ),
    year: z
      .number()
      .int()
      .optional()
      .describe(`Рік (за замовчуванням поточний: ${now.getFullYear()}).`),
    extraLines: z
      .array(z.object({ name: z.string(), sum: z.number() }))
      .optional()
      .describe(
        'Додаткові фіксовані позиції, напр. [{ "name": "Оренда", "sum": 5000 }].'
      ),
  })

type PreviewInput = z.infer<ReturnType<typeof makePreviewInputSchema>>

// Normalises month/year defaults for both invoice tools.
function withDefaults(input: PreviewInput, now: Date) {
  return {
    companyId: input.companyId,
    month: input.month ?? now.getMonth() + 1,
    year: input.year ?? now.getFullYear(),
    extraLines: input.extraLines,
  }
}

// Compact, model-friendly view of a draft — lets the model describe the invoice
// in text without echoing the full payload. The full `draft` is returned
// alongside this for the frontend to open the prefilled form.
function toDraftSummary(draft: Awaited<ReturnType<typeof buildInvoiceDraft>>) {
  return {
    invoiceNumber: draft.invoiceNumber,
    company: draft.reciever?.companyName ?? null,
    // The billed month, not the issue date - asking for March in April must
    // not be reported as April.
    month: draft.period.month,
    year: draft.period.year,
    generalSum: draft.generalSum,
    currency: draft.currency,
    lines: draft.invoice.map((line: any) => ({
      name: line.name ?? line.customName ?? line.type,
      sum: line.sum,
    })),
  }
}

// One call for a whole list: every line is an item of a single record, so a
// long receipt costs one tool round-trip, not one per line.
const expenseInputSchema = z.object({
  type: z
    .enum(['debit', 'credit'])
    .default('debit')
    .describe(
      'debit - витрата (рядки з «-», «витратили», «заплатили»), credit - прибуток.'
    ),
  domainId: z
    .string()
    .optional()
    .describe('id домену з findDomains, якщо користувач назвав домен.'),
  companyId: z
    .string()
    .optional()
    .describe(
      'id компанії з findCompanies, якщо витрата саме компанії. Не разом з domainId.'
    ),
  date: z
    .string()
    .optional()
    .describe('Дата руху грошей YYYY-MM-DD, лише якщо її названо.'),
  periodMonth: z
    .string()
    .optional()
    .describe('Місяць витрати YYYY-MM, лише якщо його названо.'),
  currency: z.enum(['UAH', 'USD', 'EUR']).optional(),
  description: z.string().optional().describe('Спільний опис усього запису.'),
  items: z
    .array(
      z.object({
        category: z
          .string()
          .optional()
          .describe(
            `Одна з: ${PROFIT_DEFAULT_CATEGORIES.join(', ')}. Якщо жодна не підходить - коротка своя назва з великої літери (напр. Корпоратив, Доставка).`
          ),
        amount: z
          .number()
          .describe('Сума рядка, ДОДАТНЕ число: «-2600» -> 2600.'),
        description: z
          .string()
          .optional()
          .describe('Що саме: «цукерки», «суші, піца», «13 × 200».'),
        expression: z
          .string()
          .optional()
          .describe('Вираз, якщо рядок його містить, напр. «13*200».'),
      })
    )
    .min(1)
    .max(50),
})

export function buildAssistantTools(userContext: UserContext): ToolSet {
  const now = new Date()

  return {
    getMyPayments: tool({
      description:
        'Отримати останні платежі/рахунки поточного користувача. ' +
        'Результат уже обмежений правами користувача. ' +
        'Використовуй для запитів на кшталт "покажи мої платежі" / "останні рахунки".',
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe(
            'Скільки платежів повернути (за замовчуванням 5, максимум 20).'
          ),
        type: z
          .enum(['debit', 'credit'])
          .optional()
          .describe(
            'Тип операції: debit (виставлені рахунки) або credit (надходження).'
          ),
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
      description:
        'Знайти домени (провайдерів) поточного користувача за частиною назви. ' +
        'Використовуй, щоб отримати id домену перед створенням інвойсу.',
      inputSchema: z.object({
        name: z.string().describe('Частина назви домену для пошуку.'),
      }),
      execute: async ({ name }) => {
        const domains = await findDomainsByName(name, userContext)
        return { domains }
      },
    }),

    findCompanies: tool({
      description:
        'Знайти компанії (орендарів) поточного користувача за частиною назви. ' +
        'Повертає id компанії та її домен — потрібно перед створенням інвойсу.',
      inputSchema: z.object({
        name: z.string().describe('Частина назви компанії для пошуку.'),
        domainId: z
          .string()
          .optional()
          .describe('Необовʼязково: обмежити пошук одним доменом за його id.'),
      }),
      execute: async ({ name, domainId }) => {
        const companies = await findCompaniesByName(name, userContext, domainId)
        return { companies }
      },
    }),

    previewInvoice: tool({
      description:
        'Підготувати ЧЕРНЕТКУ інвойсу для компанії за місяць і ВІДКРИТИ форму ' +
        'створення рахунку, заповнену цією чернеткою — НІЧОГО не зберігає в базі. ' +
        'Позиції та ціни беруться з Послуги за місяць (0, якщо не заповнено). ' +
        'Користувач перевіряє форму і зберігає сам. Виклич, коли просять створити рахунок.',
      inputSchema: makePreviewInputSchema(now),
      execute: async (input) => {
        const draft = await buildInvoiceDraft({
          ...withDefaults(input, now),
          ctx: userContext,
        })
        // `draft` is consumed by the frontend to open a prefilled AddPaymentModal;
        // `summary` lets the model describe the invoice in its reply.
        return { draft, summary: toDraftSummary(draft) }
      },
    }),

    previewCompany: tool({
      description:
        'Підготувати НОВУ компанію (орендаря/квартиру) і ВІДКРИТИ форму, ' +
        'заповнену нею - НІЧОГО не зберігає. Передавай лише те, що назвав ' +
        'користувач; решту він заповнить у формі. Перед викликом перевір через ' +
        'findCompanies, чи такої компанії ще немає.',
      inputSchema: z.object({
        domainId: z.string().describe('id надавача (через findDomains).'),
        companyName: z.string().describe('Назва компанії / ПІБ.'),
        street: z
          .string()
          .optional()
          .describe('Адреса словами, лише якщо її назвали.'),
        description: z
          .string()
          .optional()
          .describe('Реквізити, договір, директор - якщо названі.'),
        adminEmails: z
          .array(z.string())
          .optional()
          .describe('Email-и адмінів компанії, якщо названі.'),
        totalArea: z.number().optional().describe('Площа, м².'),
        pricePerMeter: z.number().optional().describe('Ціна за м², грн.'),
        currency: z.enum(['UAH', 'USD', 'EUR']).optional(),
        contractNumber: z.string().optional(),
        contractDate: z
          .string()
          .optional()
          .describe('Дата договору YYYY-MM-DD.'),
        prices: z
          .array(z.object({ name: z.string(), price: z.number() }))
          .optional()
          .describe(
            'Індивідуальні ціни компанії на послуги надавача, словами користувача.'
          ),
      }),
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

    previewService: tool({
      description:
        'Підготувати ТАРИФИ надавача на місяць ("Послугу") і ВІДКРИТИ форму, ' +
        'заповнену ними - НІЧОГО не зберігає. Назви тарифів передавай словами ' +
        'користувача ("електрика", "вода"); інструмент сам знайде їх у каталозі ' +
        'надавача. Неназвані тарифи береться з минулого місяця. Якщо Послуга за ' +
        'місяць уже є - відкриє її на редагування з новими цінами.',
      inputSchema: z.object({
        domainId: z.string().describe('id надавача (через findDomains).'),
        street: z
          .string()
          .optional()
          .describe('Адреса словами, лише якщо її назвали.'),
        month: z
          .number()
          .int()
          .min(1)
          .max(12)
          .optional()
          .describe(
            `Місяць 1-12 (за замовчуванням поточний: ${now.getMonth() + 1}).`
          ),
        year: z
          .number()
          .int()
          .optional()
          .describe(`Рік (за замовчуванням ${now.getFullYear()}).`),
        prices: z
          .array(
            z.object({
              name: z.string().describe('Назва тарифу словами користувача.'),
              price: z.number().describe('Ціна за одиницю, не відʼємна.'),
            })
          )
          .min(1)
          .max(40),
        description: z.string().optional(),
      }),
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
      description:
        'Підготувати ОПЛАТУ (кредит - гроші, що надійшли від компанії) і ВІДКРИТИ ' +
        'форму, заповнену нею - НІЧОГО не зберігає. Користувач перевіряє і зберігає сам. ' +
        'Для рахунку (нарахування) - previewInvoice, не цей.',
      inputSchema: z.object({
        companyId: z
          .string()
          .describe('id компанії, що заплатила (через findCompanies).'),
        amount: z
          .number()
          .describe(
            'Сума оплати, ДОДАТНЕ число в гривнях (або валюті компанії).'
          ),
        month: z
          .number()
          .int()
          .min(1)
          .max(12)
          .optional()
          .describe(
            `За який місяць оплата 1-12 (за замовчуванням поточний: ${now.getMonth() + 1}).`
          ),
        year: z
          .number()
          .int()
          .optional()
          .describe(`Рік того місяця (за замовчуванням ${now.getFullYear()}).`),
        date: z
          .string()
          .optional()
          .describe('Дата надходження YYYY-MM-DD, лише якщо її названо.'),
        description: z
          .string()
          .optional()
          .describe('Призначення платежу, якщо назване.'),
      }),
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
        'Підготувати витрату/прибуток з позиціями зі списку користувача і ВІДКРИТИ ' +
        'форму, заповнену ними - НІЧОГО не зберігає. Увесь список - ОДИН виклик: ' +
        'кожен рядок - позиція одного запису, сума запису = сума позицій. ' +
        'Користувач перевіряє форму і зберігає сам.',
      inputSchema: expenseInputSchema,
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
