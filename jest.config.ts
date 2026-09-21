import type { Config } from 'jest'
import { pathsToModuleNameMapper } from 'ts-jest'
import { compilerOptions } from './tsconfig.json'

const config: Config = {
  preset: 'ts-jest',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  testEnvironment: 'jsdom',

  testTimeout: 15000,

  collectCoverageFrom: [
    'utils/**/*.{ts,tsx}',
    'common/services/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
    '!**/tests/**',
    '!**/__mocks__/**',
    '!utils/config.ts',
    '!utils/inflicion.tsx',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/.next/'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'text', 'html', 'lcov'],

  coverageThreshold: {
    global: {
      statements: 80,
      branches: 68,
      functions: 75,
      lines: 80,
    },
  },

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },

  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/',
    }),
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
    // @ant-design/icons ships CJS that hard-requires the ESM build
    // (`require('@ant-design/colors/es/generate')`). Bundlers cope; Jest's CJS
    // runtime throws "Cannot use import statement outside a module". Point the
    // `es/` subpath at the CJS `lib/` twin — same code, same package version.
    '^@ant-design/colors/es/(.*)$': '@ant-design/colors/lib/$1',
  },

  moduleFileExtensions: ['ts', 'tsx', 'js'],
}
export default config
