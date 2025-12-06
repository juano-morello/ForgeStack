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
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/app.module.ts',
    '!**/index.ts',
    '!**/*.dto.ts',
    '!**/config/**',
  ],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 55,
      lines: 60,
      statements: 60,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@forgestack/db$': '<rootDir>/../../../packages/db/src/index.ts',
    '^@forgestack/shared/test-utils$': '<rootDir>/../../../packages/shared/src/test-utils/index.ts',
    '^@forgestack/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
    // Handle .js extensions in ESM imports (TypeScript compiles to .js but source is .ts)
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

