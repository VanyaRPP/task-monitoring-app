const connectMock = jest.fn()

jest.mock('mongoose', () => ({
  __esModule: true,
  default: { connect: (...args: unknown[]) => connectMock(...args) },
}))

describe('dbConnect', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    connectMock.mockReset()
    delete (global as any).mongoose
    process.env = { ...ORIGINAL_ENV, MONGODB_URI: 'mongodb://test/db' }
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  // dbConnect caches its connection on `global`, so each scenario needs a
  // fresh module instance (jest.resetModules() above) loaded fresh here,
  // rather than one shared top-level import.
  const loadDbConnect = () => require('./dbConnect').default

  it('connects once and reuses the cached connection on later calls', async () => {
    const fakeConn = { id: 'conn-1' }
    connectMock.mockResolvedValue(fakeConn)
    const dbConnect = loadDbConnect()

    const first = await dbConnect()
    const second = await dbConnect()

    expect(first).toBe(fakeConn)
    expect(second).toBe(fakeConn)
    expect(connectMock).toHaveBeenCalledTimes(1)
    expect(connectMock).toHaveBeenCalledWith('mongodb://test/db', {})
  })

  it('shares a single in-flight connect across concurrent callers', async () => {
    let resolveConnect: (value: unknown) => void = () => {}
    connectMock.mockReturnValue(
      new Promise((resolve) => {
        resolveConnect = resolve
      })
    )
    const dbConnect = loadDbConnect()

    const callA = dbConnect()
    const callB = dbConnect()
    resolveConnect({ id: 'conn-shared' })
    const [a, b] = await Promise.all([callA, callB])

    expect(a).toBe(b)
    expect(connectMock).toHaveBeenCalledTimes(1)
  })

  // Regression for #1757: a rejected connect used to leave `cached.promise`
  // set, so every later call in the same (Lambda) container awaited the same
  // rejected promise forever. It must clear itself so the next call retries.
  it('clears the cached promise after a failed connect, so the next call retries', async () => {
    connectMock.mockRejectedValueOnce(new Error('Atlas unreachable'))
    const dbConnect = loadDbConnect()

    await expect(dbConnect()).rejects.toThrow('Atlas unreachable')

    const fakeConn = { id: 'conn-2' }
    connectMock.mockResolvedValueOnce(fakeConn)
    await expect(dbConnect()).resolves.toBe(fakeConn)

    expect(connectMock).toHaveBeenCalledTimes(2)
  })

  it('throws at import time when MONGODB_URI is not set', () => {
    delete process.env.MONGODB_URI
    expect(() => loadDbConnect()).toThrow(
      'Please define the MONGODB_URI environment variable inside .env.local'
    )
  })
})
