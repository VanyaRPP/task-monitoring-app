import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionDrawer from './TransactionsDrawer'

let lastPaymentData: any = null

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(),
}))

jest.mock('@components/AddPaymentModal', () => ({
  __esModule: true,
  default: ({ closeModal, paymentData }: { closeModal: (success?: boolean) => void; paymentData: any }) => {
    lastPaymentData = paymentData 
    return (
      <div data-testid="add-payment-modal">
        <button onClick={() => closeModal(true)}>Confirm</button>
        <button onClick={() => closeModal(false)}>Cancel</button>
      </div>
    )
  },
}))

import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
const mockUseGetAllRealEstateQuery = useGetAllRealEstateQuery as jest.Mock

const getDropdownSendButton = () =>
  Array.from(document.querySelectorAll('button')).find((btn) =>
    btn.querySelector('.anticon-down')
  )

const makeTransaction = (overrides = {}) => ({
  TECHNICAL_TRANSACTION_ID: 'tx_001',
  AUT_CNTR_MFO: '322001',
  AUT_CNTR_ACC: '1234567890',
  AUT_CNTR_NAM: 'ТОВ Тест',
  AUT_MY_CRF: '2479002623',
  AUT_MY_MFO: '305299',
  AUT_MY_ACC: 'UA483052990000026004006407606',
  AUT_MY_NAM: 'Тест Т. Е. ФОП',
  AUT_MY_MFO_NAME: 'ПРИВАТБАНК',
  AUT_MY_MFO_CITY: 'Дніпро',
  AUT_CNTR_MFO_NAME: 'УНІВЕРСАЛ БАНК',
  AUT_CNTR_MFO_CITY: 'Київ',
  AUT_CNTR_CRF: '2359317190',
  CCY: 'UAH',
  FL_REAL: 'r',
  PR_PR: 'r',
  DOC_TYP: 'p',
  NUM_DOC: '870114288',
  DAT_KL: '22.12.2025',
  DAT_OD: '22.12.2025',
  OSND: 'Оплата за послуги',
  SUM: '9134.25',
  SUM_E: '9134.25',
  REF: 'HS4AP1222L05X7',
  REFN: 'P',
  TIM_P: '15:45',
  DATE_TIME_DAT_OD_TIM_P: '22.12.2025 15:45:00',
  ID: '4637687866',
  TRANTYPE: 'C',
  DLR: null,
  isMatchingPayment: false,
  previousCompanyId: null,
  ...overrides,
})

const makeCompany = (overrides = {}) => ({
  _id: 'company_001',
  companyName: 'ТОВ Тест',
  mfo: '322001',
  domain: { _id: 'domain_001' },
  street: { _id: 'street_001' },
  adminEmails: [],
  pricePerMeter: 100,
  totalArea: 50,
  description: '',
  services: [],
  ...overrides,
})

const makeDomain = () => ({ _id: 'domain_001', name: 'Test Domain' })

const renderDrawer = (transaction = makeTransaction(), domain = makeDomain()) =>
  render(<TransactionDrawer transaction={transaction} domain={domain as any} />)

beforeEach(() => {
  jest.clearAllMocks()
  lastPaymentData = null
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
  mockUseGetAllRealEstateQuery.mockReturnValue({
    data: { data: [makeCompany()] },
  })
})



describe('Badge "Платіж є"', () => {
  it('is hidden when isMatchingPayment is false', () => {
    renderDrawer(makeTransaction({ isMatchingPayment: false }))
    const ribbon = document.querySelector('.ant-ribbon')
    expect(ribbon).toHaveStyle({ visibility: 'hidden' })
  })

  it('is visible when isMatchingPayment is true', async () => {
    renderDrawer(makeTransaction({ isMatchingPayment: true }))
    await waitFor(() => {
      const ribbon = document.querySelector('.ant-ribbon')
      expect(ribbon).toHaveStyle({ visibility: 'visible' })
    })
  })

  it('remains visible even after user selects a company (badge is read-only from backend)', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ mfo: 'OTHER_MFO' })] },
    })

    renderDrawer(makeTransaction({ isMatchingPayment: true }))

    const select = screen.getByRole('combobox')
    await userEvent.click(select)
    const option = await screen.findByText('ТОВ Тест')
    await userEvent.click(option)

    await waitFor(() => {
      const ribbon = document.querySelector('.ant-ribbon')
      expect(ribbon).toHaveStyle({ visibility: 'visible' })
    })
  })

  it('stays hidden after transaction switch if new transaction has isMatchingPayment=false', async () => {
    const { rerender } = renderDrawer(makeTransaction({ isMatchingPayment: true }))

    rerender(
      <TransactionDrawer
        transaction={makeTransaction({ TECHNICAL_TRANSACTION_ID: 'tx_002', isMatchingPayment: false })}
        domain={makeDomain() as any}
      />
    )

    await waitFor(() => {
      const ribbon = document.querySelector('.ant-ribbon')
      expect(ribbon).toHaveStyle({ visibility: 'hidden' })
    })
  })
})



describe('State reset when transaction changes', () => {
  it('clears selectedCompany when TECHNICAL_TRANSACTION_ID changes', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ mfo: 'OTHER_MFO' })] },
    })

    const { rerender } = renderDrawer(makeTransaction())

    const select = screen.getByRole('combobox')
    await userEvent.click(select)
    const option = await screen.findByText('ТОВ Тест')
    await userEvent.click(option)

    await waitFor(() => {
      expect(document.querySelector('.ant-select-selection-item')).toHaveTextContent('ТОВ Тест')
    })

    rerender(
      <TransactionDrawer
        transaction={makeTransaction({ TECHNICAL_TRANSACTION_ID: 'tx_002', AUT_CNTR_MFO: 'UNKNOWN' })}
        domain={makeDomain() as any}
      />
    )

    await waitFor(() => {
      expect(document.querySelector('.ant-select-selection-item')).toBeNull()
    })
  })

  it('clears isMfoMatched when transaction changes — shows plain Send button, not Dropdown', async () => {
    const { rerender } = renderDrawer()

    await waitFor(() => {
      expect(getDropdownSendButton()).toBeTruthy()
    })

    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ mfo: 'NO_MATCH' })] },
    })

    rerender(
      <TransactionDrawer
        transaction={makeTransaction({ TECHNICAL_TRANSACTION_ID: 'tx_002', AUT_CNTR_MFO: 'NO_MATCH_MFO' })}
        domain={makeDomain() as any}
      />
    )

    await waitFor(() => {
      expect(getDropdownSendButton()).toBeFalsy()
      const sendButton = screen.getByRole('button', { name: /Send/i })
      expect(sendButton).toBeDisabled()
    })
  })
})



describe('MFO auto-match', () => {
  it('auto-selects company when company.mfo matches transaction.AUT_CNTR_MFO', async () => {
    renderDrawer()

    await waitFor(() => {
      expect(document.querySelector('.ant-select-selection-item')).toHaveTextContent('ТОВ Тест')
    })
  })

  it('does not auto-select when mfo does not match', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ mfo: 'NO_MATCH' })] },
    })

    renderDrawer()

    await waitFor(() => {
      expect(document.querySelector('.ant-select-selection-item')).toBeNull()
    })
  })

  it('shows Dropdown Send button when MFO matched', async () => {
    renderDrawer()

    await waitFor(() => {
      expect(getDropdownSendButton()).toBeTruthy()
    })
  })

  it('shows plain Send button disabled when no MFO match and no company selected', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ mfo: 'NO_MATCH' })] },
    })

    renderDrawer()

    await waitFor(() => {
      expect(getDropdownSendButton()).toBeFalsy()
      const sendButton = screen.getByRole('button', { name: /Send/i })
      expect(sendButton).toBeDisabled()
    })
  })

  it('shows plain Send button enabled after manual company selection', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ mfo: 'NO_MATCH' })] },
    })

    renderDrawer()

    const select = screen.getByRole('combobox')
    await userEvent.click(select)
    const option = await screen.findByText('ТОВ Тест')
    await userEvent.click(option)

    await waitFor(() => {
      expect(getDropdownSendButton()).toBeFalsy()
      const sendButton = screen.getByRole('button', { name: /Send/i })
      expect(sendButton).not.toBeDisabled()
    })
  })
})

describe('transactionPayload includes TECHNICAL_TRANSACTION_ID', () => {
  it('passes TECHNICAL_TRANSACTION_ID to AddPaymentModal via paymentData.transaction', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ mfo: 'NO_MATCH' })] },
    })

    renderDrawer(makeTransaction({ TECHNICAL_TRANSACTION_ID: 'tx_unique_001' }))

    const select = screen.getByRole('combobox')
    await userEvent.click(select)
    const option = await screen.findByText('ТОВ Тест')
    await userEvent.click(option)

    const sendButton = screen.getByRole('button', { name: /Send/i })
    await userEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByTestId('add-payment-modal')).toBeInTheDocument()
    })

    
    expect(lastPaymentData?.transaction?.TECHNICAL_TRANSACTION_ID).toBe('tx_unique_001')
  })
})

describe('saveMfoToCompany after successful payment creation', () => {
  it('calls PATCH with mfo when modal closes with success=true and company was manually selected', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ mfo: undefined })] },
    })

    renderDrawer(makeTransaction({ AUT_CNTR_MFO: '322001' }))

    const select = screen.getByRole('combobox')
    await userEvent.click(select)
    const option = await screen.findByText('ТОВ Тест')
    await userEvent.click(option)

    const sendButton = screen.getByRole('button', { name: /Send/i })
    await userEvent.click(sendButton)

    const confirmButton = await screen.findByText('Confirm')
    await userEvent.click(confirmButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/realestate/company_001',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ mfo: '322001' }),
        })
      )
    })
  })

  it('does NOT call PATCH when company was auto-matched by MFO (already saved)', async () => {
    renderDrawer()

    await waitFor(() => {
      expect(getDropdownSendButton()).toBeTruthy()
    })

    const dropdownButton = getDropdownSendButton()!
    await userEvent.click(dropdownButton)
    const quickCreate = await screen.findByText('Швидке створення')
    await userEvent.click(quickCreate)

    const confirmButton = await screen.findByText('Confirm')
    await userEvent.click(confirmButton)

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/realestate/'),
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })

  it('does NOT call PATCH when modal closes with success=false', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ mfo: undefined })] },
    })

    renderDrawer()

    const select = screen.getByRole('combobox')
    await userEvent.click(select)
    const option = await screen.findByText('ТОВ Тест')
    await userEvent.click(option)

    const sendButton = screen.getByRole('button', { name: /Send/i })
    await userEvent.click(sendButton)

    const cancelButton = await screen.findByText('Cancel')
    await userEvent.click(cancelButton)

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})