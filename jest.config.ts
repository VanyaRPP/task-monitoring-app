import type { Config } from 'jest'
import { pathsToModuleNameMapper } from 'ts-jest'
import { compilerOptions } from './tsconfig.json'

const config: Config = {
  preset: 'ts-jest',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  testPathIgnorePatterns: [
    "/node_modules/",
    '/.next/',
    '/.tsx?$'
  ],  
  testEnvironment: 'jsdom',

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
  },

  moduleFileExtensions: ['ts', 'tsx', 'js'],
}
export default config
