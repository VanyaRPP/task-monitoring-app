import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportInvoicesModal from '.'

let draftResult: () => Promise<unknown>
const draftInvoiceFromText = jest.fn(() => ({ unwrap: () => draftResult() }))

let mockDomainId: string | undefined
let mockCompanyId: string | undefined

jest.mock('@common/api/paymentApi/payment.api', () => ({
  useDraftInvoiceFromTextMutation: () => [
    draftInvoiceFromText,
    { isLoading: false },
  ],
}))
jest.mock('@components/UI/Reusable/DomainsSelect', () => {
  const { createElement } = require('react')
  const { Form, Input } = require('antd')
  return function MockDomainsSelect() {
    return createElement(
      Form.Item,
      { name: 'domain', initialValue: mockDomainId, hidden: true },
      createElement(Input)
    )
  }
})
jest.mock('@components/Forms/AddPaymentForm/CompanySelect', () => {
  const { createElement } = require('react')
  const { Form, Input } = require('antd')
  return function MockCompanySelect() {
    return createElement(
      Form.Item,
      { name: 'company', initialValue: mockCompanyId, hidden: true },
      createElement(Input)
    )
  }
})
jest.mock('@components/UI/Reusable/AddressesSelect', () => () => null)
jest.mock('@components/AddPaymentModal', () => {
  const { createElement } = require('react')
  return function MockAddPaymentModal({ paymentData, closeModal }) {
    return createElement(
      'div',
      { role: 'dialog', 'aria-label': 'Форма рахунку' },
      `Рахунок для ${paymentData.company}`,
      createElement('button', { onClick: () => closeModal(true) }, 'Зберегти'),
      createElement('button', { onClick: () => closeModal(false) }, 'Скасувати')
    )
  }
})

const draft = {
  type: 'debit',
  domain: 'd1',
  company: 'c1',
  monthService: 'ms-sep',
  period: { year: 2026, month: 9 },
  invoice: [
    { type: 'custom', name: 'Rent', amount: 1, price: 5000, sum: 5000 },
  ],
  extraLines: [],
  replaceLines: true,
  generalSum: 5000,
}

const inputField = () => screen.getByLabelText('Опис')
const enter = async (value: string) => {
  await userEvent.click(inputField())
  await userEvent.paste(value)
}
const clickImport = () =>
  userEvent.click(screen.getByRole('button', { name: 'Імпортувати' }))
const invoiceForm = () =>
  screen.queryByRole('dialog', { name: 'Форма рахунку' })

beforeEach(() => {
  draftInvoiceFromText.mockClear()
  draftResult = () => Promise.resolve(draft)
  mockDomainId = 'd1'
  mockCompanyId = 'c1'
})

describe('ImportInvoicesModal — everything goes through the AI agent', () => {
  it('shows an English example of words and JSON before anything is typed', () => {
    render(<ImportInvoicesModal closeModal={jest.fn()} />)

    const placeholder = inputField().getAttribute('placeholder')
    expect(placeholder).toContain('September: rent 5000')
    expect(placeholder).toContain('"services"')
    expect(
      screen.queryByRole('button', { name: 'Додати' })
    ).not.toBeInTheDocument()
  })

  it('sends JSON to the agent and opens the filled invoice form', async () => {
    const json = '{"month":"09.2026","services":[{"name":"Rent","sum":5000}]}'
    render(<ImportInvoicesModal closeModal={jest.fn()} />)

    await enter(json)
    await clickImport()

    expect(
      await screen.findByRole('dialog', { name: 'Форма рахунку' })
    ).toHaveTextContent('Рахунок для c1')
    expect(draftInvoiceFromText).toHaveBeenCalledWith({
      text: json,
      companyId: 'c1',
      domainId: 'd1',
    })
  })

  it('sends words to the agent and opens the filled invoice form', async () => {
    render(<ImportInvoicesModal closeModal={jest.fn()} />)

    await enter('September: rent 5000')
    await clickImport()

    expect(
      await screen.findByRole('dialog', { name: 'Форма рахунку' })
    ).toBeInTheDocument()
    expect(draftInvoiceFromText).toHaveBeenCalledWith({
      text: 'September: rent 5000',
      companyId: 'c1',
      domainId: 'd1',
    })
  })

  it('closes the import once the invoice is saved', async () => {
    const closeModal = jest.fn()
    render(<ImportInvoicesModal closeModal={closeModal} />)

    await enter('September: rent 5000')
    await clickImport()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Зберегти' })
    )

    expect(closeModal).toHaveBeenCalled()
  })

  it('goes back to the text when the invoice form is cancelled', async () => {
    const closeModal = jest.fn()
    render(<ImportInvoicesModal closeModal={closeModal} />)

    await enter('September: rent 5000')
    await clickImport()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Скасувати' })
    )

    expect(invoiceForm()).not.toBeInTheDocument()
    expect(closeModal).not.toHaveBeenCalled()
    expect(inputField()).toHaveValue('September: rent 5000')
  })

  it('requires the field to be filled', async () => {
    render(<ImportInvoicesModal closeModal={jest.fn()} />)

    await clickImport()

    expect(await screen.findByText("Поле обов'язкове!")).toBeInTheDocument()
    expect(draftInvoiceFromText).not.toHaveBeenCalled()
  })

  it('asks to pick the company before calling the agent', async () => {
    mockCompanyId = undefined
    render(<ImportInvoicesModal closeModal={jest.fn()} />)

    await enter('September: rent 5000')
    await clickImport()

    expect(
      await screen.findByText('Спершу оберіть надавача і компанію')
    ).toBeInTheDocument()
    expect(draftInvoiceFromText).not.toHaveBeenCalled()
  })

  it('shows why the agent could not build the invoice', async () => {
    draftResult = () =>
      Promise.reject({
        data: { message: 'У тексті не знайдено жодної послуги' },
      })
    render(<ImportInvoicesModal closeModal={jest.fn()} />)

    await enter('hello')
    await clickImport()

    expect(
      await screen.findByText('У тексті не знайдено жодної послуги')
    ).toBeInTheDocument()
    expect(invoiceForm()).not.toBeInTheDocument()
  })
})
