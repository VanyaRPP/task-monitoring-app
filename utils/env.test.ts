import { expect } from '@jest/globals'

type EnvModule = typeof import('@utils/env')

function loadEnvWith(overrides: {
  NEXT_PUBLIC_APP_ENV?: string | undefined
  NODE_ENV?: string
}): EnvModule {
  const originalApp = process.env.NEXT_PUBLIC_APP_ENV
  const originalNode = process.env.NODE_ENV
  const envBag = process.env as Record<string, string | undefined>

  if ('NEXT_PUBLIC_APP_ENV' in overrides) {
    if (overrides.NEXT_PUBLIC_APP_ENV === undefined) {
      delete process.env.NEXT_PUBLIC_APP_ENV
    } else {
      process.env.NEXT_PUBLIC_APP_ENV = overrides.NEXT_PUBLIC_APP_ENV
    }
  }
  if (overrides.NODE_ENV !== undefined) {
    envBag.NODE_ENV = overrides.NODE_ENV
  }

  let loaded: EnvModule | undefined
  jest.isolateModules(() => {
    loaded = require('@utils/env') as EnvModule
  })

  if (originalApp === undefined) {
    delete process.env.NEXT_PUBLIC_APP_ENV
  } else {
    process.env.NEXT_PUBLIC_APP_ENV = originalApp
  }
  envBag.NODE_ENV = originalNode

  return loaded as EnvModule
}

describe('@utils/env', () => {
  describe('explicit NEXT_PUBLIC_APP_ENV is honored', () => {
    it('resolves development', () => {
      const { appEnv, isDev, isStaging, isProd } = loadEnvWith({
        NEXT_PUBLIC_APP_ENV: 'development',
        NODE_ENV: 'production',
      })
      expect(appEnv).toBe('development')
      expect(isDev).toBe(true)
      expect(isStaging).toBe(false)
      expect(isProd).toBe(false)
    })

    it('resolves staging', () => {
      const { appEnv, isDev, isStaging, isProd } = loadEnvWith({
        NEXT_PUBLIC_APP_ENV: 'staging',
        NODE_ENV: 'production',
      })
      expect(appEnv).toBe('staging')
      expect(isDev).toBe(false)
      expect(isStaging).toBe(true)
      expect(isProd).toBe(false)
    })

    it('resolves production', () => {
      const { appEnv, isDev, isStaging, isProd } = loadEnvWith({
        NEXT_PUBLIC_APP_ENV: 'production',
        NODE_ENV: 'development',
      })
      expect(appEnv).toBe('production')
      expect(isDev).toBe(false)
      expect(isStaging).toBe(false)
      expect(isProd).toBe(true)
    })

    it('overrides NODE_ENV when both are set', () => {
      const { appEnv } = loadEnvWith({
        NEXT_PUBLIC_APP_ENV: 'staging',
        NODE_ENV: 'production',
      })
      expect(appEnv).toBe('staging')
    })
  })

  describe('fallback from NODE_ENV when NEXT_PUBLIC_APP_ENV is missing', () => {
    it('maps NODE_ENV=production to production', () => {
      const { appEnv, isProd } = loadEnvWith({
        NEXT_PUBLIC_APP_ENV: undefined,
        NODE_ENV: 'production',
      })
      expect(appEnv).toBe('production')
      expect(isProd).toBe(true)
    })

    it('maps NODE_ENV=development to development', () => {
      const { appEnv, isDev } = loadEnvWith({
        NEXT_PUBLIC_APP_ENV: undefined,
        NODE_ENV: 'development',
      })
      expect(appEnv).toBe('development')
      expect(isDev).toBe(true)
    })

    it('maps NODE_ENV=test to development', () => {
      const { appEnv, isDev } = loadEnvWith({
        NEXT_PUBLIC_APP_ENV: undefined,
        NODE_ENV: 'test',
      })
      expect(appEnv).toBe('development')
      expect(isDev).toBe(true)
    })

    it('falls back to development when NODE_ENV is also missing', () => {
      const { appEnv, isDev } = loadEnvWith({
        NEXT_PUBLIC_APP_ENV: undefined,
        NODE_ENV: '',
      })
      expect(appEnv).toBe('development')
      expect(isDev).toBe(true)
    })
  })

  describe('invalid NEXT_PUBLIC_APP_ENV triggers fallback', () => {
    it('rejects a typo (developmant) and falls back via NODE_ENV', () => {
      const { appEnv } = loadEnvWith({
        NEXT_PUBLIC_APP_ENV: 'developmant',
        NODE_ENV: 'production',
      })
      expect(appEnv).toBe('production')
    })

    it('rejects empty string and falls back via NODE_ENV', () => {
      const { appEnv } = loadEnvWith({
        NEXT_PUBLIC_APP_ENV: '',
        NODE_ENV: 'production',
      })
      expect(appEnv).toBe('production')
    })

    it('rejects unrelated value (prod) and falls back via NODE_ENV', () => {
      const { appEnv } = loadEnvWith({
        NEXT_PUBLIC_APP_ENV: 'prod',
        NODE_ENV: 'development',
      })
      expect(appEnv).toBe('development')
    })
  })

  describe('boolean flags are mutually exclusive', () => {
    it.each([
      ['development', { isDev: true, isStaging: false, isProd: false }],
      ['staging', { isDev: false, isStaging: true, isProd: false }],
      ['production', { isDev: false, isStaging: false, isProd: true }],
    ] as const)('for %s exactly one flag is true', (env, expected) => {
      const { isDev, isStaging, isProd } = loadEnvWith({
        NEXT_PUBLIC_APP_ENV: env,
      })
      expect({ isDev, isStaging, isProd }).toEqual(expected)
    })
  })
})
