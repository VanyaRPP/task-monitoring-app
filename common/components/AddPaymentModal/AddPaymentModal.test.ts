import { handleValidate } from '.'

describe('handleValidate', () => {
  let form
  let setIsButtonDisabled

  beforeEach(() => {
    form = {
      validateFields: jest.fn(),
    }
    setIsButtonDisabled = jest.fn()
  })

  it('should enable the button when form validation is successful', async () => {
    form.validateFields.mockResolvedValueOnce(true)

    await handleValidate(form, setIsButtonDisabled)

    expect(form.validateFields).toHaveBeenCalled()
    expect(setIsButtonDisabled).toHaveBeenCalledWith(false)
  })

  it('should disable the button when form validation fails', async () => {
    form.validateFields.mockRejectedValueOnce({
      errorFields: [{ name: 'field1', errors: ['error'] }],
    })

    await handleValidate(form, setIsButtonDisabled)

    expect(form.validateFields).toHaveBeenCalled()
    expect(setIsButtonDisabled).toHaveBeenCalledWith(true)
  })

  it('should keep the button disabled when there are no errorFields', async () => {
    form.validateFields.mockRejectedValueOnce({
      errorFields: [],
    })

    await handleValidate(form, setIsButtonDisabled)

    expect(form.validateFields).toHaveBeenCalled()
    expect(setIsButtonDisabled).toHaveBeenCalledWith(false)
  })
})
