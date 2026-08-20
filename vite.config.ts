import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/open-fund-ledger/',
  build: {
    target: 'es2022',
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
