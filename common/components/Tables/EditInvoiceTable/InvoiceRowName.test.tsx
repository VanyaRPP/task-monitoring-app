import '@testing-library/jest-dom'
import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { Form, FormInstance } from 'antd'
import { ServiceType } from '@utils/constants'
import InvoiceRowName from './InvoiceRowName'

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    company: {},
    service: { date: new Date('2026-03-15') },
    prevService: null,
    prevPayment: null,
  }),
}))

// UpdateInvoiceButton has heavy dependencies (paymentContext, RTK query side
// effects via @utils/getInvoices). For Name-component visual tests we only
// care about layout, so stub it out and re-test the button's full behavior in
// UpdateInvoiceButton.test.tsx.
jest.mock('./UpdateInvoiceButton', () => ({
  __esModule: true,
  default: ({ serviceType }: { serviceType: string }) => (
    <button type="button" data-testid="update-btn" data-service={serviceType}>
      refresh
    </button>
  ),
}))

const baseProps = {
  form: {} as any,
  name: 0,
  serviceType: ServiceType.Maintenance,
}

// Wrap InvoiceRowName in a real antd Form so editable-mode tests can read /
// write the form fields the component touches. Returns the form instance so
// tests can inspect what the seed-effect wrote.
const renderWithForm = (
  props: Omit<React.ComponentProps<typeof InvoiceRowName>, 'form'>,
  initialValues?: any
) => {
  const formRef: { current: FormInstance | null } = { current: null }
  const Wrapper = () => {
    const [form] = Form.useForm()
    formRef.current = form
    return (
      <Form form={form} initialValues={initialValues}>
        <InvoiceRowName {...props} form={form} />
      </Form>
    )
  }
  const utils = render(<Wrapper />)
  return { form: formRef.current as FormInstance, ...utils }
}

describe('<InvoiceRowName>', () => {
  it('renders the label', () => {
    render(<InvoiceRowName {...baseProps} label="Утримання" />)
    expect(screen.queryByText('Утримання')).not.toBeNull()
  })

  it('falls back to the service date as subtitle when none is provided', () => {
    render(<InvoiceRowName {...baseProps} label="Утримання" />)
    // formatted via dateToMonthYear/toFirstUpperCase — assert non-empty
    // *secondary* line is rendered (not equal to the label).
    const all = screen.getAllByText(/.+/)
    expect(all.length).toBeGreaterThan(1)
  })

  it('uses the override subtitle when provided', () => {
    render(
      <InvoiceRowName {...baseProps} label="Інфляція" subtitle="Лютий 2026" />
    )
    expect(screen.queryByText('Лютий 2026')).not.toBeNull()
  })

  it('renders the optional middle line', () => {
    render(
      <InvoiceRowName
        {...baseProps}
        label="Розміщення"
        middle="(без врах. інд. інф.)"
      />
    )
    expect(screen.queryByText('(без врах. інд. інф.)')).not.toBeNull()
  })

  it('omits the middle line when no middle prop is provided', () => {
    render(<InvoiceRowName {...baseProps} label="Знижка" />)
    expect(screen.queryByText(/\(.*\)/)).toBeNull()
  })

  it('hides UpdateInvoiceButton when not editable', () => {
    render(<InvoiceRowName {...baseProps} label="Утримання" />)
    expect(screen.queryByTestId('update-btn')).toBeNull()
  })

  it('renders UpdateInvoiceButton with the given serviceType when editable', () => {
    // editable mode reads from form (seed-effect calls getFieldValue), so we
    // must mount inside a real <Form> rather than passing a bare {}.
    renderWithForm({
      name: 0,
      serviceType: ServiceType.Maintenance,
      label: 'Утримання',
      editable: true,
    })
    const btn = screen.getByTestId('update-btn')
    expect(btn.getAttribute('data-service')).toBe(ServiceType.Maintenance)
  })

  //description is the optional note shown under the name)
  describe('name + note rendering', () => {
    it('shows record.customName instead of the label when not editable', () => {
      render(
        <InvoiceRowName
          {...baseProps}
          label="Утримання"
          record={{ customName: 'Custom label from user' } as any}
        />
      )
      expect(screen.queryByText('Custom label from user')).not.toBeNull()
      // label is the fallback, so it must NOT also appear
      expect(screen.queryByText('Утримання')).toBeNull()
    })

    it('falls back to label when record has no customName (non-editable)', () => {
      render(
        <InvoiceRowName {...baseProps} label="Утримання" record={{} as any} />
      )
      expect(screen.queryByText('Утримання')).not.toBeNull()
    })

    it('treats empty-string customName as missing and shows the label', () => {
      // record?.customName || label — '' is falsy, so label wins.
      render(
        <InvoiceRowName
          {...baseProps}
          label="Утримання"
          record={{ customName: '' } as any}
        />
      )
      expect(screen.queryByText('Утримання')).not.toBeNull()
    })

    it('shows record.description as the note under the name when not editable', () => {
      render(
        <InvoiceRowName
          {...baseProps}
          label="Утримання"
          record={{ description: 'Друга половина місяця' } as any}
        />
      )
      expect(screen.queryByText('Друга половина місяця')).not.toBeNull()
    })
  })

  describe('editable input', () => {
    it('renders inputs bound to customName and description', () => {
      renderWithForm({
        name: 0,
        serviceType: ServiceType.Maintenance,
        label: 'Утримання',
        editable: true,
      })
      // editable mode swaps Typography.Text for the name input and adds the
      // optional note input below it.
      expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(2)
    })

    it('seeds invoice[name].customName with the label on first render', () => {
      const { form } = renderWithForm({
        name: 0,
        serviceType: ServiceType.Maintenance,
        label: 'Утримання',
        editable: true,
      })
      // useEffect runs once after mount — at that point the field is empty so
      // the component should write label into it.
      expect(form.getFieldValue(['invoice', 0, 'customName'])).toBe('Утримання')
    })

    it('does NOT overwrite an existing customName value on mount', () => {
      const { form } = renderWithForm(
        {
          name: 0,
          serviceType: ServiceType.Maintenance,
          label: 'Утримання',
          editable: true,
        },
        { invoice: [{ customName: 'Already set' }] }
      )
      expect(form.getFieldValue(['invoice', 0, 'customName'])).toBe(
        'Already set'
      )
    })

    it('shows defaultLabel inside the customName input when the form has no value yet', () => {
      renderWithForm({
        name: 0,
        serviceType: ServiceType.Maintenance,
        label: 'Утримання',
        editable: true,
      })
      // After the seed-effect runs, the form value === label, so the visible
      // name input value is the label too. The note input is the second
      // textbox and starts empty.
      const input = screen.getAllByRole('textbox')[0] as HTMLInputElement
      expect(input.value).toBe('Утримання')
    })

    it('does NOT render an input when editable but name is undefined', () => {
      render(
        <InvoiceRowName
          form={{} as any}
          serviceType={ServiceType.Maintenance}
          label="Утримання"
          editable
        />
      )
      // editable && nameArr.length > 0 — falsy → Typography branch
      expect(screen.queryByRole('textbox')).toBeNull()
      expect(screen.queryByText('Утримання')).not.toBeNull()
    })

    it('does NOT seed customName when label is not a string (e.g. ReactNode)', () => {
      const { form } = renderWithForm({
        name: 0,
        serviceType: ServiceType.Maintenance,
        label: <span>Утримання</span>,
        editable: true,
      })
      expect(form.getFieldValue(['invoice', 0, 'customName'])).toBeUndefined()
    })
  })
})
