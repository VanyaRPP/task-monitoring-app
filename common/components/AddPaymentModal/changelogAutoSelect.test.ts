describe('changelog auto-select on edit modal open', () => {
  const makeForm = () => {
    const fields: Record<string, any> = {}
    return {
      setFieldsValue: jest.fn((vals: Record<string, any>) =>
        Object.assign(fields, vals)
      ),
      getFieldValue: (key: string) => fields[key],
      _fields: fields,
    }
  }

  const runEffect = (
    form: ReturnType<typeof makeForm>,
    autoSelectedRef: { current: boolean },
    changelogData: { _id: string }[] | undefined
  ) => {
    if (autoSelectedRef.current) return
    if (!changelogData?.length) return

    autoSelectedRef.current = true
    form.setFieldsValue({ changelogId: changelogData[0]._id })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('auto-selects latest changelog when data loads and nothing is selected', () => {
    const form = makeForm()
    const ref = { current: false }
    const logs = [{ _id: 'log-3' }, { _id: 'log-2' }, { _id: 'log-1' }]

    runEffect(form, ref, logs)

    expect(form.setFieldsValue).toHaveBeenCalledWith({ changelogId: 'log-3' })
    expect(ref.current).toBe(true)
  })

  it('does not override when user already selected a changelog', () => {
    const form = makeForm()
    const ref = { current: true }
    const logs = [{ _id: 'log-3' }, { _id: 'log-2' }]

    runEffect(form, ref, logs)

    expect(form.setFieldsValue).not.toHaveBeenCalled()
  })

  it('does nothing when changelog list is empty', () => {
    const form = makeForm()
    const ref = { current: false }

    runEffect(form, ref, [])

    expect(form.setFieldsValue).not.toHaveBeenCalled()
    expect(ref.current).toBe(false)
  })

  it('does nothing when changelog data is undefined (still loading)', () => {
    const form = makeForm()
    const ref = { current: false }

    runEffect(form, ref, undefined)

    expect(form.setFieldsValue).not.toHaveBeenCalled()
    expect(ref.current).toBe(false)
  })

  it('auto-selects only once even if effect fires multiple times', () => {
    const form = makeForm()
    const ref = { current: false }
    const logs = [{ _id: 'log-3' }, { _id: 'log-2' }]

    runEffect(form, ref, logs)
    runEffect(form, ref, logs)
    runEffect(form, ref, logs)

    expect(form.setFieldsValue).toHaveBeenCalledTimes(1)
    expect(form.setFieldsValue).toHaveBeenCalledWith({ changelogId: 'log-3' })
  })

  it('selects first entry in array (which is the most recent, sorted desc by date)', () => {
    const form = makeForm()
    const ref = { current: false }
    const logs = [
      { _id: 'newest', date: '2026-05-28T10:00:00Z' },
      { _id: 'older', date: '2026-04-01T10:00:00Z' },
    ]

    runEffect(form, ref, logs)

    expect(form._fields.changelogId).toBe('newest')
  })
})
