import { describeChatError } from './chatErrors'

// Shaped like the SDK's APICallError for the Groq answer from production.
const groqError = (statusCode: number, message: string) =>
  Object.assign(new Error(message), {
    statusCode,
    responseBody: JSON.stringify({
      error: { message, code: 'rate_limit_exceeded' },
    }),
  })

describe('describeChatError', () => {
  it('asks to wait when the per-minute token limit is hit', () => {
    expect(
      describeChatError(
        groqError(429, 'Rate limit reached for model `openai/gpt-oss-120b`')
      )
    ).toBe('Вичерпано хвилинний ліміт моделі. Спробуй ще раз за хвилину.')
  })

  it('asks for less when a single request is over the limit', () => {
    expect(
      describeChatError(
        groqError(
          413,
          'Request too large for model `openai/gpt-oss-120b` on tokens per minute (TPM): Limit 8000, Requested 9263'
        )
      )
    ).toMatch(/^Запит завеликий/)
  })

  it('finds the provider error inside a retry error', () => {
    const retry = Object.assign(new Error('Failed after 3 attempts'), {
      lastError: groqError(429, 'rate limit'),
    })
    expect(describeChatError(retry)).toMatch(/хвилинний ліміт/)
  })

  it('says something generic, not the provider text, for anything else', () => {
    expect(describeChatError(new Error('socket hang up'))).toBe(
      'Не вдалося отримати відповідь асистента. Спробуй ще раз.'
    )
  })
})
