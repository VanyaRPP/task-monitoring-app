import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionDrawer from './TransactionsDrawer'
import { Operations } from '@utils/constants'

let lastPaymentData: any = null

const mockEditRealEstate = jest.fn()
jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(),
  useEditRealEstateMutation: jest.fn(() => [mockEditRealEstate]),
}))

jest.mock('./useQuicksend', () => ({
  useQuickSend: jest.fn(() => ({
    handleQuickSend: jest.fn(),
    services: [],
    loading: false,
  })),
}))

jest.mock('@components/AddPaymentModal', () => ({
  __esModule: true,
  default: ({
    closeModal,
    paymentData,
  }: {
    closeModal: (success?: boolean) => void
    paymentData: any
  }) => {
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
  Array.from(document.querySelectorAll('button')).find(
    (btn) =>
      btn.textContent?.includes('Send') && btn.querySelector('.anticon-down')
  )

const makeTransaction = (overrides = {}) => ({
  TECHNICAL_TRANSACTION_ID: 'tx_001',
  AUT_CNTR_ACC: 'UA803220010000026001350058717',
  AUT_CNTR_MFO: '322001',
  AUT_CNTR_NAM: 'ТОВ Тест',
  AUT_MY_CRF: '0000000000',
  AUT_MY_MFO: '300000',
  AUT_MY_ACC: 'UA300000000000000000000000001',
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
  account: 'UA803220010000026001350058717',
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
    expect(document.querySelector('.ant-ribbon')).toHaveStyle({
      visibility: 'hidden',
    })
  })

  it('is visible when isMatchingPayment is true', async () => {
    renderDrawer(makeTransaction({ isMatchingPayment: true }))
    await waitFor(() => {
      expect(document.querySelector('.ant-ribbon')).toHaveStyle({
        visibility: 'visible',
      })
    })
  })

  it('remains visible after user selects a company (badge is read-only from backend)', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: 'OTHER_ACC' })] },
    })
    renderDrawer(makeTransaction({ isMatchingPayment: true }))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByText('ТОВ Тест'))

    await waitFor(() => {
      expect(document.querySelector('.ant-ribbon')).toHaveStyle({
        visibility: 'visible',
      })
    })
  })

  it('updates when switching to a transaction with isMatchingPayment=false', async () => {
    const { rerender } = renderDrawer(
      makeTransaction({ isMatchingPayment: true })
    )

    rerender(
      <TransactionDrawer
        transaction={makeTransaction({
          TECHNICAL_TRANSACTION_ID: 'tx_002',
          isMatchingPayment: false,
        })}
        domain={makeDomain() as any}
      />
    )

    await waitFor(() => {
      expect(document.querySelector('.ant-ribbon')).toHaveStyle({
        visibility: 'hidden',
      })
    })
  })
})

describe('State reset when transaction changes', () => {
  it('clears selectedCompany when TECHNICAL_TRANSACTION_ID changes', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: 'OTHER_ACC' })] },
    })
    const { rerender } = renderDrawer(makeTransaction())

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByText('ТОВ Тест'))
    await waitFor(() => {
      expect(
        document.querySelector('.ant-select-selection-item')
      ).toHaveTextContent('ТОВ Тест')
    })

    rerender(
      <TransactionDrawer
        transaction={makeTransaction({
          TECHNICAL_TRANSACTION_ID: 'tx_002',
          AUT_CNTR_ACC: 'UNKNOWN',
        })}
        domain={makeDomain() as any}
      />
    )

    await waitFor(() => {
      expect(document.querySelector('.ant-select-selection-item')).toBeNull()
    })
  })

  it('clears isAccountMatched on transaction change — Dropdown replaced with plain Send', async () => {
    const { rerender } = renderDrawer()

    await waitFor(() => expect(getDropdownSendButton()).toBeTruthy())

    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: 'NO_MATCH' })] },
    })

    rerender(
      <TransactionDrawer
        transaction={makeTransaction({
          TECHNICAL_TRANSACTION_ID: 'tx_002',
          AUT_CNTR_ACC: 'NO_MATCH_ACC',
        })}
        domain={makeDomain() as any}
      />
    )

    await waitFor(() => {
      expect(getDropdownSendButton()).toBeFalsy()
      expect(screen.getByRole('button', { name: /Send/i })).toBeDisabled()
    })
  })
})

describe('Account auto-match (AUT_CNTR_ACC)', () => {
  it('auto-selects company when company.account matches transaction.AUT_CNTR_ACC', async () => {
    renderDrawer()
    await waitFor(() => {
      expect(
        document.querySelector('.ant-select-selection-item')
      ).toHaveTextContent('ТОВ Тест')
    })
  })

  it('does not auto-select when account does not match', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: {
        data: [makeCompany({ account: 'UA000000000000000000000000000' })],
      },
    })
    renderDrawer()
    await waitFor(() => {
      expect(document.querySelector('.ant-select-selection-item')).toBeNull()
    })
  })

  it('correctly distinguishes two companies in the same bank (same MFO, different IBAN)', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: {
        data: [
          makeCompany({
            _id: 'company_A',
            companyName: 'Компанія А',
            account: 'UA111111111111111111111111111',
          }),
          makeCompany({
            _id: 'company_B',
            companyName: 'Компанія Б',
            account: 'UA803220010000026001350058717',
          }),
        ],
      },
    })

    renderDrawer(
      makeTransaction({ AUT_CNTR_ACC: 'UA803220010000026001350058717' })
    )

    await waitFor(() => {
      expect(
        document.querySelector('.ant-select-selection-item')
      ).toHaveTextContent('Компанія Б')
    })
  })

  it('shows Dropdown Send button when account matched', async () => {
    renderDrawer()
    await waitFor(() => expect(getDropdownSendButton()).toBeTruthy())
  })

  it('shows plain Send button disabled when no account match and no company selected', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: 'NO_MATCH' })] },
    })
    renderDrawer()
    await waitFor(() => {
      expect(getDropdownSendButton()).toBeFalsy()
      expect(screen.getByRole('button', { name: /Send/i })).toBeDisabled()
    })
  })

  it('enables plain Send button after manual selection', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: 'NO_MATCH' })] },
    })
    renderDrawer()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByText('ТОВ Тест'))

    await waitFor(() => {
      expect(getDropdownSendButton()).toBeFalsy()
      expect(screen.getByRole('button', { name: /Send/i })).not.toBeDisabled()
    })
  })
})

describe('Auto-match fallback for old companies (via previousCompanyId)', () => {
  it('auto-selects company by previousCompanyId when company has no account saved', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: undefined })] },
    })

    renderDrawer(
      makeTransaction({
        isMatchingPayment: true,
        previousCompanyId: 'company_001',
      })
    )

    await waitFor(() => {
      expect(
        document.querySelector('.ant-select-selection-item')
      ).toHaveTextContent('ТОВ Тест')
    })
  })

  it('auto-selects by previousCompanyId from account history (isMatchingPayment false)', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: undefined })] },
    })

    renderDrawer(
      makeTransaction({
        isMatchingPayment: false,
        previousCompanyId: 'company_001',
      })
    )

    await waitFor(() => {
      expect(
        document.querySelector('.ant-select-selection-item')
      ).toHaveTextContent('ТОВ Тест')
    })
  })

  it('prefers account match over previousCompanyId when both available', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: {
        data: [
          makeCompany({
            _id: 'company_acc',
            companyName: 'Account Company',
            account: 'UA803220010000026001350058717',
          }),
          makeCompany({
            _id: 'company_old',
            companyName: 'Old Company',
            account: undefined,
          }),
        ],
      },
    })

    renderDrawer(
      makeTransaction({
        AUT_CNTR_ACC: 'UA803220010000026001350058717',
        isMatchingPayment: true,
        previousCompanyId: 'company_old',
      })
    )

    await waitFor(() => {
      expect(
        document.querySelector('.ant-select-selection-item')
      ).toHaveTextContent('Account Company')
    })
  })

  it('transit account — auto-selects by previousCompanyId enriched from same OSND sibling', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: undefined })] },
    })

    renderDrawer(
      makeTransaction({
        AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
        AUT_CNTR_ACC: 'UA300000000000000000000000002',
        previousCompanyId: 'company_001',
        isMatchingPayment: false,
      })
    )

    await waitFor(() => {
      expect(
        document.querySelector('.ant-select-selection-item')
      ).toHaveTextContent('ТОВ Тест')
    })
  })

  it('transit account — shows no selection when previousCompanyId is null and account is transit', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: undefined })] },
    })

    renderDrawer(
      makeTransaction({
        AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
        AUT_CNTR_ACC: 'UA300000000000000000000000002',
        previousCompanyId: null,
        isMatchingPayment: false,
      })
    )

    await waitFor(() => {
      expect(document.querySelector('.ant-select-selection-item')).toBeNull()
    })
  })
})

describe('transactionPayload passed to AddPaymentModal', () => {
  it('includes TECHNICAL_TRANSACTION_ID reconstructed to canonical final form (REF+REFN+date+time)', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: 'NO_MATCH' })] },
    })
    renderDrawer(
      makeTransaction({ TECHNICAL_TRANSACTION_ID: 'tx_unique_001_online' })
    )

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByText('ТОВ Тест'))
    await userEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => {
      expect(screen.getByTestId('add-payment-modal')).toBeInTheDocument()
    })

    expect(lastPaymentData?.transaction?.TECHNICAL_TRANSACTION_ID).toBe(
      'HS4AP1222L05X7P22122025154500'
    )
  })

  it('includes OSND so future transit sibling lookups can find this payment', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: 'NO_MATCH' })] },
    })
    renderDrawer(
      makeTransaction({
        OSND: 'Сплата за послуги, Чорна Марина Євгеніївна',
      })
    )

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByText('ТОВ Тест'))
    await userEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => {
      expect(screen.getByTestId('add-payment-modal')).toBeInTheDocument()
    })

    expect(lastPaymentData?.transaction?.OSND).toBe(
      'Сплата за послуги, Чорна Марина Євгеніївна'
    )
  })
})
describe('Default operation type for AddPaymentModal (Send from Bank)', () => {
  it('passes type=Credit when opening the modal via manual Send', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: 'NO_MATCH' })] },
    })
    renderDrawer(makeTransaction({ AUT_CNTR_ACC: 'NO_MATCH_ACC' }))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByText('ТОВ Тест'))
    await userEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => {
      expect(screen.getByTestId('add-payment-modal')).toBeInTheDocument()
    })

    expect(lastPaymentData?.type).toBe(Operations.Credit) // see note below
  })

  it('passes type=Credit when opening the modal via "Швидке створення" (matched account)', async () => {
    renderDrawer()

    await waitFor(() => expect(getDropdownSendButton()).toBeTruthy())
    const sendBtn = getDropdownSendButton()
    if (!sendBtn) throw new Error('Send button not found')
    await userEvent.click(sendBtn)
    await userEvent.click(await screen.findByText('Швидке створення'))

    await waitFor(() => {
      expect(screen.getByTestId('add-payment-modal')).toBeInTheDocument()
    })

    expect(lastPaymentData?.type).toBe(Operations.Credit) // see note below
  })
})
describe('saveAccountToCompany after successful payment creation', () => {
  it('calls editRealEstate with account when company was manually selected and success=true', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: undefined })] },
    })
    renderDrawer(
      makeTransaction({ AUT_CNTR_ACC: 'UA803220010000026001350058717' })
    )

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByText('ТОВ Тест'))
    await userEvent.click(screen.getByRole('button', { name: /Send/i }))
    await userEvent.click(await screen.findByText('Confirm'))

    await waitFor(() => {
      expect(mockEditRealEstate).toHaveBeenCalledWith({
        _id: 'company_001',
        account: 'UA803220010000026001350058717',
      })
    })
  })

  it('does NOT call editRealEstate when company was auto-matched by account (already saved)', async () => {
    renderDrawer()

    await waitFor(() => expect(getDropdownSendButton()).toBeTruthy())

    const sendBtn = getDropdownSendButton()
    if (!sendBtn) throw new Error('Send button not found')
    await userEvent.click(sendBtn)
    await userEvent.click(await screen.findByText('Швидке створення'))
    await userEvent.click(await screen.findByText('Confirm'))

    await waitFor(() => {
      expect(mockEditRealEstate).not.toHaveBeenCalled()
    })
  })

  it('does NOT call editRealEstate when modal closes with success=false', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: undefined })] },
    })
    renderDrawer()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByText('ТОВ Тест'))
    await userEvent.click(screen.getByRole('button', { name: /Send/i }))
    await userEvent.click(await screen.findByText('Cancel'))

    await waitFor(() => {
      expect(mockEditRealEstate).not.toHaveBeenCalled()
    })
  })

  it('does NOT call editRealEstate for transit account even when manually selected', async () => {
    mockUseGetAllRealEstateQuery.mockReturnValue({
      data: { data: [makeCompany({ account: undefined })] },
    })
    renderDrawer(
      makeTransaction({
        AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
        AUT_CNTR_ACC: 'UA300000000000000000000000002',
      })
    )

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByText('ТОВ Тест'))
    await userEvent.click(screen.getByRole('button', { name: /Send/i }))
    await userEvent.click(await screen.findByText('Confirm'))

    await waitFor(() => {
      expect(mockEditRealEstate).not.toHaveBeenCalled()
    })
  })
})

describe('refetchTransactions', () => {
  it('is called when modal closes with success=true', async () => {
    const refetchTransactions = jest.fn()
    render(
      <TransactionDrawer
        transaction={makeTransaction()}
        domain={makeDomain() as any}
        refetchTransactions={refetchTransactions}
      />
    )

    await waitFor(() => expect(getDropdownSendButton()).toBeTruthy())
    const sendBtn = getDropdownSendButton()
    if (!sendBtn) throw new Error('Send button not found')
    await userEvent.click(sendBtn)
    await userEvent.click(await screen.findByText('Швидке створення'))
    await userEvent.click(await screen.findByText('Confirm'))

    await waitFor(() => {
      expect(refetchTransactions).toHaveBeenCalledTimes(1)
    })
  })

  it('is NOT called when modal closes with success=false', async () => {
    const refetchTransactions = jest.fn()
    render(
      <TransactionDrawer
        transaction={makeTransaction()}
        domain={makeDomain() as any}
        refetchTransactions={refetchTransactions}
      />
    )

    await waitFor(() => expect(getDropdownSendButton()).toBeTruthy())
    const sendBtn = getDropdownSendButton()
    if (!sendBtn) throw new Error('Send button not found')
    await userEvent.click(sendBtn)
    await userEvent.click(await screen.findByText('Швидке створення'))
    await userEvent.click(await screen.findByText('Cancel'))

    await waitFor(() => {
      expect(refetchTransactions).not.toHaveBeenCalled()
    })
  })
})
