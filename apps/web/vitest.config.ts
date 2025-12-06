import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.tsx'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'src/test/**',
        'src/app/**',
        'src/lib/**',
        'src/hooks/**',
        'src/types/**',
        'src/components/providers/**',
        'src/components/layout/**',
        // Complex Radix UI components that require E2E testing
        'src/components/members/member-list.tsx',
        'src/components/members/pending-invitations.tsx',
        'src/components/members/invite-member-dialog.tsx',
      ],
      thresholds: {
        branches: 70,
        functions: 75,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});

