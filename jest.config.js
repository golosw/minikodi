module.exports = {
  preset: 'jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/backend/**/*.js',
    'main.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ]
};
