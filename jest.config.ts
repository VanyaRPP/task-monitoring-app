module.exports = {
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/'], // Ignore the node_modules directory
  transform: {
    '^.+\\.(ts|tsx)$': 'esbuild-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@pages/(.*)$': '<rootDir>/pages/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'], //  file extensions
}
export {}
