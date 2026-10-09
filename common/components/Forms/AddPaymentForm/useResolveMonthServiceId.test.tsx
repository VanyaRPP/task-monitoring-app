import React from 'react'
import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import dayjs from 'dayjs'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import 'whatwg-fetch'
import { store } from '@modules/store/store'
import { buildMonthServicePlaceholder } from './month-service-placeholder'
import { useResolveMonthServiceId } from './useResolveMonthServiceId'

// A tiny /api/service: one month service on street s1, filtered like the API.
const streetService = { _id: 'svc-street', street: 's1' }
let created: Record<string, unknown>[] = []

const server = setupServer(
  rest.get('*/api/service', (req, res, ctx) => {
    const streetId = req.url.searchParams.get('streetId')
    const withoutStreet = req.url.searchParams.get('withoutStreet') === 'true'
    const data = [streetService].filter((service) =>
      streetId ? service.street === streetId : !withoutStreet
    )
    return res(ctx.status(200), ctx.json({ success: true, data }))
  }),
  rest.post('*/api/service', async (req, res, ctx) => {
    const body = await req.json()
    created.push(body)
    return res(
      ctx.status(200),
      ctx.json({ success: true, data: { ...body, _id: 'svc-new' } })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  created = []
  store.dispatch({ type: 'api/resetApiState' })
})
afterAll(() => server.close())

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
)

const march = buildMonthServicePlaceholder(dayjs('2030-03-15'))

const resolve = (street: string) => {
  const { result } = renderHook(() => useResolveMonthServiceId(), { wrapper })
  return result.current(march, 'dom-1', street)
}

describe('useResolveMonthServiceId', () => {
  it("creates an address-less service instead of reusing another street's", async () => {
    const id = await resolve('')

    expect(id).toBe('svc-new')
    expect(created).toHaveLength(1)
    expect(created[0].street).toBeUndefined()
  })

  it("reuses the street's own service", async () => {
    const id = await resolve('s1')

    expect(id).toBe('svc-street')
    expect(created).toHaveLength(0)
  })

  it('returns a real id unchanged', async () => {
    const { result } = renderHook(() => useResolveMonthServiceId(), {
      wrapper,
    })

    expect(await result.current('svc-1', 'dom-1', '')).toBe('svc-1')
  })
})
