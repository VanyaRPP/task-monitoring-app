import dotenv from 'dotenv'
import type { Config } from 'jest'

dotenv.config()

const config: Config = {
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@pages/(.*)$': '<rootDir>/pages/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
  },
  moduleFileExtensions: ['ts', 'js'],
}

export default config
