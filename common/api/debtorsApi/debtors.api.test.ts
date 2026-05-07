import { debtorsApi, invalidateDebtorsOnSuccess } from './debtors.api'

describe('invalidateDebtorsOnSuccess', () => {
  it('dispatches Debtors invalidation after queryFulfilled resolves', async () => {
    const dispatch = jest.fn()
    const queryFulfilled = Promise.resolve({ data: {} })

    await invalidateDebtorsOnSuccess(undefined, { dispatch, queryFulfilled })

    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith(
      debtorsApi.util.invalidateTags(['Debtors'])
    )
  })

  it('does NOT dispatch when the mutation fails (queryFulfilled rejects)', async () => {
    const dispatch = jest.fn()
    const queryFulfilled = Promise.reject(new Error('mutation failed'))

    await invalidateDebtorsOnSuccess(undefined, { dispatch, queryFulfilled })

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('swallows the rejection so callers do not need their own try/catch', async () => {
    const dispatch = jest.fn()
    const queryFulfilled = Promise.reject(new Error('boom'))

    await expect(
      invalidateDebtorsOnSuccess(undefined, { dispatch, queryFulfilled })
    ).resolves.toBeUndefined()
  })
})
