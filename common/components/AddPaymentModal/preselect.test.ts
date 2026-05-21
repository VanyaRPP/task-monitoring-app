describe('company reset on domain change', () => {
  const makeForm = () => {
    const fields: Record<string, any> = {}
    return {
      resetFields: jest.fn((keys: string[]) =>
        keys.forEach((k) => delete fields[k])
      ),
      setFieldsValue: (vals: Record<string, any>) =>
        Object.assign(fields, vals),
      getFieldValue: (key: string) => fields[key],
      _fields: fields,
    }
  }

  const runEffect = (
    form: ReturnType<typeof makeForm>,
    firstRunRef: { current: boolean }
  ) => {
    if (firstRunRef.current) {
      firstRunRef.current = false
      return
    }
    form.resetFields(['company'])
  }

  it('першый запуск не скидує компанію (mount)', () => {
    const form = makeForm()
    const ref = { current: true }
    form.setFieldsValue({ company: 'company-1' })
    runEffect(form, ref)
    expect(form.resetFields).not.toHaveBeenCalled()
    expect(ref.current).toBe(false)
  })

  it('зміна домену скидує компанію', () => {
    const form = makeForm()
    const ref = { current: false }
    form.setFieldsValue({ company: 'company-1' })
    runEffect(form, ref)
    expect(form.resetFields).toHaveBeenCalledWith(['company'])
  })

  it('зміна домену скидує компанію навіть якщо preselectedCompany задано', () => {
    const form = makeForm()
    const ref = { current: false }
    form.setFieldsValue({ company: 'company-1' })
    runEffect(form, ref)
    expect(form.resetFields).toHaveBeenCalledWith(['company'])
  })
})
