/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  displayName: 'integration',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['**/test/integration/**/*.integration.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          strict: false,
          strictNullChecks: false,
          noImplicitAny: false,
          types: ['jest', 'node'],
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@forgestack/db$': '<rootDir>/../../packages/db/src/index.ts',
    '^@forgestack/shared/test-utils$': '<rootDir>/../../packages/shared/src/test-utils/index.ts',
    '^@forgestack/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testTimeout: 30000,
  transformIgnorePatterns: ['node_modules/(?!(@forgestack)/)'],
  // Run tests serially to avoid database conflicts
  maxWorkers: 1,
  // Verbose output for debugging
  verbose: true,
  // Force Jest to exit after tests complete (safety net for open handles)
  forceExit: true,
  // Collect coverage from integration tests
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/app.module.ts',
    '!src/**/*.dto.ts',
    '!src/config/**',
  ],
  coverageDirectory: './coverage/integration',
};

