import { expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'

const mockEnv = { isDev: false, isStaging: false }
let mockFeatureFlag = false

jest.mock('@utils/env', () => ({
  get isDev() {
    return mockEnv.isDev
  },
  get isStaging() {
    return mockEnv.isStaging
  },
}))

jest.mock('@modules/hooks/useFeatureFlag', () => ({
  useFeatureFlag: () => mockFeatureFlag,
}))

jest.mock('@components/UI/LottieAnimation', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@components/UI/GlassUI', () => ({
  GlassCard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="glass-card">{children}</div>
  ),
}))

jest.mock('@components/Forms/AddSingInForm', () => ({
  __esModule: true,
  default: () => <div data-testid="signin-form" />,
}))

jest.mock('@components/UI/Buttons', () => ({
  SignInButton: ({ provider }: { provider: { id: string; name: string } }) => (
    <button data-testid={`oauth-${provider.id}`}>{provider.name}</button>
  ),
}))

import SignInPage from '@components/Pages/SignInPage'

type FakeProvider = {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

function makeProviders(...ids: string[]): Record<string, FakeProvider> {
  const map: Record<string, FakeProvider> = {}
  for (const id of ids) {
    map[id] = {
      id,
      name: id[0].toUpperCase() + id.slice(1),
      type: id === 'credentials' ? 'credentials' : 'oauth',
      signinUrl: `/api/auth/signin/${id}`,
      callbackUrl: `/api/auth/callback/${id}`,
    }
  }
  return map
}

describe('<SignInPage />', () => {
  beforeEach(() => {
    mockEnv.isDev = false
    mockEnv.isStaging = false
    mockFeatureFlag = false
  })

  describe('credentials form visibility', () => {
    it('shows form on dev when credentials provider is available', () => {
      mockEnv.isDev = true
      render(
        <SignInPage
          providers={makeProviders('credentials', 'github') as any}
          csrfToken="token"
        />
      )
      expect(screen.getByTestId('signin-form')).toBeInTheDocument()
    })

    it('shows form on staging when credentials provider is available', () => {
      mockEnv.isStaging = true
      render(
        <SignInPage
          providers={makeProviders('credentials', 'google') as any}
          csrfToken="token"
        />
      )
      expect(screen.getByTestId('signin-form')).toBeInTheDocument()
    })

    it('shows form on prod when feature flag is on', () => {
      mockFeatureFlag = true
      render(
        <SignInPage
          providers={makeProviders('credentials', 'google') as any}
          csrfToken="token"
        />
      )
      expect(screen.getByTestId('signin-form')).toBeInTheDocument()
    })

    it('hides form on prod when feature flag is off', () => {
      render(
        <SignInPage
          providers={makeProviders('credentials', 'google') as any}
          csrfToken="token"
        />
      )
      expect(screen.queryByTestId('signin-form')).not.toBeInTheDocument()
    })

    it('hides form when credentials provider is missing, even on dev', () => {
      mockEnv.isDev = true
      render(
        <SignInPage
          providers={makeProviders('google') as any}
          csrfToken="token"
        />
      )
      expect(screen.queryByTestId('signin-form')).not.toBeInTheDocument()
    })
  })

  describe('OAuth providers rendering', () => {
    it('renders all non-credentials providers received from the backend', () => {
      render(
        <SignInPage
          providers={makeProviders('credentials', 'google', 'github') as any}
          csrfToken="token"
        />
      )
      expect(screen.getByTestId('oauth-google')).toBeInTheDocument()
      expect(screen.getByTestId('oauth-github')).toBeInTheDocument()
      expect(screen.queryByTestId('oauth-credentials')).not.toBeInTheDocument()
    })

    it('renders nothing OAuth-wise when providers is null', () => {
      render(<SignInPage providers={null} csrfToken="token" />)
      expect(screen.queryByTestId(/^oauth-/)).not.toBeInTheDocument()
      expect(screen.queryByTestId('signin-form')).not.toBeInTheDocument()
    })

    it('only renders the providers the backend supplied (prod = Google only)', () => {
      render(
        <SignInPage
          providers={makeProviders('google') as any}
          csrfToken="token"
        />
      )
      expect(screen.getByTestId('oauth-google')).toBeInTheDocument()
      expect(screen.queryByTestId('oauth-github')).not.toBeInTheDocument()
    })
  })
})
