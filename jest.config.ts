module.exports = {
  roots: ['<rootDir>/common/assets/features'], 
  testMatch: ['**/*.test.ts'], 
  testPathIgnorePatterns: ['/node_modules/'], // Ignore the node_modules directory
  transform: {
    '^.+\\.ts$': 'ts-jest', 
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', 
  },
  moduleFileExtensions: ['ts', 'js'], //  file extensions
};
export{};
