import { expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockPush = jest.fn()
const mockReload = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, reload: mockReload }),
}))

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) =>
    selector({ sidebar: { collapsed: false, forcedOpenKeys: [] } })
  ),
  useDispatch: () => jest.fn(),
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: () => ({ data: { roles: [] } }),
}))

jest.mock('@components/DashboardPage/DashboardTour', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@components/ScrollFactoryAnimation', () => ({
  __esModule: true,
  default: ({ action }: { action?: React.ReactNode }) => <div>{action}</div>,
}))
jest.mock('@components/Layouts/Header', () => ({
  Header: () => null,
}))
jest.mock('@components/Layouts/Footer', () => ({
  Footer: () => null,
}))
jest.mock('@components/AddPaymentModal', () => ({
  __esModule: true,
  default: () => <div data-testid="add-payment-modal" />,
}))

import DashboardLanding from '@components/Pages/DashboardLanding'

const CTA_BUTTON = /створити рахунок/i

describe('<DashboardLanding />', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockReload.mockClear()
  })

  it('does not auto-open the invoice modal on render', () => {
    render(<DashboardLanding />)

    expect(screen.queryByTestId('add-payment-modal')).not.toBeInTheDocument()
  })

  it('always shows the create-invoice button', () => {
    render(<DashboardLanding />)

    expect(screen.getByRole('button', { name: CTA_BUTTON })).toBeInTheDocument()
  })

  it('opens the invoice creation modal only after the button is clicked', async () => {
    const user = userEvent.setup()
    render(<DashboardLanding />)

    expect(screen.queryByTestId('add-payment-modal')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: CTA_BUTTON }))

    expect(screen.getByTestId('add-payment-modal')).toBeInTheDocument()
  })
})
