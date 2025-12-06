import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/test/**',
        'src/schema/**', // Schema definitions
        'src/migrations/**', // Migrations
        'src/seed/**', // Seed scripts
        'src/seed.ts', // Seed entry
        'src/migrate.ts', // Migration runner
        'src/fix-rls.ts', // RLS fix script
        'src/test-rls.ts', // RLS test script
        'src/index.ts', // Re-exports
        'src/types/index.ts', // Type re-exports
      ],
      thresholds: {
        branches: 40,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },
  },
});

