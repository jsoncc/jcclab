import { vi } from 'vitest'

// mock Vite's import.meta.glob so tests don't need actual file scanning
vi.mock('../composables/useBlogData', async () => {
  const actual = await vi.importActual('../composables/useBlogData')
  return actual
})
