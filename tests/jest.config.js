/** @type {import('jest').Config} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/tests/coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  testEnvironment: 'node',
  testTimeout: 10000,
  verbose: true,
  modulePaths: ['<rootDir>/src'],
  moduleDirectories: ['node_modules', '<rootDir>/src/node_modules'],
};
