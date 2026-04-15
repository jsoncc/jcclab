<template>
  <div class="b64">
    <p class="b64-hint">请输入要进行 Base64 解码的字符串（支持普通/Base64URL/MIME 形式）。</p>

    <textarea
      v-model="inputText"
      class="b64-input"
      spellcheck="false"
      placeholder="在此输入 Base64 字符串…"
      rows="7"
    />

    <div class="b64-actions">
      <button type="button" class="b64-btn primary" :disabled="!canDecode" @click="decodeBase64">Base64解码</button>
      <button type="button" class="b64-btn" :disabled="!outputText" @click="copyResult">复制结果</button>
      <button type="button" class="b64-btn" :disabled="!inputText && !outputText" @click="clearAll">清空</button>
      <button type="button" class="b64-link-btn" @click="fillExample('plain')">查看示例</button>
      <button type="button" class="b64-link-btn" @click="fillExample('mime')">MIME解码示例</button>
    </div>

    <p class="b64-status" :class="{ ok: statusKind === 'ok', error: statusKind === 'error' }">{{ statusText }}</p>

    <p class="b64-label">Base64解码的结果：</p>
    <textarea
      :value="outputText"
      class="b64-output"
      readonly
      spellcheck="false"
      placeholder="解码结果将显示在这里"
      rows="8"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type StatusKind = 'idle' | 'ok' | 'error'
type ExampleKind = 'plain' | 'mime'

const inputText = ref('')
const outputText = ref('')
const statusKind = ref<StatusKind>('idle')
const statusText = ref('等待解码')

const canDecode = computed(() => Boolean(inputText.value.trim()))

const normalizeBase64 = (raw: string) => {
  let text = String(raw || '').trim()
  text = text.replace(/\s+/g, '')
  text = text.replace(/-/g, '+').replace(/_/g, '/')
  const mod = text.length % 4
  if (mod > 0) text += '='.repeat(4 - mod)
  return text
}

const decodeUtf8FromBase64 = (raw: string) => {
  const normalized = normalizeBase64(raw)
  const binary = window.atob(normalized)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

const decodeBase64 = () => {
  try {
    outputText.value = decodeUtf8FromBase64(inputText.value)
    statusKind.value = 'ok'
    statusText.value = '解码成功'
  } catch {
    outputText.value = ''
    statusKind.value = 'error'
    statusText.value = '解码失败：请输入有效的 Base64 内容'
  }
}

const copyTextToClipboard = async (text: string) => {
  if (!text) return false
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }
  const ta = document.createElement('textarea')
  ta.value = text
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

const copyResult = async () => {
  if (!outputText.value) return
  try {
    const ok = await copyTextToClipboard(outputText.value)
    if (!ok) throw new Error('copy_failed')
    statusKind.value = 'ok'
    statusText.value = '已复制结果'
  } catch {
    statusKind.value = 'error'
    statusText.value = '复制失败，请手动复制'
  }
}

const fillExample = (kind: ExampleKind) => {
  inputText.value =
    kind === 'plain'
      ? '5L2g5aW977yM6L+Z5pivIEpzb25DQyBMYWIg55qEIEJhc2U2NOino+eggeekuuS+i+OAgg=='
      : 'U3ViamVjdDog5Lit5paH5L2g5aW9DQoNCk1JTUUgQmFzZTY0IOekuuS+i+Wtl+espuS4suOAgg=='
  statusKind.value = 'idle'
  statusText.value = '示例已填充，点击“Base64解码”查看结果'
}

const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
  statusKind.value = 'idle'
  statusText.value = '等待解码'
}
</script>

<style scoped>
.b64 {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.b64-hint,
.b64-label {
  margin: 0;
  font-size: 14px;
  color: #374151;
}

.b64-input,
.b64-output {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 10px 12px;
  box-sizing: border-box;
  font-size: 13px;
  line-height: 1.55;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  resize: vertical;
  background: #fff;
}

.b64-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.b64-btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 6px;
  font-size: 14px;
  padding: 7px 14px;
  cursor: pointer;
}

.b64-btn.primary {
  background: #1e9fff;
  border-color: #1e9fff;
  color: #fff;
}

.b64-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.b64-link-btn {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 14px;
  cursor: pointer;
  padding: 0 2px;
}

.b64-link-btn:hover {
  text-decoration: underline;
}

.b64-status {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.b64-status.ok {
  color: #16a34a;
}

.b64-status.error {
  color: #dc2626;
}
</style>
