global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
) as jest.Mock

import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import PaymentsChart from '../index'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useRouter } from 'next/router'
import React from 'react'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@common/api/paymentApi/payment.api')
jest.mock('@common/api/realestateApi/realestate.api')
jest.mock('@common/api/userApi/user.api')

jest.mock('react-redux', () => ({
  useSelector: jest
    .fn()
    .mockImplementation((selector) => selector({ theme: { theme: 'light' } })),
  useDispatch: () => jest.fn(),
  useStore: jest.fn(() => ({
    getState: () => ({ theme: { theme: 'light' } }),
    subscribe: jest.fn(),
    dispatch: jest.fn(),
  })),
}))

jest.mock('@common/modules/hooks/useTheme', () => ({
  __esModule: true,
  default: () => ['light', jest.fn()],
}))

jest.mock('@ant-design/plots', () => ({
  Line: () => <div data-testid="mock-line-chart" />,
}))

describe('PaymentsChart Component Integration', () => {
  const mockUser = { roles: ['User'], email: 'anton@gmail.com' }
  const mockCompanies = {
    data: [{ _id: 'comp-123', companyName: 'Test Company' }],
  }

  const mockPaymentsResponse = {
    data: [
      {
        _id: 'p1',
        amount: 1000,
        date: '2026-03-18',
        invoice: [],
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ pathname: '/' })
    ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({ data: mockUser })
    ;(useGetAllRealEstateQuery as jest.Mock).mockReturnValue({
      data: mockCompanies,
      isFetching: false,
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
  })

  it('should not skip API call when companyId is selected', async () => {
    const getAllPaymentsSpy = useGetAllPaymentsQuery as jest.Mock
    getAllPaymentsSpy.mockReturnValue({ data: { data: [] }, isFetching: false })

    render(<PaymentsChart />)

    await waitFor(() => {
      expect(getAllPaymentsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ companyIds: ['comp-123'] }),
        expect.objectContaining({ skip: false })
      )
    })
  })

  it('should render Line chart for regular User when payments data is present', async () => {
    ;(useGetAllPaymentsQuery as jest.Mock).mockReturnValue({
      data: mockPaymentsResponse,
      isFetching: false,
      isError: false,
    })

    render(<PaymentsChart />)

    await waitFor(() => {
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument()
    })
  })

  it('should show "Оберіть компанію" message when no companyId provided', async () => {
    ;(useGetAllRealEstateQuery as jest.Mock).mockReturnValue({
      data: { data: [] },
      isFetching: false,
    })
    ;(useGetAllPaymentsQuery as jest.Mock).mockReturnValue({
      data: { data: [] },
      isFetching: false,
    })

    render(<PaymentsChart />)

    await waitFor(() => {
      const elements = screen.getAllByText(/Оберіть компанію/i)
      expect(elements[0]).toBeInTheDocument()
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  it('should show loading state while fetching data', () => {
    ;(useGetAllPaymentsQuery as jest.Mock).mockReturnValue({
      data: { data: [] },
      isFetching: true,
    })

    render(<PaymentsChart />)
    expect(screen.getByText(/Завантаження.../i)).toBeInTheDocument()
  })
})
