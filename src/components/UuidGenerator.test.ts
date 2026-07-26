import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UuidGenerator from './UuidGenerator.vue'

describe('UuidGenerator', () => {
  it('renders the title', () => {
    const wrapper = mount(UuidGenerator)
    expect(wrapper.text()).toContain('UUID')
  })

  it('has a generate button', () => {
    const wrapper = mount(UuidGenerator)
    const btn = wrapper.find('button')
    expect(btn.exists()).toBe(true)
  })

  it('renders with count select', () => {
    const wrapper = mount(UuidGenerator)
    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)
  })
})
