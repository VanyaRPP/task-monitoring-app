import { AppRoutes } from '@utils/constants'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { buildAssistantTools } from './tools'
import { SYSTEM_PROMPT } from './prompt'

// The real `ai` package pulls in Web Streams at import; only `tool()` matters.
jest.mock('ai', () => ({ tool: (definition: unknown) => definition }))

const ctx: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: 'admin@example.com' },
}

// The model repeats whatever paths the prompt names, so a stale one becomes a
// confident link to nowhere (it used to send people to /categories).
describe('SYSTEM_PROMPT', () => {
  const routes = new Set<string>(Object.values(AppRoutes))
  const paths = Array.from(
    SYSTEM_PROMPT.matchAll(/(?:\[|\]\()(\/[a-z0-9\-/]*)[\])]/g),
    ([, path]) => path
  )

  it('names some app paths', () => {
    expect(paths.length).toBeGreaterThan(5)
  })

  it.each(Array.from(new Set(paths)))('%s is a real route', (path) => {
    expect(routes).toContain(path)
  })

  it('describes every tool the assistant can call', () => {
    for (const name of Object.keys(buildAssistantTools(ctx))) {
      expect(SYSTEM_PROMPT).toContain(`**${name}**`)
    }
  })
})
