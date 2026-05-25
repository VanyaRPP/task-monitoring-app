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
