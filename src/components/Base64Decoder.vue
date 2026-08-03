<template>
  <div class="b64">
    <div class="b64-mode-switch" role="tablist" aria-label="Base64操作模式">
      <button
        type="button"
        class="b64-mode-btn"
        :class="{ active: mode === 'decode' }"
        role="tab"
        :aria-selected="mode === 'decode'"
        @click="switchMode('decode')"
      >
        解码模式
      </button>
      <button
        type="button"
        class="b64-mode-btn"
        :class="{ active: mode === 'encode' }"
        role="tab"
        :aria-selected="mode === 'encode'"
        @click="switchMode('encode')"
      >
        编码模式
      </button>
    </div>

    <p class="b64-hint">{{ modeHint }}</p>

    <textarea
      v-model="inputText"
      class="b64-input"
      spellcheck="false"
      :placeholder="mode === 'decode' ? '在此输入 Base64 字符串…' : '在此输入要编码的原文…'"
      rows="7"
    />

    <div class="b64-actions">
      <button
        type="button"
        class="b64-btn primary"
        :disabled="!canRun"
        @click="mode === 'decode' ? decodeBase64() : encodeBase64()"
      >
        {{ mode === 'decode' ? 'Base64解码' : 'Base64编码' }}
      </button>
      <button type="button" class="b64-btn" :disabled="!outputText" @click="copyResult">复制结果</button>
      <button type="button" class="b64-btn" :disabled="!outputText" @click="swapInputOutput">交换输入/输出</button>
      <button type="button" class="b64-btn" :disabled="!inputText && !outputText" @click="clearAll">清空</button>
      <button type="button" class="b64-link-btn" @click="fillExample(mode === 'decode' ? 'plain' : 'encode')">
        查看示例
      </button>
      <button v-if="mode === 'decode'" type="button" class="b64-link-btn" @click="fillExample('mime')">
        MIME解码示例
      </button>
    </div>

    <p class="b64-status" :class="{ ok: statusKind === 'ok', error: statusKind === 'error' }">{{ statusText }}</p>

    <p class="b64-label">{{ mode === 'decode' ? 'Base64解码的结果：' : 'Base64编码的结果：' }}</p>
    <textarea
      :value="outputText"
      class="b64-output"
      readonly
      spellcheck="false"
      :placeholder="mode === 'decode' ? '解码结果将显示在这里' : '编码结果将显示在这里'"
      rows="8"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type StatusKind = 'idle' | 'ok' | 'error'
type ExampleKind = 'plain' | 'mime' | 'encode'
type Mode = 'decode' | 'encode'

const inputText = ref('')
const outputText = ref('')
const mode = ref<Mode>('decode')
const statusKind = ref<StatusKind>('idle')
const statusText = ref('等待解码')

const canRun = computed(() => Boolean(inputText.value.trim()))
const modeHint = computed(() =>
  mode.value === 'decode'
    ? '请输入要进行 Base64 解码的字符串（支持普通/Base64URL/MIME 形式）。'
    : '请输入要进行 Base64 编码的原始文本（按 UTF-8 编码）。'
)

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

const looksLikeBase64 = (text: string) => {
  const t = String(text || '').trim().replace(/\s+/g, '')
  if (!t) return false
  return /^[A-Za-z0-9+/_=-]+$/.test(t)
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

const encodeBase64 = () => {
  try {
    const bytes = new TextEncoder().encode(inputText.value)
    let binary = ''
    bytes.forEach((b) => {
      binary += String.fromCharCode(b)
    })
    outputText.value = window.btoa(binary)
    statusKind.value = 'ok'
    statusText.value = '编码成功'
  } catch {
    outputText.value = ''
    statusKind.value = 'error'
    statusText.value = '编码失败：请检查输入内容'
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
      : kind === 'mime'
        ? 'U3ViamVjdDog5Lit5paH5L2g5aW9DQoNCk1JTUUgQmFzZTY0IOekuuS+i+Wtl+espuS4suOAgg=='
        : 'JsonCC Lab Base64 编码示例'
  statusKind.value = 'idle'
  statusText.value =
    mode.value === 'decode'
      ? '示例已填充，点击“Base64解码”查看结果'
      : '示例已填充，点击“Base64编码”查看结果'
}

const switchMode = (nextMode: Mode) => {
  mode.value = nextMode
  inputText.value = ''
  outputText.value = ''
  statusKind.value = 'idle'
  statusText.value = nextMode === 'decode' ? '等待解码' : '等待编码'
}

const swapInputOutput = () => {
  const nextInput = outputText.value
  outputText.value = inputText.value
  inputText.value = nextInput
  if (looksLikeBase64(inputText.value)) {
    mode.value = 'decode'
    statusKind.value = 'idle'
    statusText.value = '已交换，当前更适合解码模式'
  } else {
    mode.value = 'encode'
    statusKind.value = 'idle'
    statusText.value = '已交换，当前更适合编码模式'
  }
}

const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
  statusKind.value = 'idle'
  statusText.value = mode.value === 'decode' ? '等待解码' : '等待编码'
}
</script>

<style scoped>
.b64 {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.b64-mode-switch {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-secondary);
  padding: 3px;
  width: fit-content;
}

.b64-mode-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  cursor: pointer;
}

.b64-mode-btn.active {
  background: var(--accent-blue);
  color: var(--bg-card);
}

.b64-hint,
.b64-label {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
}

.b64-input,
.b64-output {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 10px 12px;
  box-sizing: border-box;
  font-size: 13px;
  line-height: 1.55;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  resize: vertical;
  background: var(--bg-card);
}

.b64-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.b64-btn {
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: 6px;
  font-size: 14px;
  padding: 7px 14px;
  cursor: pointer;
}

.b64-btn.primary {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: var(--bg-card);
}

.b64-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.b64-link-btn {
  border: none;
  background: transparent;
  color: var(--link-color);
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
  color: var(--text-muted);
}

.b64-status.ok {
  color: var(--accent-success);
}

.b64-status.error {
  color: var(--accent-error);
}
</style>
