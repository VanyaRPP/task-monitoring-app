import { describe, it, expect, jest } from '@jest/globals'

describe('Кнопка повернення значення в формі', () => {
  it('має оновити значення поля price та скинути прапорець changed', () => {
    const setFieldValue = jest.fn()
    const form = { setFieldValue }
    const name = ['0']
    const calculatedInitialPrice = 180


    form.setFieldValue(['invoice', ...name, 'price'], calculatedInitialPrice)
    form.setFieldValue(['invoiceMeta', 'changed'], false)


    expect(setFieldValue).toHaveBeenCalledWith(['invoice', '0', 'price'], 180)
    expect(setFieldValue).toHaveBeenCalledWith(['invoiceMeta', 'changed'], false)
  })

  it('не викликає setFieldValue, якщо ціна вже дорівнює початковій', () => {
    const setFieldValue = jest.fn()
    const form = { setFieldValue }
    const name = ['0']
    const calculatedInitialPrice = 180
    const currentPrice = 180


    if (currentPrice !== calculatedInitialPrice) {
      form.setFieldValue(['invoice', ...name, 'price'], calculatedInitialPrice)
      form.setFieldValue(['invoiceMeta', 'changed'], false)
    }


    expect(setFieldValue).not.toHaveBeenCalled()
  })

  it('викликає setFieldValue у правильному порядку', () => {
    const setFieldValue = jest.fn()
    const form = { setFieldValue }
    const name = ['0']
    const calculatedInitialPrice = 180


    form.setFieldValue(['invoice', ...name, 'price'], calculatedInitialPrice)
    form.setFieldValue(['invoiceMeta', 'changed'], false)


    expect(setFieldValue.mock.calls[0]).toEqual([['invoice', '0', 'price'], 180])
    expect(setFieldValue.mock.calls[1]).toEqual([['invoiceMeta', 'changed'], false])
  })

  it('викликає саме початкове значення, передане у функцію', () => {
    const setFieldValue = jest.fn()
    const form = { setFieldValue }
    const name = ['0']
    const calculatedInitialPrice = 999


    form.setFieldValue(['invoice', ...name, 'price'], calculatedInitialPrice)
    form.setFieldValue(['invoiceMeta', 'changed'], false)


    expect(setFieldValue).toHaveBeenCalledWith(['invoice', '0', 'price'], 999)
  })
})
