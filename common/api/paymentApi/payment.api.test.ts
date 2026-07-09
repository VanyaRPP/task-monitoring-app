// Mock API invalidation methods
jest.mock('@common/api/domainApi/domain.api', () => ({
  domainApi: { util: { invalidateTags: jest.fn() } },
}))
jest.mock('@common/api/realestateApi/realestate.api', () => ({
  realestateApi: { util: { invalidateTags: jest.fn() } },
}))
jest.mock('@common/api/debtorsApi/debtors.api', () => ({
  debtorsApi: { util: { invalidateTags: jest.fn() } },
}))

describe('paymentApi endpoints', () => {
  it('getPaymentNumber query endpoint exists and is configured', () => {
    jest.resetModules()
    ;(global as any).fetch = jest.fn()
    const { useGetPaymentNumberQuery, paymentApi } = require('./payment.api')

    // Verify the hook exists
    expect(typeof useGetPaymentNumberQuery).toBe('function')

    // Verify the endpoint exists
    expect(paymentApi.endpoints.getPaymentNumber).toBeDefined()
    expect(paymentApi.endpoints.getPaymentNumber.name).toBe('getPaymentNumber')

    // Verify it has query methods (not mutation)
    expect(typeof paymentApi.endpoints.getPaymentNumber.useQuery).toBe(
      'function'
    )
    expect(typeof paymentApi.endpoints.getPaymentNumber.useLazyQuery).toBe(
      'function'
    )
  })
})

// Side effects invalidation tests
describe('paymentApi side effects', () => {
  const mockDispatch = jest.fn()
  const mockQueryFulfilled = Promise.resolve()

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should invalidate Domain, RealEstate, and Debtors caches after a successful payment mutation', async () => {
    const { invalidatePaymentSideEffects } = require('./payment.api')
    const { domainApi } = require('@common/api/domainApi/domain.api')
    const {
      realestateApi,
    } = require('@common/api/realestateApi/realestate.api')
    const { debtorsApi } = require('@common/api/debtorsApi/debtors.api')

    await invalidatePaymentSideEffects(['id-123'], {
      dispatch: mockDispatch,
      queryFulfilled: mockQueryFulfilled,
    })

    expect(domainApi.util.invalidateTags).toHaveBeenCalledWith(['Domain'])
    expect(realestateApi.util.invalidateTags).toHaveBeenCalledWith([
      'RealEstate',
    ])
    expect(debtorsApi.util.invalidateTags).toHaveBeenCalledWith(['Debtors'])
    expect(mockDispatch).toHaveBeenCalledTimes(3)
  })

  it('should not invalidate side effect caches if query fails', async () => {
    const { invalidatePaymentSideEffects } = require('./payment.api')
    const mockRejectedQuery = Promise.reject(new Error('Backend failed'))

    await invalidatePaymentSideEffects(['id-123'], {
      dispatch: mockDispatch,
      queryFulfilled: mockRejectedQuery,
    })

    // Verify that cache is not invalidated if the backend query fails
    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
