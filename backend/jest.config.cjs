module.exports = {
  testEnvironment: 'node',
  moduleFileTypes: ['js', 'json', 'node'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/middlewares/**'
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  transform: {}
};
