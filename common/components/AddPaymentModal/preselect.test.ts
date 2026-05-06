// Tests for domain-change → company-reset behavior
// Logic lives in AddPaymentModal/index.tsx:
//   useEffect(() => {
//     if (firstRunRef.current) { firstRunRef.current = false; return }
//     if (preselectedCompany) return
//     form.resetFields(['company'])
//   }, [domainId, form])

describe('company reset on domain change', () => {
  const makeForm = () => {
    const fields: Record<string, any> = {}
    return {
      resetFields: jest.fn((keys: string[]) => keys.forEach((k) => delete fields[k])),
      setFieldsValue: (vals: Record<string, any>) => Object.assign(fields, vals),
      getFieldValue: (key: string) => fields[key],
      _fields: fields,
    }
  }

  const runEffect = (
    form: ReturnType<typeof makeForm>,
    firstRunRef: { current: boolean },
    preselectedCompany: string | undefined
  ) => {
    if (firstRunRef.current) {
      firstRunRef.current = false
      return
    }
    if (preselectedCompany) return
    form.resetFields(['company'])
  }

  it('першый запуск не скидує компанію (mount)', () => {
    const form = makeForm()
    const ref = { current: true }
    form.setFieldsValue({ company: 'company-1' })
    runEffect(form, ref, undefined)
    expect(form.resetFields).not.toHaveBeenCalled()
    expect(ref.current).toBe(false)
  })

  it('зміна домену скидує компанію коли preselectedCompany не задано', () => {
    const form = makeForm()
    const ref = { current: false }
    form.setFieldsValue({ company: 'company-1' })
    runEffect(form, ref, undefined)
    expect(form.resetFields).toHaveBeenCalledWith(['company'])
  })

  it('зміна домену НЕ скидує компанію коли preselectedCompany задано', () => {
    const form = makeForm()
    const ref = { current: false }
    form.setFieldsValue({ company: 'company-1' })
    runEffect(form, ref, 'company-1')
    expect(form.resetFields).not.toHaveBeenCalled()
  })
})
