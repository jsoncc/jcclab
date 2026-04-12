<template>
  <div class="uuid-tool">
    <div class="uuid-row">
      <label class="uuid-label">生成UUID的个数：</label>
      <div class="uuid-count">
        <select v-model="countSelection" class="uuid-select">
          <option v-for="n in countOptions" :key="n" :value="String(n)">{{ n }}个</option>
          <option value="custom">自定义…</option>
        </select>
        <input
          v-if="countSelection === 'custom'"
          v-model.number="customCount"
          class="uuid-input"
          type="number"
          inputmode="numeric"
          min="1"
          max="100"
          step="1"
          placeholder="1-100"
          @input="onCustomCountInput"
          @blur="normalizeCustomCount"
        />
        <span v-if="countSelection === 'custom' && countHint" class="uuid-hint">{{ countHint }}</span>
      </div>
    </div>

    <div class="uuid-row">
      <label class="uuid-label">UUID大小写：</label>
      <select v-model="casing" class="uuid-select">
        <option value="lower">uuid小写</option>
        <option value="upper">UUID大写</option>
      </select>
    </div>

    <div class="uuid-row">
      <label class="uuid-label">格式选项：</label>
      <label class="uuid-check">
        <input v-model="noHyphen" type="checkbox" />
        没有 "-"
      </label>
    </div>

    <div class="uuid-actions">
      <button type="button" class="uuid-btn primary" @click="generate">生成UUID</button>
      <button type="button" class="uuid-btn" :disabled="!resultText" @click="copyResult">复制结果</button>
      <button type="button" class="uuid-btn" :disabled="!resultText" @click="clear">清空</button>
      <span class="uuid-status" :class="{ ok: statusKind === 'ok', error: statusKind === 'error' }">
        {{ statusText }}
      </span>
    </div>

    <textarea
      class="uuid-result"
      :value="resultText"
      readonly
      spellcheck="false"
      placeholder="生成结果将显示在这里"
      rows="10"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 批量生成 UUID（crypto.randomUUID / 降级实现），支持个数、大小写、是否带连字符。
 */
import { computed, ref, watch } from 'vue'

const countOptions = [1, 5, 10, 20, 50, 100] as const
const countSelection = ref<string>('1')
const customCount = ref(1)
const countHint = ref('')
const casing = ref<'lower' | 'upper'>('lower')
const noHyphen = ref(false)
const resultText = ref('')
const statusKind = ref<'idle' | 'ok' | 'error'>('idle')
const statusText = ref('')

const effectiveCount = computed(() => {
  const raw = countSelection.value === 'custom' ? Number(customCount.value) : Number(countSelection.value)
  const n = Number.isFinite(raw) ? raw : 1
  return Math.min(100, Math.max(1, Math.trunc(n)))
})

watch([countSelection, customCount], () => {
  if (countSelection.value !== 'custom') {
    countHint.value = ''
    return
  }
  const n = Number(customCount.value)
  if (!Number.isFinite(n)) {
    countHint.value = '请输入 1-100'
    return
  }
  if (n > 100) {
    countHint.value = '最多 100 个（将按 100 生成）'
    return
  }
  if (n < 1) {
    countHint.value = '最少 1 个'
    return
  }
  countHint.value = ''
})

const onCustomCountInput = (e: Event) => {
  const v = Number((e.target as HTMLInputElement)?.value)
  if (!Number.isFinite(v)) {
    countHint.value = '请输入 1-100'
  } else if (v > 100) {
    countHint.value = '最多 100 个（将按 100 生成）'
  } else if (v < 1) {
    countHint.value = '最少 1 个'
  } else {
    countHint.value = ''
  }
}

const normalizeCustomCount = () => {
  const n = Number(customCount.value)
  if (!Number.isFinite(n)) {
    customCount.value = 1
    countHint.value = ''
    return
  }
  const clamped = Math.min(100, Math.max(1, Math.trunc(n)))
  customCount.value = clamped
  countHint.value = ''
}

const formatUuid = (value: string) => {
  const cased = casing.value === 'upper' ? String(value).toUpperCase() : String(value).toLowerCase()
  return noHyphen.value ? cased.replaceAll('-', '') : cased
}

/** 优先 randomUUID；无则 getRandomValues 拼出符合 v4 形态的串 */
const genUuid = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const copyTextToClipboard = async (text: string) => {
  const value = String(text ?? '')
  if (!value) return false

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return true
  }

  const ta = document.createElement('textarea')
  ta.value = value
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  ta.style.top = '0'
  document.body.appendChild(ta)
  ta.select()
  ta.setSelectionRange(0, ta.value.length)
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  return ok
}

const generate = () => {
  statusKind.value = 'idle'
  statusText.value = ''

  try {
    const list = Array.from({ length: effectiveCount.value }, () => formatUuid(genUuid()))
    resultText.value = list.join('\n')
    statusKind.value = 'ok'
    statusText.value = '已生成'
  } catch {
    resultText.value = ''
    statusKind.value = 'error'
    statusText.value = '生成失败'
  }
}

const copyResult = async () => {
  if (!resultText.value) return
  try {
    const ok = await copyTextToClipboard(resultText.value)
    if (!ok) throw new Error('copy_failed')
    statusKind.value = 'ok'
    statusText.value = '已复制'
  } catch {
    statusKind.value = 'error'
    statusText.value = '复制失败'
  }
}

const clear = () => {
  resultText.value = ''
  statusKind.value = 'idle'
  statusText.value = ''
}
</script>

<style scoped>
.uuid-tool {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.uuid-row {
  display: grid;
  grid-template-columns: 130px 1fr;
  align-items: center;
  gap: 10px;
}

.uuid-label {
  font-size: 13px;
  color: #374151;
}

.uuid-select {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  background: #fff;
}

.uuid-count {
  display: flex;
  gap: 10px;
  align-items: center;
}

.uuid-input {
  width: 120px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  background: #fff;
}

.uuid-hint {
  font-size: 12px;
  color: #b45309;
  white-space: nowrap;
}

.uuid-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  user-select: none;
}

.uuid-check input {
  width: 14px;
  height: 14px;
}

.uuid-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.uuid-btn {
  padding: 7px 14px;
  font-size: 13px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.uuid-btn.primary {
  background: #16a34a;
  border-color: #16a34a;
  color: #fff;
  font-weight: 600;
}

.uuid-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.uuid-status {
  font-size: 12px;
  color: #6b7280;
  margin-left: 6px;
}

.uuid-status.ok {
  color: #16a34a;
}

.uuid-status.error {
  color: #ef4444;
}

.uuid-result {
  width: 100%;
  min-height: 220px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.55;
  box-sizing: border-box;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>

