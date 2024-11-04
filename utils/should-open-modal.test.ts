import { shouldOpenModal } from '@utils/shouldOpenModal'

describe('shouldOpenModal', () => {
  it('returns true when isModalOpen is true', () => {
    const result = shouldOpenModal(
        { edit: false, preview: false }, // paymentActions
        null,                           // currentPayment
        true                            // isModalOpen
    )
    expect(result).toBe(true)
  })

  it('returns true when currentPayment is not null and there are payment actions', () => {
    const result = shouldOpenModal(
        { edit: true, preview: false },  // paymentActions
        { id: 1, amount: 100 },          // currentPayment
        false                            // isModalOpen
    )
    expect(result).toBe(true)
  })

  it('returns false when isModalOpen is false, currentPayment is null, and there are no payment actions', () => {
    const result = shouldOpenModal(
        { edit: false, preview: false }, // paymentActions
        null,                            // currentPayment
        false                            // isModalOpen
    )
    expect(result).toBe(false)
  })

  it('returns false when isModalOpen is false and currentPayment is null but paymentActions have edit set to true', () => {
    const result = shouldOpenModal(
        { edit: true, preview: false },  // paymentActions
        null,                            // currentPayment
        false                            // isModalOpen
    )
    expect(result).toBe(false)
  })
})