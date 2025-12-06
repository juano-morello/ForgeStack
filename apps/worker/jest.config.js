/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
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
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/index.ts',
    '!**/config.ts',
    '!**/queues.ts',
    '!**/worker.ts',
    '!**/telemetry/**',
    '!**/__tests__/**',
    '!**/test/**',
  ],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 70,
      lines: 75,
      statements: 75,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@forgestack/db$': '<rootDir>/../../../packages/db/src/index.ts',
    '^@forgestack/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
    // Handle .js extensions in ESM imports (TypeScript compiles to .js but source is .ts)
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: ['node_modules/(?!(@forgestack)/)'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 10000,
};

