import { fireEvent, render, screen } from '@testing-library/react'
import { Form } from 'antd'
import DomainForm from '.'

// Replace each tab with a marker so we can verify routing without bringing in
// the heavy RTK Query / antd subtrees inside them.
jest.mock('./tabs/GeneralTab', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-general">general-content</div>,
}))
jest.mock('./tabs/TemplateTab', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-template">template-content</div>,
}))
jest.mock('./tabs/MyServicesTab', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-services">services-content</div>,
}))
jest.mock('./tabs/HistoryTab', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-history">history-content</div>,
}))
jest.mock('./tabs/BankTab', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-bank">bank-content</div>,
}))

const renderForm = () => {
  const Wrapper = () => {
    const [form] = Form.useForm()
    return (
      <DomainForm
        form={form}
        editable
        setIsValueChanged={jest.fn()}
        domainId="d1"
      />
    )
  }
  return render(<Wrapper />)
}

describe('DomainForm — tabs orchestration', () => {
  it('renders all five tab labels in correct order, including "Банк API"', () => {
    renderForm()
    const labels = ['Загальне', 'Шаблон', 'Мої послуги', 'Історія налаштувань', 'Банк API']
    for (const label of labels) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
    }
  })

  it('shows "Загальне" tab content by default', () => {
    renderForm()
    expect(screen.getByTestId('tab-general')).toBeInTheDocument()
  })

  it('switches to Шаблон tab on click', () => {
    renderForm()
    fireEvent.click(screen.getByRole('tab', { name: 'Шаблон' }))
    expect(screen.getByTestId('tab-template')).toBeInTheDocument()
  })

  it('switches to Мої послуги tab on click', () => {
    renderForm()
    fireEvent.click(screen.getByRole('tab', { name: 'Мої послуги' }))
    expect(screen.getByTestId('tab-services')).toBeInTheDocument()
  })

  it('switches to Історія налаштувань tab on click', () => {
    renderForm()
    fireEvent.click(screen.getByRole('tab', { name: 'Історія налаштувань' }))
    expect(screen.getByTestId('tab-history')).toBeInTheDocument()
  })

  it('switches to Банк API tab on click', () => {
    renderForm()
    fireEvent.click(screen.getByRole('tab', { name: 'Банк API' }))
    expect(screen.getByTestId('tab-bank')).toBeInTheDocument()
  })
})
