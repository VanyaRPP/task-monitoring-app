import { expect } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
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
  default: ({ closeModal }: { closeModal: (success?: boolean) => void }) => (
    <div data-testid="add-payment-modal">
      <button onClick={() => closeModal(true)}>modal saved</button>
      <button onClick={() => closeModal()}>modal cancelled</button>
    </div>
  ),
}))

import DashboardLanding from '@components/Pages/DashboardLanding'

const CTA_BUTTON = /створити рахунок/i

describe('<DashboardLanding />', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockPush.mockResolvedValue(true)
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

  it('takes the user to the payments list after the invoice is saved', async () => {
    const user = userEvent.setup()
    render(<DashboardLanding />)
    await user.click(screen.getByRole('button', { name: CTA_BUTTON }))

    await user.click(screen.getByRole('button', { name: 'modal saved' }))

    expect(screen.queryByTestId('add-payment-modal')).not.toBeInTheDocument()
    expect(mockPush).toHaveBeenCalledWith('/payment')
    // Reloading before the navigation settles would reload the landing page.
    await waitFor(() => expect(mockReload).toHaveBeenCalledTimes(1))
    expect(mockPush.mock.invocationCallOrder[0]).toBeLessThan(
      mockReload.mock.invocationCallOrder[0]
    )
  })

  it('does not reload the page until the navigation has finished', async () => {
    let finishNavigation: (value: boolean) => void = () => undefined
    mockPush.mockReturnValue(
      new Promise<boolean>((resolve) => {
        finishNavigation = resolve
      })
    )
    const user = userEvent.setup()
    render(<DashboardLanding />)
    await user.click(screen.getByRole('button', { name: CTA_BUTTON }))

    await user.click(screen.getByRole('button', { name: 'modal saved' }))
    expect(mockReload).not.toHaveBeenCalled()

    finishNavigation(true)
    await waitFor(() => expect(mockReload).toHaveBeenCalledTimes(1))
  })

  it('just closes the modal when the user cancels: no navigation, no reload', async () => {
    const user = userEvent.setup()
    render(<DashboardLanding />)
    await user.click(screen.getByRole('button', { name: CTA_BUTTON }))

    await user.click(screen.getByRole('button', { name: 'modal cancelled' }))

    expect(screen.queryByTestId('add-payment-modal')).not.toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockReload).not.toHaveBeenCalled()
  })
})
