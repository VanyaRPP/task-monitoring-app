import type { UIMessage } from 'ai'
import { recentMessages, withoutDrafts } from './history'

const message = (parts: unknown[]): UIMessage =>
  ({ id: 'm1', role: 'assistant', parts }) as UIMessage

describe('withoutDrafts', () => {
  it('keeps the summary of a preview tool and drops its draft', () => {
    const [result] = withoutDrafts([
      message([
        {
          type: 'tool-previewInvoice',
          toolCallId: 't1',
          state: 'output-available',
          input: { companyId: 'co-1' },
          output: {
            draft: { invoice: new Array(40).fill({ sum: 1 }) },
            summary: { generalSum: 40 },
          },
        },
      ]),
    ])

    expect(result.parts[0]).toEqual({
      type: 'tool-previewInvoice',
      toolCallId: 't1',
      state: 'output-available',
      input: { companyId: 'co-1' },
      output: { summary: { generalSum: 40 } },
    })
  })

  it('leaves text and other tool outputs alone', () => {
    const parts = [
      { type: 'text', text: 'Привіт' },
      {
        type: 'tool-getMyPayments',
        toolCallId: 't2',
        state: 'output-available',
        input: {},
        output: { total: 1, payments: [] },
      },
      {
        type: 'tool-previewInvoice',
        toolCallId: 't3',
        state: 'input-streaming',
      },
    ]

    const [result] = withoutDrafts([message(parts)])

    expect(result.parts).toEqual(parts)
  })
})

describe('recentMessages', () => {
  const chat = (roles: string[]) =>
    roles.map((role, i) => ({ id: `m${i}`, role, parts: [] }) as UIMessage)

  it('keeps a short chat whole', () => {
    const messages = chat(['user', 'assistant'])
    expect(recentMessages(messages, 4)).toBe(messages)
  })

  it('keeps the tail of a long one, starting at a user message', () => {
    const messages = chat([
      'user',
      'assistant',
      'user',
      'assistant',
      'user',
      'assistant',
    ])

    const kept = recentMessages(messages, 3)

    expect(kept.map(({ id }) => id)).toEqual(['m4', 'm5'])
  })
})
