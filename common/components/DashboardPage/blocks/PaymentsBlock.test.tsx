import { render } from '@testing-library/react'
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import PaymentsBlock from './payments'
import { paymentApi } from '@common/api/paymentApi/payment.api'
import { useGetDebtorsQuery } from '@common/api/debtorsApi/debtors.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(() => ({})),
}))

jest.mock('@common/api/paymentApi/payment.api', () => ({
  paymentApi: {
    util: {
      invalidateTags: jest.fn(),
    },
    injectEndpoints: jest.fn().mockReturnValue({
      enhanceEndpoints: jest.fn(),
      endpoints: {},
    }),
  },
  useGetAllPaymentsQuery: jest.fn(),
  useDeletePaymentMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useDeleteMultiplePaymentsMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useEditPaymentMutation: jest.fn(() => [jest.fn()]),
  useMarkPaymentPaidMutation: jest.fn(() => [jest.fn()]),
  useMarkPaymentsPaidBulkMutation: jest.fn(() => [jest.fn()]),
  useAddPaymentMutation: jest.fn(() => [jest.fn()]),
  useGetPaymentNumberQuery: jest.fn(() => ({ data: 1, refetch: jest.fn() })),
}))

jest.mock('@common/api/debtorsApi/debtors.api', () => ({
  useGetDebtorsQuery: jest.fn(),
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('@common/api/filterApi/filter.api', () => ({
  useGetDomainFiltersQuery: jest.fn(() => ({ data: [] })),
  useGetRealEstateFiltersQuery: jest.fn(() => ({ data: [] })),
  useGetAddressFiltersQuery: jest.fn(() => ({ data: [] })),
  useGetDateFiltersQuery: jest.fn(() => ({ data: [] })),
}))

jest.mock('@components/UI/TableCard', () => {
  const MockTableCard = ({ children }: any) => <div data-testid="table-card">{children}</div>
  MockTableCard.displayName = 'TableCard'
  return MockTableCard
})

jest.mock('@components/Tables/Payment/Table', () => {
  const MockTable = () => <div data-testid="payments-table" />
  MockTable.displayName = 'PaymentsTable'
  return MockTable
})

jest.mock('@components/Tables/Payment/Header', () => {
  const MockHeader = () => <div data-testid="payments-header" />
  MockHeader.displayName = 'PaymentsHeader'
  return MockHeader
})

jest.mock('@components/UI/ModalDelete', () => {
  const MockModalDelete = () => <div data-testid="modal-delete" />
  MockModalDelete.displayName = 'ModalDelete'
  return MockModalDelete
})

let channelInstance: any
global.BroadcastChannel = jest.fn().mockImplementation(() => {
  channelInstance = {
    postMessage: jest.fn(),
    close: jest.fn(),
    onmessage: null,
  }
  return channelInstance
}) as any

describe('PaymentsBlock Sync Logic', () => {
  let mockDispatch: jest.Mock

  beforeEach(() => {
    mockDispatch = jest.fn()
    ;(useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch)
    
    ;(useRouter as jest.Mock).mockReturnValue({
      pathname: '/',
      query: {},
      asPath: '/',
    })

    const defaultResponse = { data: [], isLoading: false, isError: false }
    ;(useGetDebtorsQuery as jest.Mock).mockReturnValue(defaultResponse)
    ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({ data: { roles: [] } })
    ;(useGetAllPaymentsQuery as jest.Mock).mockReturnValue(defaultResponse)

    jest.clearAllMocks()
  })

  it('should invalidate "Payment" tags when "PAYMENT_CREATED" message is received', () => {
    render(<PaymentsBlock />)

    if (channelInstance && channelInstance.onmessage) {
      channelInstance.onmessage({ data: 'PAYMENT_CREATED' })
    }

    expect(mockDispatch).toHaveBeenCalledWith(
      paymentApi.util.invalidateTags(['Payment'])
    )
  })

  it('should properly close the broadcast channel when the component unmounts', () => {
    const { unmount } = render(<PaymentsBlock />)
    const closeSpy = channelInstance.close
    unmount()
    expect(closeSpy).toHaveBeenCalled()
  })
})