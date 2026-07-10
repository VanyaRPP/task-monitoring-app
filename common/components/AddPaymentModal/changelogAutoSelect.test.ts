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
    changelogData: { _id: string; reason?: string }[] | undefined
  ) => {
    if (autoSelectedRef.current) return
    if (!changelogData?.length) return

    const latestManualLog = changelogData.find((log) => log.reason === 'manual')
    if (!latestManualLog) return

    autoSelectedRef.current = true
    form.setFieldsValue({ changelogId: latestManualLog._id })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('auto-selects latest manual changelog when it exists', () => {
    const form = makeForm()
    const ref = { current: false }
    const logs = [
      { _id: 'manual-log', reason: 'manual' },
      { _id: 'edit-log', reason: 'edit-payment' },
    ]

    runEffect(form, ref, logs)

    expect(form.setFieldsValue).toHaveBeenCalledWith({
      changelogId: 'manual-log',
    })
    expect(ref.current).toBe(true)
  })

  it('does NOT auto-select when only edit-payment changelogs exist (before-state)', () => {
    const form = makeForm()
    const ref = { current: false }
    const logs = [
      { _id: 'edit-log-1', reason: 'edit-payment' },
      { _id: 'edit-log-2', reason: 'edit-payment' },
    ]

    runEffect(form, ref, logs)

    expect(form.setFieldsValue).not.toHaveBeenCalled()
    expect(ref.current).toBe(false)
  })

  it('picks the first manual changelog when mixed types exist', () => {
    const form = makeForm()
    const ref = { current: false }
    const logs = [
      { _id: 'edit-newest', reason: 'edit-payment' },
      { _id: 'manual-latest', reason: 'manual' },
      { _id: 'manual-older', reason: 'manual' },
    ]

    runEffect(form, ref, logs)

    expect(form.setFieldsValue).toHaveBeenCalledWith({
      changelogId: 'manual-latest',
    })
  })

  it('does not override when auto-select already happened', () => {
    const form = makeForm()
    const ref = { current: true }
    const logs = [{ _id: 'manual-log', reason: 'manual' }]

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
    const logs = [{ _id: 'manual-log', reason: 'manual' }]

    runEffect(form, ref, logs)
    runEffect(form, ref, logs)
    runEffect(form, ref, logs)

    expect(form.setFieldsValue).toHaveBeenCalledTimes(1)
  })

  it('does not auto-select a log without a reason field', () => {
    const form = makeForm()
    const ref = { current: false }
    const logs = [{ _id: 'no-reason-log' }]

    runEffect(form, ref, logs)

    expect(form.setFieldsValue).not.toHaveBeenCalled()
  })
})
