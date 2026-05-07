import { render, screen } from '@testing-library/react'
import { Form } from 'antd'
import PaymentTypeSelect from './PaymentTypeSelect'
import { Operations } from '@utils/constants'

jest.mock('./style.module.scss', () => ({
  customSegmented: 'customSegmented',
  segmentedLabel: 'segmentedLabel',
  creditSegment: 'creditSegment',
  debitSegment: 'debitSegment',
}))

const renderInForm = (initialValues?: { operation?: string }) =>
  render(
    <Form initialValues={initialValues}>
      <PaymentTypeSelect />
    </Form>
  )

const getSelectedSegment = () =>
  document.querySelector('.ant-segmented-item-selected')

describe('PaymentTypeSelect', () => {
  it('highlights "Кредит" segment when form initialValue is credit', () => {
    renderInForm({ operation: Operations.Credit })
    const selected = getSelectedSegment()
    expect(selected?.textContent).toContain('Кредит')
  })

  it('highlights "Дебет" segment when form initialValue is debit', () => {
    renderInForm({ operation: Operations.Debit })
    const selected = getSelectedSegment()
    expect(selected?.textContent).toContain('Дебет')
  })

  it('renders both segments regardless of initial value', () => {
    renderInForm({ operation: Operations.Credit })
    expect(screen.getByText('Кредит (Оплата)')).toBeInTheDocument()
    expect(screen.getByText('Дебет (Реалізація)')).toBeInTheDocument()
  })

  it('falls back to Credit segment when form has no operation value (antd selects first option)', () => {
    // Both antd Segmented and AddPaymentModal default to Credit when no
    // payment.type is provided — keeps the visible state and the form state
    // consistent.
    renderInForm({})
    const selected = getSelectedSegment()
    expect(selected?.textContent).toContain('Кредит')
  })
})
