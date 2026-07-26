import { vi } from 'vitest'

// Mock Vite's import.meta.glob to return empty objects
vi.stubGlobal('import', {
  meta: {
    glob: () => ({})
  }
})
