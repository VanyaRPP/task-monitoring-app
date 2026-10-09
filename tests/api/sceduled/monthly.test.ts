import handler from '@pages/api/sceduled/monthly'
import { syncInflationIndexes } from '@utils/inflation-index/sync'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@utils/inflation-index/sync', () => ({
  ...jest.requireActual('@utils/inflation-index/sync'),
  syncInflationIndexes: jest.fn(),
}))

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

const REPORT = {
  added: [{ year: 2026, month: 8, value: 100.1 }],
  mismatched: [],
  rejected: [],
  failedSources: [],
  servicesFilled: 0,
  fillFailures: [],
}

let warn: jest.SpyInstance
let error: jest.SpyInstance

beforeEach(() => {
  jest.clearAllMocks()
  warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  warn.mockRestore()
  error.mockRestore()
})

describe('GET /api/sceduled/monthly', () => {
  it('запускає синхронізацію і віддає звіт', async () => {
    ;(syncInflationIndexes as jest.Mock).mockResolvedValue(REPORT)
    const res = makeRes()

    await handler({ method: 'GET' } as any, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { ...REPORT, hasProblems: false },
    })
    expect(warn.mock.calls[0][0]).toContain('додано 1')
    expect(error).not.toHaveBeenCalled()
  })

  it('зламане джерело логує через console.error і позначає hasProblems', async () => {
    ;(syncInflationIndexes as jest.Mock).mockResolvedValue({
      ...REPORT,
      added: [],
      failedSources: [{ source: 'minfin', error: 'HTTP 503' }],
    })
    const res = makeRes()

    await handler({ method: 'GET' } as any, res)

    expect(res.json.mock.calls[0][0].data.hasProblems).toBe(true)
    expect(error.mock.calls[0][0]).toContain('джерело minfin недоступне')
  })

  it('падіння синхронізації віддає 500, щоб крон це побачив', async () => {
    ;(syncInflationIndexes as jest.Mock).mockRejectedValue(
      new Error('Довідник ІСЦ порожній')
    )
    const res = makeRes()

    await handler({ method: 'GET' } as any, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Довідник ІСЦ порожній',
    })
  })

  it('інші методи відхиляє', async () => {
    const res = makeRes()

    await handler({ method: 'POST' } as any, res)

    expect(res.status).toHaveBeenCalledWith(405)
    expect(syncInflationIndexes).not.toHaveBeenCalled()
  })
})
