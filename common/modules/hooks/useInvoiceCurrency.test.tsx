import '@testing-library/jest-dom'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, waitFor, act } from '@testing-library/react'
import { Form, FormInstance, Input } from 'antd'
import { useInvoiceCurrency } from './useInvoiceCurrency'
import { Price as MaintenancePrice } from '@components/Tables/EditInvoiceTable/Maintenance'

let mockForm: FormInstance | undefined
let mockCompany: { currency?: string } | undefined
let mockPayment: { currency?: string } | undefined

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    form: mockForm,
    company: mockCompany,
    payment: mockPayment,
  }),
}))

const CurrencyProbe = () => {
  const currency = useInvoiceCurrency()
  return <span data-testid="tab-currency">{currency}</span>
}

const renderHarness = (
  company: { currency?: string } | undefined,
  initialCurrency?: string,
  payment?: { currency?: string }
) => {
  mockCompany = company
  mockPayment = payment
  const formRef: { current: FormInstance | null } = { current: null }

  const Harness = () => {
    const [form] = Form.useForm()
    formRef.current = form
    mockForm = form
    return (
      <Form
        form={form}
        initialValues={{
          currency: initialCurrency,
          invoice: { m: { price: 10 } },
        }}
      >
        <Form.Item name="currency" hidden>
          <Input />
        </Form.Item>
        <Form.Item name={['invoice', 'm', 'price']} hidden>
          <Input />
        </Form.Item>
        <CurrencyProbe />
        <div data-testid="table-cell">
          <MaintenancePrice form={form} name={['m']} editable={false} />
        </div>
      </Form>
    )
  }

  render(<Harness />)
  return formRef
}

const tabCurrency = () => screen.getByTestId('tab-currency').textContent
const tableCellText = () => screen.getByTestId('table-cell').textContent ?? ''

beforeEach(() => {
  mockForm = undefined
  mockCompany = undefined
  mockPayment = undefined
})

describe('useInvoiceCurrency — єдине джерело валюти інвойсу', () => {
  it('за замовчуванням бере валюту компанії', () => {
    renderHarness({ currency: 'USD' })

    expect(tabCurrency()).toBe('USD')
    expect(tableCellText()).toContain('USD')
  })

  it('повертає UAH, коли немає ні селектора, ні валюти компанії', () => {
    renderHarness(undefined)

    expect(tabCurrency()).toBe('UAH')
    expect(tableCellText()).toContain('грн')
  })

  it('вибрана у селекторі валюта має пріоритет над валютою компанії', () => {
    renderHarness({ currency: 'USD' }, 'EUR')

    expect(tabCurrency()).toBe('EUR')
    expect(tableCellText()).toContain('EUR')
  })

  it('перегляд (без значення в селекторі) бере збережену валюту інвойсу, а не компанії', () => {
    renderHarness({ currency: 'USD' }, undefined, { currency: 'UAH' })

    expect(tabCurrency()).toBe('UAH')
    expect(tableCellText()).toContain('грн')
  })

  it('таблиця і вкладки показують ОДНУ валюту й оновлюються разом після зміни селектора', async () => {
    const formRef = renderHarness({ currency: 'USD' })

    expect(tabCurrency()).toBe('USD')
    expect(tableCellText()).toContain('USD')

    act(() => {
      formRef.current?.setFieldValue('currency', 'EUR')
    })

    await waitFor(() => {
      expect(tabCurrency()).toBe('EUR')
    })
    expect(tableCellText()).toContain('EUR')
    expect(tableCellText()).not.toContain('USD')
  })
})
