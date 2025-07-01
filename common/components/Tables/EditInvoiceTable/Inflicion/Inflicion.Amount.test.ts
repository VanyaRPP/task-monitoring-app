import { describe, it, expect, jest } from '@jest/globals'

describe('Inflicion.Amount reset button logic', () => {
  it('викликає form.setFieldValue з початковим значенням', () => {
    const setFieldValue = jest.fn()
    const form = { setFieldValue }
    const name = ['0']
    const initialPrice = 123.45

    if (initialPrice !== null) {
      form.setFieldValue(['invoice', ...name, 'price'], initialPrice)
    }

    expect(setFieldValue).toHaveBeenCalledWith(
      ['invoice', '0', 'price'],
      123.45
    )
  })

  it('не викликає setFieldValue, якщо initialPrice null', () => {
    const setFieldValue = jest.fn()
    const form = { setFieldValue }
    const name = ['0']
    const initialPrice = null

    if (initialPrice !== null) {
      form.setFieldValue(['invoice', ...name, 'price'], initialPrice)
    }

    expect(setFieldValue).not.toHaveBeenCalled()
  })
})
