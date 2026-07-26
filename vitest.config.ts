import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  define: {
    'import.meta.glob': 'undefined'
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    server: {
      deps: {
        inline: ['@iconify/vue', '@iconify-icons/mdi', '@iconify-icons/radix-icons']
      }
    }
  }
})
