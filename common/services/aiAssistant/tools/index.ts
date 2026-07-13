import { tool, type ToolSet } from 'ai'
import { z } from 'zod'
import {
  createPayment,
  getPayments,
  type UserContext,
} from '@common/services/paymentService/payment.service'
import {
  buildInvoiceDraft,
  findCompaniesByName,
  findDomainsByName,
} from '@common/services/aiAssistant/invoiceActions'

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

// Shared by previewInvoice and createInvoice so both take exactly the same
// identifier-only input. The model supplies WHO/WHEN, never the final amounts.
const now = new Date()
const previewInputSchema = z.object({
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

type PreviewInput = z.infer<typeof previewInputSchema>

// Normalises month/year defaults for both invoice tools.
function withDefaults(input: PreviewInput) {
  return {
    companyId: input.companyId,
    month: input.month ?? now.getMonth() + 1,
    year: input.year ?? now.getFullYear(),
    extraLines: input.extraLines,
  }
}

// Compact, model-friendly view of a draft — no raw mongoose docs.
function toDraftSummary(draft: Awaited<ReturnType<typeof buildInvoiceDraft>>) {
  return {
    invoiceNumber: draft.invoiceNumber,
    company: draft.reciever?.companyName ?? null,
    month: new Date(draft.invoiceCreationDate).getMonth() + 1,
    generalSum: draft.generalSum,
    currency: draft.currency,
    lines: draft.invoice.map((line: any) => ({
      name: line.name ?? line.customName ?? line.type,
      sum: line.sum,
    })),
  }
}

export function buildAssistantTools(userContext: UserContext): ToolSet {
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
        'Порахувати ЧЕРНЕТКУ інвойсу для компанії за місяць — НІЧОГО не створює в базі. ' +
        'Позиції та ціни беруться з Послуги за місяць (0, якщо не заповнено). ' +
        'Завжди викликай перед створенням і покажи результат користувачу на підтвердження.',
      inputSchema: previewInputSchema,
      execute: async (input) => {
        const draft = await buildInvoiceDraft({
          ...withDefaults(input),
          ctx: userContext,
        })
        return toDraftSummary(draft)
      },
    }),

    createInvoice: tool({
      description:
        'СТВОРИТИ інвойс для компанії за місяць. Викликай ЛИШЕ після previewInvoice ' +
        'і явного підтвердження користувача ("так"/"створюй"). Email клієнту наразі НЕ надсилається.',
      inputSchema: previewInputSchema,
      execute: async (input) => {
        // Rebuild the draft deterministically from resolved ids — the model
        // never supplies the final sums, so it cannot inflate/alter them.
        const draft = await buildInvoiceDraft({
          ...withDefaults(input),
          ctx: userContext,
        })
        const payment = await createPayment(draft, true, {
          sendInvoiceEmail: false,
        })
        return {
          created: true,
          invoiceNumber: payment.invoiceNumber,
          id: payment.id?.toString?.(),
          generalSum: payment.generalSum,
        }
      },
    }),
  }
}
