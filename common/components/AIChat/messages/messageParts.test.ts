import type { UIMessage } from '@ai-sdk/react'
import {
  describeChatError,
  getMessageText,
  producedDraft,
} from './messageParts'

const message = (parts: unknown[]): UIMessage =>
  ({ id: 'm', role: 'assistant', parts }) as UIMessage

describe('getMessageText', () => {
  it('склеює текстові частини і пропускає інші', () => {
    expect(
      getMessageText(
        message([
          { type: 'text', text: 'Борг: ' },
          { type: 'tool-findCompanies', state: 'output-available' },
          { type: 'text', text: '100 грн' },
        ])
      )
    ).toBe('Борг: 100 грн')
  })
})

describe('producedDraft', () => {
  it('true, якщо відповідь відкрила форму з чернеткою', () => {
    expect(
      producedDraft(
        message([
          {
            type: 'tool-previewInvoice',
            state: 'output-available',
            output: { draft: { amount: 1 } },
          },
        ])
      )
    ).toBe(true)
  })

  it('false для інструментів, що лише читають дані, і для помилок чернетки', () => {
    expect(
      producedDraft(
        message([
          { type: 'tool-getMyPayments', output: { draft: {} } },
          { type: 'tool-previewInvoice', output: { error: 'Немає тарифів' } },
        ])
      )
    ).toBe(false)
  })
})

describe('describeChatError', () => {
  it.each([
    ['{"error":"Unauthorized"}', 'Сесія завершилася'],
    ['{"error":"Forbidden"}', 'Немає доступу'],
    ['Failed to fetch', "Немає з'єднання"],
    [
      '{"error":"AI provider \\"Google Gemini\\" is selected but GOOGLE_GENERATIVE_AI_API_KEY is missing or empty."}',
      'не налаштований на сервері',
    ],
    ['{"error":"boom"}', 'Не вдалося отримати відповідь'],
  ])('%s → зрозуміле повідомлення', (raw, expected) => {
    expect(describeChatError(new Error(raw))).toContain(expected)
  })
})
