/**
 * The assistant's reply once a preview tool has opened its form.
 *
 * After a preview tool the model used to take one more step only to retell
 * the tool's `summary` - a whole extra request (~5K tokens on Groq's free
 * 8K-per-minute tier) for text the summary already holds. Now the stream
 * stops there (`previewOpened`) and the chat widget writes the reply from the
 * summary itself (`previewReply`). A tool that fails still goes back to the
 * model, so it can ask the user what the error asks for.
 *
 * Pure: imported by the API route and by the browser.
 */

export const PREVIEW_TOOL_NAMES = [
  'previewInvoice',
  'previewCredit',
  'previewExpenses',
  'previewService',
  'previewCompany',
  'previewDomain',
  'previewStreet',
] as const

const PREVIEW_TOOLS = new Set<string>(PREVIEW_TOOL_NAMES)

/** Stop condition: the last step opened a form. */
export const previewOpened = ({
  steps,
}: {
  steps: { toolResults: { toolName: string }[] }[]
}): boolean =>
  !!steps
    .at(-1)
    ?.toolResults.some(({ toolName }) => PREVIEW_TOOLS.has(toolName))

const money = (value: unknown, currency?: string) =>
  `${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(
    Number(value) || 0
  )}${currency ? ` ${currency}` : ''}`

const month = (m?: number, y?: number) =>
  m && y ? `${String(m).padStart(2, '0')}.${y}` : ''

const list = (values?: unknown[]) =>
  Array.isArray(values) && values.length ? values.join(', ') : ''

const lines = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join('\n')

type Output = { summary?: Record<string, any>; warnings?: string[] }

const REPLIES: Record<string, (output: Output) => string> = {
  previewInvoice: ({ summary: s = {} }) => {
    const created = s.willCreate ?? {}
    const willCreate = [
      created.domain && `надавача «${created.domain}»`,
      created.company && `компанію «${created.company}»`,
      created.street && `адресу «${created.street}»`,
    ].filter(Boolean)
    const items = (s.lines ?? []) as any[]
    return lines(
      `Я відкрив форму рахунку${s.company ? ` для «${s.company}»` : ''} за ${month(s.month, s.year)}: ${items.length} поз., разом ${money(s.generalSum, s.currency)}.`,
      ...items
        .slice(0, 10)
        .map(
          (l) =>
            `• ${l.name}${l.quantity ? ` (${l.quantity} × ${money(l.price)})` : ''} — ${money(l.sum)}${l.description ? ` — ${l.description}` : ''}`
        ),
      items.length > 10 && `…і ще ${items.length - 10}.`,
      willCreate.length &&
        `При збереженні буде створено ${willCreate.join(', ')}; позиції збережуться в каталог послуг надавача.`,
      s.missingCompanyEmail &&
        'Впиши пошту компанії у формі — для нової компанії вона обовʼязкова.',
      s.invalidEmail &&
        'Пошта компанії має неправильний формат — я її не вписав.',
      !willCreate.length &&
        Number(s.generalSum) === 0 &&
        'Сума 0: схоже, Послугу за цей місяць ще не заповнено — суми можна ввести у формі.',
      'Перевір дані та натисни «Додати».'
    )
  },
  previewCredit: ({ summary: s = {} }) =>
    `Я відкрив форму оплати${s.company ? ` від «${s.company}»` : ''}: ${money(s.amount, s.currency)} за ${month(s.month, s.year)}. Перевір і натисни «Додати».`,
  previewExpenses: ({ summary: s = {}, warnings }) =>
    lines(
      `Я відкрив форму ${s.type === 'credit' ? 'прибутку' : 'витрат'}${s.target ? ` для «${s.target}»` : ''}: ${s.lines ?? 0} поз., разом ${money(s.total, s.currency)}.`,
      !s.target && 'Обери надавача чи компанію у формі.',
      ...(warnings ?? []).map((w) => `⚠️ ${w}`),
      'Перевір позиції та натисни «Зберегти».'
    ),
  previewService: ({ summary: s = {} }) => {
    const tariffs = (s.tariffs ?? []) as any[]
    const named = tariffs.filter((t) => t.source === 'user')
    const carried = tariffs.length - named.length
    return lines(
      s.mode === 'edit'
        ? `Послуга за цей місяць${s.domain ? ` у «${s.domain}»` : ''} вже є — я відкрив її на редагування з новими цінами.`
        : `Я відкрив форму тарифів${s.domain ? ` «${s.domain}»` : ''}${s.street ? `, ${s.street}` : ''}.`,
      named.length &&
        `Нові: ${named.map((t) => `${t.name} ${money(t.price)}`).join(', ')}.`,
      carried > 0 && `Ще ${carried} — з минулого місяця.`,
      list(s.unmatched) &&
        `Таких тарифів у надавача немає: ${list(s.unmatched)}.`,
      'Перевір і збережи.'
    )
  },
  previewCompany: ({ summary: s = {} }) =>
    lines(
      `Я відкрив форму компанії «${s.companyName}»${s.domain ? ` (надавач «${s.domain}»)` : ''}${s.street ? `, ${s.street}` : ''}.`,
      list(s.similar) && `Увага: схожа компанія вже є — ${list(s.similar)}.`,
      s.missingDescription &&
        'Заповни «Опис» (реквізити, договір) — він обовʼязковий.',
      list(s.unmatched) &&
        `Таких послуг у надавача немає: ${list(s.unmatched)}.`,
      list(s.invalidEmails) &&
        `Неправильні email-и, не вписав: ${list(s.invalidEmails)}.`,
      'Перевір і збережи.'
    ),
  previewDomain: ({ summary: s = {} }) =>
    lines(
      `Я відкрив форму надавача «${s.name}».`,
      list(s.similar) && `Увага: схожий надавач уже є — ${list(s.similar)}.`,
      list(s.invalid) &&
        `Неправильний формат, не вписав: ${list((s.invalid as string[]).map((f) => ({ iban: 'IBAN', rnokpp: 'РНОКПП', mfo: 'МФО' })[f] ?? f))}.`,
      list(s.invalidEmails) &&
        `Неправильні email-и, не вписав: ${list(s.invalidEmails)}.`,
      'Адреси й шаблон послуг задаються у формі. Перевір і збережи.'
    ),
  previewStreet: ({ summary: s = {} }) =>
    s.alreadyExists
      ? `Адреса «${s.address}» у «${s.domain}» вже є — форму не відкривав.`
      : `Я відкрив форму адреси «${s.address}, м. ${s.city}» для «${s.domain}». Перевір і збережи.`,
}

/** The reply for a preview tool's output, or '' for any other tool. */
export function previewReply(toolName: string, output: unknown): string {
  const reply = REPLIES[toolName]
  return reply && output && typeof output === 'object'
    ? reply(output as Output)
    : ''
}
