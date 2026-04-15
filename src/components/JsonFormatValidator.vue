<template>
  <div class="jfv">
    <div class="jfv-editor">
      <div ref="gutterRef" class="jfv-gutter" aria-hidden="true">
        <div
          v-for="no in lineCount"
          :key="no"
          class="jfv-gutter-line"
          :class="{ active: statusKind === 'error' && errorDetail && no === errorDetail.line }"
        >
          {{ no }}
        </div>
      </div>
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="jfv-textarea"
        :style="highlightStyle"
        placeholder="在此输入 JSON…"
        spellcheck="false"
        @scroll="syncScroll"
      />

      <button type="button" class="jfv-copy" :disabled="!inputText" @click="copyInput">复制</button>
      <button type="button" class="jfv-clear" :disabled="!inputText" @click="clearAll">清空</button>
    </div>

    <div class="jfv-actionsbar">
      <button type="button" class="jfv-action primary" :disabled="!canRun" @click="run">格式化校验</button>
      <button type="button" class="jfv-action" :disabled="!canRun" @click="compressAndCopy">压缩</button>
    </div>

    <div
      class="jfv-result"
      :class="{ ok: statusKind === 'ok', error: statusKind === 'error' }"
      role="status"
      aria-live="polite"
    >
      <span class="jfv-result-icon" aria-hidden="true">
        <span v-if="statusKind === 'ok'">✓</span>
        <span v-else-if="statusKind === 'error'">✕</span>
        <span v-else>i</span>
      </span>
      <div class="jfv-result-text">
        <div class="jfv-result-title">{{ statusText }}</div>
        <div v-if="statusKind === 'error' && errorDetail" class="jfv-result-sub">
          第 {{ errorDetail.line }} 行第 {{ errorDetail.column }} 列：{{ errorDetail.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * JSON 格式化 / 校验 / 压缩：左侧行号 gutter 与 textarea 同步滚动；错误时在对应行做浅色高亮。
 */
import { computed, nextTick, ref, type CSSProperties } from 'vue'

type StatusKind = 'idle' | 'ok' | 'error'

interface JsonErrorDetail {
  message: string
  line: number
  column: number
}

const inputText = ref('')
const statusKind = ref<StatusKind>('idle')
const statusText = ref('请输入 JSON 后点击“格式化校验”')
const errorDetail = ref<JsonErrorDetail | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const gutterRef = ref<HTMLDivElement | null>(null)

/** 与 gutter 单行高度一致，用于把错误行映射成 textarea 背景高亮条 */
const LINE_HEIGHT_PX = 22

const canRun = computed(() => Boolean(inputText.value.trim()))

const lineCount = computed(() => Math.max(1, String(inputText.value || '').split('\n').length))

/** 优先 Clipboard API；非 https 等环境降级为 execCommand */
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

const highlightStyle = computed((): CSSProperties => {
  if (statusKind.value !== 'error' || !errorDetail.value?.line) return {}
  const start = (errorDetail.value.line - 1) * LINE_HEIGHT_PX
  const end = start + LINE_HEIGHT_PX
  return {
    '--jfv-hl-start': `${start}px`,
    '--jfv-hl-end': `${end}px`
  } as CSSProperties
})

const clearAll = () => {
  inputText.value = ''
  statusKind.value = 'idle'
  statusText.value = '请输入 JSON 后点击“格式化校验”'
  errorDetail.value = null
}

const compressAndCopy = () => {
  const raw = inputText.value
  const trimmed = raw.trim()
  errorDetail.value = null

  if (!trimmed) return

  try {
    const parsed = JSON.parse(raw)
    const compressed = JSON.stringify(parsed)
    inputText.value = compressed
    statusKind.value = 'ok'
    statusText.value = '已压缩为一行'
    nextTick(() => syncScroll())
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'JSON 解析失败'
    const pos = extractPositionFromErrorMessage(msg)
    const { line, column } = pos == null ? { line: 1, column: 1 } : computeLineColumnFromIndex(raw, pos)
    errorDetail.value = {
      message: msg,
      line,
      column
    }
    statusKind.value = 'error'
    statusText.value = '压缩失败：JSON 解析错误'
  }
}

const copyInput = async () => {
  if (!inputText.value) return
  try {
    const ok = await copyTextToClipboard(inputText.value)
    if (!ok) throw new Error('copy_failed')
    statusKind.value = 'ok'
    statusText.value = '已复制到剪贴板'
  } catch {
    statusKind.value = 'error'
    statusText.value = '复制失败：请手动复制'
  }
}

const extractPositionFromErrorMessage = (message: string) => {
  const m = String(message || '').match(/position\s+(\d+)/i)
  if (!m) return null
  const pos = Number(m[1])
  return Number.isFinite(pos) ? pos : null
}

const computeLineColumnFromIndex = (text: string, index: number) => {
  const safeIndex = Math.max(0, Math.min(Number(index || 0), text.length))
  const before = text.slice(0, safeIndex)
  const lines = before.split('\n')
  const line = lines.length
  const column = lines[lines.length - 1].length + 1
  return { line, column }
}

const syncScroll = () => {
  const ta = textareaRef.value
  const gutter = gutterRef.value
  if (!ta || !gutter) return
  gutter.scrollTop = ta.scrollTop
}

const run = () => {
  const raw = inputText.value
  const trimmed = raw.trim()
  errorDetail.value = null

  if (!trimmed) {
    statusKind.value = 'idle'
    statusText.value = '请输入 JSON 后点击“格式化校验”'
    return
  }

  try {
    const parsed = JSON.parse(raw)
    inputText.value = JSON.stringify(parsed, null, 2)
    statusKind.value = 'ok'
    statusText.value = '正确的 JSON'
    nextTick(() => syncScroll())
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'JSON 解析失败'
    const pos = extractPositionFromErrorMessage(msg)
    const { line, column } = pos == null ? { line: 1, column: 1 } : computeLineColumnFromIndex(raw, pos)
    errorDetail.value = {
      message: msg,
      line,
      column
    }
    statusKind.value = 'error'
    statusText.value = `第 ${line} 行解析错误：`
    nextTick(async () => {
      await nextTick()
      const ta = textareaRef.value
      if (!ta) return
      const top = Math.max(0, (line - 1) * LINE_HEIGHT_PX - LINE_HEIGHT_PX * 2)
      ta.scrollTop = top
      syncScroll()
    })
  }
}
</script>

<style scoped>
.jfv-editor {
  position: relative;
  display: grid;
  grid-template-columns: 46px 1fr;
  border: 1px solid #e6e6e6;
  background: #fff;
  border-radius: 2px;
  overflow: hidden;
  min-height: 340px;
  height: min(70vh, 620px);
}

.jfv-gutter {
  background: #fbfbfb;
  border-right: 1px solid #e6e6e6;
  overflow: hidden;
  padding: 10px 0;
  height: 100%;
}

.jfv-gutter-line {
  height: 22px;
  line-height: 22px;
  font-size: 12px;
  color: #999;
  text-align: right;
  padding-right: 10px;
  user-select: none;
  white-space: nowrap;
}

.jfv-gutter-line.active {
  background: #f6d3d3;
  color: #c00;
  font-weight: 700;
}

.jfv-textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 22px;
  height: 100%;
  box-sizing: border-box;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  color: #333;
  background: #fff;
  background-image: linear-gradient(#f6d3d3, #f6d3d3);
  background-repeat: no-repeat;
  background-size: 100% calc(var(--jfv-hl-end, 0px) - var(--jfv-hl-start, 0px));
  background-position: 0 var(--jfv-hl-start, -9999px);
}

.jfv-copy {
  position: absolute;
  right: 10px;
  top: 10px;
  padding: 5px 10px;
  font-size: 12px;
  color: #666;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 2px;
  cursor: pointer;
}

.jfv-copy:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.jfv-clear {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 5px 10px;
  font-size: 12px;
  color: #666;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 2px;
  cursor: pointer;
}

.jfv-clear:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.jfv-actionsbar {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 10px;
  border: 1px solid #e6e6e6;
  border-top: none;
  background: #f7f7f7;
}

.jfv-action {
  padding: 9px 18px;
  font-size: 13px;
  color: #333;
  background: transparent;
  border: none;
  border-right: 1px solid #e6e6e6;
  cursor: pointer;
}

.jfv-action.primary {
  background: #1e9fff;
  color: #fff;
  font-weight: 700;
}

.jfv-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.jfv-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid #e6e6e6;
  border-top: none;
  background: #fff;
}

.jfv-result.ok {
  background: #e8f8e8;
}

.jfv-result.error {
  background: #fcecec;
}

.jfv-result-icon {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 900;
  color: #fff;
  background: #bdbdbd;
  flex: 0 0 auto;
}

.jfv-result.ok .jfv-result-icon {
  background: #16a34a;
}

.jfv-result.error .jfv-result-icon {
  background: #ef4444;
}

.jfv-result-title {
  font-size: 13px;
  font-weight: 700;
  color: #333;
}

.jfv-result-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #666;
}

@media (max-width: 640px) {
  .jfv-editor {
    grid-template-columns: 42px 1fr;
  }
}
</style>

