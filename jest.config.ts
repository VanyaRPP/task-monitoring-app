module.exports = {
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'], // Ignore the node_modules directory
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@pages/(.*)$': '<rootDir>/pages/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
  },
  moduleFileExtensions: ['ts', 'js'], //  file extensions
}
export {}