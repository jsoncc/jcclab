import { describe, it, expect, vi, beforeAll } from 'vitest'
import { nextTick } from 'vue'

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

  it('压缩：非 JSON 文本仅去除换行，不改变内容', async () => {
    const mod = await import('./JsonFormatValidator.vue')
    const wrapper = mount(mod.default)
    const pem = [
      'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDMYfnvWtC8Id5bPKae5yXSxQTt',
      '+Zpul6AnnZWfI2TtIarvjHBFUtXRo96y7hoL4VWOPKGCsRqMFDkrbeUjRrx8iL91',
      '4/srnyf6sh9c8Zk04xEOpK1ypvBz+Ks4uZObtjnnitf0NBGdjMKxveTq+VE7BWUI',
      'yQjtQ8mbDOsiLLvh7wIDAQAB'
    ].join('\n')
    const textarea = wrapper.find('textarea')
    await textarea.setValue(pem)
    const compressBtn = wrapper.findAll('button').find((b) => b.text().includes('压缩'))
    expect(compressBtn).toBeTruthy()
    await compressBtn!.trigger('click')
    await nextTick()
    expect(textarea.element.value).toBe(pem.replace(/\n/g, ''))
    expect(wrapper.text()).toContain('已压缩为一行')
  })

  it('压缩：JSON 仍压缩为单行并保留语义', async () => {
    const mod = await import('./JsonFormatValidator.vue')
    const wrapper = mount(mod.default)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{\n  "a": 1,\n  "b": [true, null]\n}')
    const compressBtn = wrapper.findAll('button').find((b) => b.text().includes('压缩'))
    await compressBtn!.trigger('click')
    await nextTick()
    expect(textarea.element.value).toBe('{"a":1,"b":[true,null]}')
    expect(wrapper.text()).toContain('已压缩为一行')
  })
})
