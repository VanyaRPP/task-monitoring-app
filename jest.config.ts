import type { Config } from 'jest'
import { pathsToModuleNameMapper } from 'ts-jest'
import { compilerOptions } from './tsconfig.json'

const config: Config = {
  preset: 'ts-jest',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  testEnvironment: 'jsdom',

  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },

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
    // The `node` export condition above (needed for bson 7) sends the root
    // `@ant-design/icons` import to `exports["."].node`, which only has an
    // `import` (ESM) target, so Jest's CJS resolver finds nothing. Point it at
    // the CJS build directly - an absolute path, so `exports` is not consulted.
    '^@ant-design/icons$':
      '<rootDir>/node_modules/@ant-design/icons/lib/index.js',
  },

  moduleFileExtensions: ['ts', 'tsx', 'js'],
}
export default config
