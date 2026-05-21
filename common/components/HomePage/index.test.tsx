import { expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppRoutes } from '@utils/constants'

const mockPush = jest.fn()
const mockSignIn = jest.fn()
let mockIsProd = false

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('next-auth/react', () => ({
  signIn: mockSignIn,
}))

jest.mock('@utils/env', () => ({
  get isProd() {
    return mockIsProd
  },
}))

jest.mock('@components/ScrollFactoryAnimation', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/UI/LottieAnimation', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/UI/SplashCursor', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/CardSwapper', () => ({
  __esModule: true,
  default: () => null,
}))

import HomePage from '@components/HomePage'

describe('<HomePage />', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockSignIn.mockClear()
    mockIsProd = false
  })

  it('on non-prod, "Увійти" navigates to the sign-in page', async () => {
    const user = userEvent.setup()
    render(<HomePage />)

    await user.click(screen.getByRole('button', { name: /увійти/i }))

    expect(mockPush).toHaveBeenCalledWith(AppRoutes.AUTH_SIGN_IN)
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('on prod, "Увійти" triggers Google sign-in directly', async () => {
    mockIsProd = true
    const user = userEvent.setup()
    render(<HomePage />)

    await user.click(screen.getByRole('button', { name: /увійти/i }))

    expect(mockSignIn).toHaveBeenCalledWith('google')
    expect(mockSignIn).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('contact button always uses router.push, regardless of env', async () => {
    mockIsProd = true
    const user = userEvent.setup()
    render(<HomePage />)

    await user.click(screen.getByRole('button', { name: /зв.+нами/i }))

    expect(mockPush).toHaveBeenCalledWith(AppRoutes.CONTACTS)
    expect(mockSignIn).not.toHaveBeenCalled()
  })
})
