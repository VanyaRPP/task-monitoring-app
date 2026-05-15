import { render } from '@testing-library/react'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { useTranslation } from 'next-i18next'
import BankTransactions from './index'
import { paymentApi } from '@common/api/paymentApi/payment.api'
import { useDomainTabs } from '../ProfiitPage/hook/useDomainTabs'

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

jest.mock('@modules/store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}))

jest.mock('../ProfiitPage/hook/useDomainTabs', () => ({
  useDomainTabs: jest.fn(),
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
}))

jest.mock('./components/DomainBankTab/DomainBankTab', () => {
  const MockDomainBankTab = () => <div data-testid="domain-bank-tab" />
  MockDomainBankTab.displayName = 'DomainBankTab'
  return MockDomainBankTab
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

describe('BankTransactions Sync Logic', () => {
  let mockDispatch: jest.Mock

  beforeEach(() => {
    mockDispatch = jest.fn()
    ;(useAppDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch)
    ;(useAppSelector as unknown as jest.Mock).mockReturnValue('some-domain-id')
    ;(useDomainTabs as unknown as jest.Mock).mockReturnValue({
      tabList: [{ key: '1', label: 'Domain 1' }],
      isLoading: false,
      isError: false,
    })

    jest.clearAllMocks()
  })

  it('should invalidate "Payment" tags when "PAYMENT_CREATED" signal is received', () => {
    render(<BankTransactions />)

    if (channelInstance && channelInstance.onmessage) {
      channelInstance.onmessage({ data: 'PAYMENT_CREATED' })
    }

    expect(mockDispatch).toHaveBeenCalledWith(
      paymentApi.util.invalidateTags(['Payment'])
    )
  })

  it('should properly close the broadcast channel when the component unmounts', () => {
    const { unmount } = render(<BankTransactions />)

    const closeSpy = channelInstance.close
    unmount()

    expect(closeSpy).toHaveBeenCalled()
  })
})
