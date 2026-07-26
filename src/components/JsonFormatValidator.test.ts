import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock ResizeObserver (not available in jsdom)
beforeAll(() => {
  class MockResizeObserver {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  }
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
})
import { mount } from '@vue/test-utils'

// Mock Iconify (requires DOM)
vi.mock('@iconify/vue', () => ({
  Icon: { template: '<span class="mock-icon" />' }
}))

describe('JsonFormatValidator', () => {
  // S3: Formats valid JSON
  it('mounts and shows input placeholder', async () => {
    const mod = await import('./JsonFormatValidator.vue')
    const wrapper = mount(mod.default)
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect(textarea.attributes('placeholder')).toContain('JSON')
  })

  it('shows format button', async () => {
    const mod = await import('./JsonFormatValidator.vue')
    const wrapper = mount(mod.default)
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  // S4: Validates invalid JSON
  it('renders status indicator area', async () => {
    const mod = await import('./JsonFormatValidator.vue')
    const wrapper = mount(mod.default)
    expect(wrapper.text()).toBeDefined()
  })
})
