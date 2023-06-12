import { model } from "mongoose";

module.exports = {
    testEnvironment: 'node',
    transform: {},
    moduleFileExtensions: ['js', 'json', 'ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },
    transformIgnorePatterns: ['<rootDir>/node_modules/'],
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json'
        }
    },
    testMatch: [
        '<rootDir>/tests/**/*.spec.ts'
    ],
    preset: 'ts-jest'
};
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
