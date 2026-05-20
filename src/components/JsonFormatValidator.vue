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
      <div class="jfv-editor-wrapper">
        <pre
          v-if="statusKind === 'ok' && inputText"
          ref="highlightRef"
          class="jfv-highlight"
          aria-hidden="true"
        ><code v-html="highlightedCode"></code></pre>
        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="jfv-textarea"
          :class="{ 'highlight-active': statusKind === 'ok' && inputText }"
          :style="highlightStyle"
          placeholder="在此输入 JSON…"
          spellcheck="false"
          @scroll="syncScroll"
        />
      </div>

      <div class="jfv-editor-actions">
        <button
          v-if="showExpandBtn"
          type="button"
          class="jfv-editor-btn"
          title="展开"
          @click="showExpanded = true"
        >
          <Icon :icon="fullscreenIcon" />
        </button>
        <button type="button" class="jfv-editor-btn" :disabled="!inputText" @click="copyInput">
          <Icon :icon="contentCopyIcon" />
        </button>
      </div>
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
        <Icon v-if="statusKind === 'ok'" :icon="checkBold" />
        <Icon v-else-if="statusKind === 'error'" :icon="closeThick" />
        <Icon v-else :icon="informationVariant" />
      </span>
      <div class="jfv-result-text">
        <div class="jfv-result-title">{{ statusText }}</div>
        <div v-if="statusKind === 'error' && errorDetail" class="jfv-result-sub">
          第 {{ errorDetail.line }} 行第 {{ errorDetail.column }} 列：{{ errorDetail.message }}
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="showExpanded" class="jfv-overlay" @click.self="showExpanded = false">
      <div class="jfv-modal">
        <div class="jfv-modal-header">
          <span class="jfv-modal-title">格式化结果</span>
          <div class="jfv-modal-actions">
            <button type="button" class="jfv-modal-btn" title="复制" @click="copyInput">
              <Icon :icon="contentCopyIcon" />
              <span>复制</span>
            </button>
            <button type="button" class="jfv-modal-btn jfv-modal-close" title="关闭" @click="showExpanded = false">
              <Icon :icon="fullscreenExitIcon" />
              <span>关闭</span>
            </button>
          </div>
        </div>
        <div class="jfv-modal-content">
          <div class="jfv-modal-gutter">
            <div
              v-for="no in modalLineCount"
              :key="no"
              class="jfv-modal-gutter-line"
            >
              {{ no }}
            </div>
          </div>
          <pre class="jfv-modal-pre"><code v-html="highlightedCodeModal"></code></pre>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * JSON 格式化 / 校验 / 压缩：左侧行号 gutter 与 textarea 同步滚动；错误时在对应行做浅色高亮。
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type CSSProperties } from 'vue'
import { Icon } from '@iconify/vue'
import checkBold from '@iconify-icons/mdi/check-bold'
import closeThick from '@iconify-icons/mdi/close-thick'
import informationVariant from '@iconify-icons/mdi/information-variant'
import fullscreenIcon from '@iconify-icons/mdi/fullscreen'
import fullscreenExitIcon from '@iconify-icons/mdi/fullscreen-exit'
import contentCopyIcon from '@iconify-icons/mdi/content-copy'

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
const highlightRef = ref<HTMLElement | null>(null)
const showExpanded = ref(false)
const showExpandBtn = ref(false)
let resizeObserver: ResizeObserver | null = null

/** 与 gutter 单行高度一致，用于把错误行映射成 textarea 背景高亮条 */
const LINE_HEIGHT_PX = 22

const canRun = computed(() => Boolean(inputText.value.trim()))

const lineCount = computed(() => Math.max(1, String(inputText.value || '').split('\n').length))

const modalLineCount = computed(() => Math.max(1, String(inputText.value || '').split('\n').length))

/** 语法高亮：为 JSON 的不同类型添加不同的样式 */
const highlightJson = (text: string): string => {
  if (!text) return ''
  
  // 先转义 HTML 特殊字符
  let result = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // 分步处理，避免相互干扰
  // 1. 先处理键（带冒号的字符串）
  result = result.replace(/"([^"\\]|\\.)*"(?=\s*:)/g, (match) => {
    return `<span class="jfv-json-key">${match}</span>`
  })
  
  // 2. 处理字符串值（冒号后的字符串）- 引号和内部内容分开样式
  // 使用更精确的正则，只匹配冒号后的字符串
  result = result.replace(/:\s*"((?:[^"\\]|\\.)*)"/g, (match, inner) => {
    const whitespace = match.match(/:\s*/)?.[0]?.slice(1) || ''
    return `:${whitespace}<span class="jfv-quote">"</span><span class="jfv-json-string-value">${inner}</span><span class="jfv-quote">"</span>`
  })
  
  // 3. 处理布尔值
  result = result.replace(/\btrue\b/g, '<span class="jfv-json-boolean">true</span>')
  result = result.replace(/\bfalse\b/g, '<span class="jfv-json-boolean">false</span>')
  
  // 4. 处理 null
  result = result.replace(/\bnull\b/g, '<span class="jfv-json-null">null</span>')
  
  // 5. 处理数字（对象中的数字值）
  result = result.replace(/:(\s*-?\d+(?:\.\d*)?(?:[eE][+\-]?[0-9]+)?)/g, (match, num) => {
    return `:<span class="jfv-json-number">${num}</span>`
  })
  
  // 6. 处理数组中的数字
  result = result.replace(/\[(\s*-?\d+(?:\.\d*)?(?:[eE][+\-]?[0-9]+)?)(\s*[\],])/g, (match, num, end) => {
    return `[<span class="jfv-json-number">${num}</span>${end}`
  })
  
  return result
}

const highlightedCode = computed(() => {
  if (statusKind.value !== 'ok' || !inputText.value) return ''
  return highlightJson(inputText.value)
})

const highlightedCodeModal = computed(() => {
  if (!inputText.value) return ''
  return highlightJson(inputText.value)
})

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
  const highlight = highlightRef.value
  if (!ta || !gutter) return
  const scrollTop = ta.scrollTop
  gutter.scrollTop = scrollTop
  
  if (highlight) {
    highlight.scrollTop = scrollTop
  }
}

const checkOverflow = () => {
  const ta = textareaRef.value
  if (!ta) { showExpandBtn.value = false; return }
  showExpandBtn.value = ta.scrollHeight > ta.clientHeight && Boolean(inputText.value)
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
    nextTick(() => { syncScroll(); checkOverflow() })
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

watch(inputText, () => {
  nextTick(checkOverflow)
})

onMounted(() => {
  const ta = textareaRef.value
  if (ta) {
    resizeObserver = new ResizeObserver(checkOverflow)
    resizeObserver.observe(ta)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
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

.jfv-editor-wrapper {
  position: relative;
  overflow: hidden;
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
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
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
  color: transparent;
  background: #fff;
  caret-color: #333;
}

.jfv-highlight {
  position: absolute;
  inset: 0;
  margin: 0 !important;
  padding: 10px 12px !important;
  font-size: 14px;
  line-height: 22px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
  color: #333;
  background: #fff;
  overflow-y: auto;
  white-space: pre;
  word-spacing: 0;
  text-indent: 0;
  pointer-events: none;
  border: none !important;
  display: block;
  text-align: left;
  letter-spacing: normal;
}

.jfv-highlight code {
  display: block;
  margin: 0 !important;
  padding: 0 !important;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  white-space: inherit;
  word-spacing: inherit;
  text-align: left;
}

.jfv-highlight :deep(.jfv-json-key) {
  color: #c41a16;
  font-weight: 400;
}

.jfv-highlight :deep(.jfv-quote) {
  color: #666;
}

.jfv-highlight :deep(.jfv-json-string-value) {
  color: #2563eb;
}

.jfv-highlight :deep(.jfv-json-number) {
  color: #16a34a;
}

.jfv-highlight :deep(.jfv-json-boolean) {
  color: #0c3a97;
  font-weight: 600;
}

.jfv-highlight :deep(.jfv-json-null) {
  color: #0c3a97;
  font-weight: 600;
}

.jfv-textarea {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 22px;
  box-sizing: border-box;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
  background: transparent;
  caret-color: #333;
  overflow-y: auto;
  white-space: pre;
  color: #333;
  margin: 0;
  text-align: left;
  letter-spacing: normal;
  word-spacing: normal;
  text-indent: 0;
}

.jfv-textarea.highlight-active {
  color: transparent;
  caret-color: transparent;
}

.jfv-textarea.highlight-active:focus {
  caret-color: #333;
}

.jfv-json-key {
  color: #c41a16;
  font-weight: 600;
}

.jfv-json-string {
  color: #c41a16;
}

.jfv-json-number {
  color: #16a34a;
}

.jfv-json-boolean {
  color: #0c3a97;
  font-weight: 600;
}

.jfv-json-null {
  color: #0c3a97;
  font-weight: 600;
}

.jfv-editor-actions {
  position: absolute;
  right: 10px;
  top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.jfv-editor-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  font-size: 16px;
  color: #666;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.75;
  transition: opacity 0.15s ease, background-color 0.15s ease;
}

.jfv-editor-btn:hover {
  opacity: 1;
  background: #f5f5f5;
}

.jfv-editor-btn:disabled {
  opacity: 0.3;
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
  color: #fff;
  background: #bdbdbd;
  flex: 0 0 auto;
}

.jfv-result-icon :deep(svg) {
  width: 16px;
  height: 16px;
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

.jfv-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.jfv-modal {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 900px;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.jfv-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e6e6e6;
  background: #fafafa;
  flex: 0 0 auto;
}

.jfv-modal-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.jfv-modal-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.jfv-modal-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 12px;
  color: #555;
  background: #fff;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.jfv-modal-btn:hover {
  background: #f0f0f0;
  border-color: #bbb;
  color: #333;
}

.jfv-modal-close:hover {
  background: #fee;
  border-color: #fcc;
  color: #c00;
}

.jfv-modal-content {
  margin: 0;
  padding: 18px 20px;
  font-size: 14px;
  line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-y: auto;
  flex: 1;
  display: flex;
  min-height: 0;
}

.jfv-modal-gutter {
  flex: 0 0 46px;
  background: #fbfbfb;
  border-right: 1px solid #e6e6e6;
  padding: 0 10px 0 0;
  text-align: right;
  user-select: none;
}

.jfv-modal-gutter-line {
  height: 22.4px;
  line-height: 22.4px;
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.jfv-modal-pre {
  margin: 0;
  padding: 0 0 0 12px;
  flex: 1;
  min-width: 0;
}

.jfv-modal-pre code {
  white-space: pre;
  word-break: normal;
}

.jfv-modal-pre :deep(.jfv-json-key) {
  color: #c41a16;
  font-weight: 400;
}

.jfv-modal-pre :deep(.jfv-quote) {
  color: #666;
}

.jfv-modal-pre :deep(.jfv-json-string-value) {
  color: #2563eb;
}

.jfv-modal-pre :deep(.jfv-json-number) {
  color: #16a34a;
}

.jfv-modal-pre :deep(.jfv-json-boolean) {
  color: #0c3a97;
  font-weight: 600;
}

.jfv-modal-pre :deep(.jfv-json-null) {
  color: #0c3a97;
  font-weight: 600;
}

.jfv-modal-pre .jfv-json-string {
  color: #c41a16 !important;
}

.jfv-modal-pre .jfv-json-number {
  color: #16a34a !important;
}

.jfv-modal-pre .jfv-json-boolean {
  color: #0c3a97 !important;
  font-weight: 600;
}

.jfv-modal-pre .jfv-json-null {
  color: #0c3a97 !important;
  font-weight: 600;
}

@media (max-width: 640px) {
  .jfv-editor {
    grid-template-columns: 42px 1fr;
  }

  .jfv-overlay {
    padding: 0;
    align-items: stretch;
  }

  .jfv-modal {
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
