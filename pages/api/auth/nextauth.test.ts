import { expect } from '@jest/globals'

const mockEnv = { isProd: false }

jest.mock('@utils/env', () => ({
  get isProd() {
    return mockEnv.isProd
  },
}))

jest.mock('@common/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({}),
}))

jest.mock('@next-auth/mongodb-adapter', () => ({
  MongoDBAdapter: jest.fn(() => ({})),
}))

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => () => null),
}))

jest.mock('@modules/models/User', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), create: jest.fn() },
}))

jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }))

type AuthModule = typeof import('@pages/api/auth/[...nextauth]')

const ENV_KEYS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_ID',
  'GITHUB_SECRET',
] as const

type EnvKey = (typeof ENV_KEYS)[number]

function loadAuthWith(overrides: {
  isProd: boolean
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GITHUB_ID?: string
  GITHUB_SECRET?: string
}): AuthModule {
  const original = {} as Record<EnvKey, string | undefined>
  for (const key of ENV_KEYS) {
    original[key] = process.env[key]
    const next = overrides[key]
    if (next === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = next
    }
  }

  mockEnv.isProd = overrides.isProd

  let loaded: AuthModule | undefined
  jest.isolateModules(() => {
    loaded = require('@pages/api/auth/[...nextauth]') as AuthModule
  })

  for (const key of ENV_KEYS) {
    if (original[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = original[key] as string
    }
  }

  return loaded as AuthModule
}

function providerIds(authOptions: AuthModule['authOptions']): string[] {
  return (authOptions.providers ?? []).map((p) => (p as { id: string }).id)
}

describe('[...nextauth] providers wiring', () => {
  beforeEach(() => {
    mockEnv.isProd = false
  })

  it('always registers Credentials provider', () => {
    const { authOptions } = loadAuthWith({ isProd: false })
    expect(providerIds(authOptions)).toContain('credentials')
  })

  describe('Google provider', () => {
    it('is registered when both creds are present (non-prod)', () => {
      const { authOptions } = loadAuthWith({
        isProd: false,
        GOOGLE_CLIENT_ID: 'g-id',
        GOOGLE_CLIENT_SECRET: 'g-secret',
      })
      expect(providerIds(authOptions)).toContain('google')
    })

    it('is registered on prod when both creds are present', () => {
      const { authOptions } = loadAuthWith({
        isProd: true,
        GOOGLE_CLIENT_ID: 'g-id',
        GOOGLE_CLIENT_SECRET: 'g-secret',
      })
      expect(providerIds(authOptions)).toContain('google')
    })

    it('is NOT registered when client id is missing', () => {
      const { authOptions } = loadAuthWith({
        isProd: false,
        GOOGLE_CLIENT_SECRET: 'g-secret',
      })
      expect(providerIds(authOptions)).not.toContain('google')
    })

    it('is NOT registered when client secret is missing', () => {
      const { authOptions } = loadAuthWith({
        isProd: false,
        GOOGLE_CLIENT_ID: 'g-id',
      })
      expect(providerIds(authOptions)).not.toContain('google')
    })
  })

  describe('GitHub provider', () => {
    it('is registered on non-prod when both creds are present', () => {
      const { authOptions } = loadAuthWith({
        isProd: false,
        GITHUB_ID: 'gh-id',
        GITHUB_SECRET: 'gh-secret',
      })
      expect(providerIds(authOptions)).toContain('github')
    })

    it('is NOT registered on prod, even when both creds are set', () => {
      const { authOptions } = loadAuthWith({
        isProd: true,
        GITHUB_ID: 'gh-id',
        GITHUB_SECRET: 'gh-secret',
      })
      expect(providerIds(authOptions)).not.toContain('github')
    })

    it('is NOT registered when creds are missing, regardless of env', () => {
      const dev = loadAuthWith({ isProd: false })
      expect(providerIds(dev.authOptions)).not.toContain('github')

      const prod = loadAuthWith({ isProd: true })
      expect(providerIds(prod.authOptions)).not.toContain('github')
    })
  })

  describe('the prod scenario the user reported', () => {
    it('with both Google and GitHub creds on prod: only credentials + google', () => {
      const { authOptions } = loadAuthWith({
        isProd: true,
        GOOGLE_CLIENT_ID: 'g-id',
        GOOGLE_CLIENT_SECRET: 'g-secret',
        GITHUB_ID: 'gh-id',
        GITHUB_SECRET: 'gh-secret',
      })
      const ids = providerIds(authOptions)
      expect(ids).toEqual(expect.arrayContaining(['credentials', 'google']))
      expect(ids).not.toContain('github')
    })
  })
})
