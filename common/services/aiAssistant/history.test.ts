import type { UIMessage } from 'ai'
import { withoutDrafts } from './history'

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
