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
      ],
      thresholds: {
        branches: 75,
        functions: 80,
        lines: 85,
        statements: 85,
      },
    },
  },
});

