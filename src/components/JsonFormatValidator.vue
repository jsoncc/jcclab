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

      <div class="jfv-editor-footer">
        <button
          type="button"
          class="jfv-editor-btn"
          :disabled="!inputText"
          title="复制"
          @click="copyInput"
        >
          <Icon :icon="contentCopyIcon" />
        </button>
        <button
          type="button"
          class="jfv-editor-btn"
          :disabled="!inputText"
          title="清空"
          @click="clearAll"
        >
          <Icon :icon="trashCanOutlineIcon" />
        </button>
      </div>
    </div>

    <div class="jfv-actionsbar">
      <button type="button" class="jfv-action primary" :disabled="!canRun" @click="run">格式化校验</button>
      <button type="button" class="jfv-action" :disabled="!canRun" @click="compressAndCopy">压缩</button>
      <button type="button" class="jfv-action" :disabled="!canRun" @click="escapeText">转义</button>
      <button type="button" class="jfv-action" :disabled="!canRun" @click="unescapeText">去除转义</button>
      <button
        v-if="showExpandBtn"
        type="button"
        class="jfv-action"
        title="展开"
        @click="showExpanded = true"
      >
        展开
      </button>
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
import { computed, nextTick, ref, type CSSProperties } from 'vue'
import { Icon } from '@iconify/vue'
import checkBold from '@iconify-icons/mdi/check-bold'
import closeThick from '@iconify-icons/mdi/close-thick'
import informationVariant from '@iconify-icons/mdi/information-variant'
import fullscreenExitIcon from '@iconify-icons/mdi/fullscreen-exit'
import contentCopyIcon from '@iconify-icons/mdi/content-copy'
import trashCanOutlineIcon from '@iconify-icons/mdi/trash-can-outline'

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

/** 与 gutter 单行高度一致，用于把错误行映射成 textarea 背景高亮条 */
const LINE_HEIGHT_PX = 22

const canRun = computed(() => Boolean(inputText.value.trim()))

const lineCount = computed(() => Math.max(1, String(inputText.value || '').split('\n').length))

const modalLineCount = computed(() => Math.max(1, String(inputText.value || '').split('\n').length))

/** 语法高亮：为 JSON 的不同类型添加不同的样式 */
const highlightJson = (text: string): string => {
  if (!text) return ''

  const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  let result = ''
  let index = 0

  // 单次扫描原始 JSON。字符串一旦识别便整体输出，后续 token 不会进入字符串内容。
  while (index < text.length) {
    const char = text[index]

    if (char === '"') {
      let end = index + 1
      while (end < text.length) {
        if (text[end] === '\\') { end += 2; continue }
        if (text[end] === '"') { end++; break }
        end++
      }
      const rawString = text.slice(index, end)
      let next = end
      while (/\s/.test(text[next] || '')) next++
      if (text[next] === ':') {
        result += `<span class="jfv-json-key">${escapeHtml(rawString)}</span>`
      } else {
        result += `<span class="jfv-quote">"</span><span class="jfv-json-string-value">${escapeHtml(rawString.slice(1, -1))}</span><span class="jfv-quote">"</span>`
      }
      index = end
      continue
    }

    const number = text.slice(index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+\-]?\d+)?/)
    if (number && (char === '-' || /\d/.test(char))) {
      result += `<span class="jfv-json-number">${number[0]}</span>`
      index += number[0].length
      continue
    }

    if (text.startsWith('true', index) || text.startsWith('false', index)) {
      const value = text.startsWith('true', index) ? 'true' : 'false'
      result += `<span class="jfv-json-boolean">${value}</span>`
      index += value.length
      continue
    }
    if (text.startsWith('null', index)) {
      result += '<span class="jfv-json-null">null</span>'
      index += 4
      continue
    }

    result += escapeHtml(char)
    index++
  }

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
  showExpandBtn.value = false
}

// 转义：在特殊字符前加反斜杠
const escapeText = () => {
  const raw = inputText.value
  if (!raw) return
  inputText.value = raw
    .replace(/\\/g, '\\\\')     // \ → \\
    .replace(/"/g, '\\"')       // " → \"
    .replace(/\n/g, '\\n')      // 换行 → \n
    .replace(/\r/g, '\\r')      // 回车 → \r
    .replace(/\t/g, '\\t')      // 制表符 → \t
  statusKind.value = 'ok'
  statusText.value = '已转义'
}

// 去除转义：去掉反斜杠，还原为普通字符
const unescapeText = () => {
  const raw = inputText.value
  if (!raw) return
  inputText.value = raw
    .replace(/\\\\/g, '\\')     // \\ → \
    .replace(/\\"/g, '"')       // \" → "
    .replace(/\\n/g, 'n')      // \n → n
    .replace(/\\r/g, 'r')      // \r → r
    .replace(/\\t/g, 't')      // \t → t
  statusKind.value = 'ok'
  statusText.value = '已去除转义'
}

const compressAndCopy = () => {
  const raw = inputText.value
  const trimmed = raw.trim()
  errorDetail.value = null

  if (!trimmed) return

  let compressed: string
  let isJson = true
  try {
    compressed = JSON.stringify(JSON.parse(raw))
  } catch {
    // 非 JSON 内容（如 PEM 公钥、纯文本日志）：仅去除换行，不改动内容本身
    isJson = false
    compressed = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .join('')
  }
  inputText.value = compressed
  statusKind.value = 'ok'
  statusText.value = isJson ? '已压缩为一行' : '已压缩为一行（非 JSON，仅去除换行）'
  nextTick(() => syncScroll())
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
  const scrollLeft = ta.scrollLeft
  gutter.scrollTop = scrollTop
  gutter.scrollLeft = 0
  if (highlight) {
    highlight.scrollTop = scrollTop
    highlight.scrollLeft = scrollLeft
  }
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
    showExpandBtn.value = true
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
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  border-radius: 2px;
  overflow: hidden;
  min-height: 340px;
  height: auto;
  flex: 1;
}

.jfv-editor-wrapper {
  position: relative;
  overflow: hidden;
}

.jfv-gutter {
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  overflow: hidden;
  padding: 10px 0;
  height: 100%;
}

.jfv-gutter-line {
  height: 22px;
  line-height: 22px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: right;
  padding-right: 10px;
  user-select: none;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.jfv-gutter-line.active {
  background: var(--accent-error);
  color: var(--on-accent);
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
  background: var(--bg-card);
  caret-color: var(--text-primary);
}

.jfv-highlight {
  position: absolute;
  inset: 0;
  margin: 0 !important;
  padding: 10px 12px !important;
  font-size: 14px;
  line-height: 22px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
  color: var(--text-primary);
  background: var(--bg-card);
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
  color: var(--accent-error);
  font-weight: 400;
}

.jfv-highlight :deep(.jfv-quote) {
  color: var(--text-secondary);
}

.jfv-highlight :deep(.jfv-json-string-value) {
  color: var(--link-color);
}

.jfv-highlight :deep(.jfv-json-number) {
  color: var(--accent-success);
}

.jfv-highlight :deep(.jfv-json-boolean) {
  color: var(--accent-blue);
  font-weight: 600;
}

.jfv-highlight :deep(.jfv-json-null) {
  color: var(--accent-blue);
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
  caret-color: var(--text-primary);
  overflow-y: auto;
  white-space: pre;
  color: var(--text-primary);
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
  caret-color: var(--text-primary);
}

.jfv-json-key {
  color: var(--accent-error);
  font-weight: 600;
}

.jfv-json-string {
  color: var(--accent-error);
}

.jfv-json-number {
  color: var(--accent-success);
}

.jfv-json-boolean {
  color: var(--accent-blue);
  font-weight: 600;
}

.jfv-json-null {
  color: var(--accent-blue);
  font-weight: 600;
}

.jfv-editor-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  font-size: 16px;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.75;
  transition: opacity 0.15s ease, background-color 0.15s ease;
}

.jfv-editor-btn:hover {
  opacity: 1;
  background: var(--bg-tertiary);
}

.jfv-editor-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.jfv-editor-footer {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: flex;
  flex-direction: row;
  gap: 4px;
  z-index: 2;
}

.jfv-editor-footer .jfv-editor-btn :deep(svg) {
  width: 16px;
  height: 16px;
}

.jfv-actionsbar {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 10px;
  border: 1px solid var(--border-color);
  border-top: none;
  background: var(--bg-tertiary);
}

.jfv-action {
  padding: 9px 18px;
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  border-right: 1px solid var(--border-color);
  cursor: pointer;
}

.jfv-action.primary {
  background: var(--accent-blue);
  color: var(--on-accent);
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
  border: 1px solid var(--border-color);
  border-top: none;
  background: var(--bg-card);
}

.jfv-result.ok {
  /* 浅色底 + 实色图标，避免深色全底导致文字看不清（含深色主题） */
  background: color-mix(in srgb, var(--accent-success) 12%, var(--bg-card));
}

.jfv-result.error {
  background: color-mix(in srgb, var(--accent-error) 12%, var(--bg-card));
}

.jfv-result-icon {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--on-accent);
  background: var(--border-color-light);
  flex: 0 0 auto;
}

.jfv-result-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.jfv-result.ok .jfv-result-icon {
  background: var(--accent-success);
}

.jfv-result.error .jfv-result-icon {
  background: var(--accent-error);
}

.jfv-result.ok .jfv-result-title {
  color: var(--accent-success);
}

.jfv-result.error .jfv-result-title {
  color: var(--accent-error);
}

.jfv-result-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.jfv-result-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-secondary);
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
  background: var(--bg-card);
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
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  flex: 0 0 auto;
}

.jfv-modal-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
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
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.jfv-modal-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-color-light);
  color: var(--text-primary);
}

.jfv-modal-close:hover {
  background: var(--accent-error);
  border-color: var(--accent-error);
  color: var(--on-accent);
}

.jfv-modal-content {
  margin: 0;
  padding: 18px 20px;
  font-size: 14px;
  line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  overflow-y: auto;
  flex: 1;
  display: flex;
  min-height: 0;
}

.jfv-modal-gutter {
  flex: 0 0 46px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  padding: 0 10px 0 0;
  text-align: right;
  user-select: none;
}

.jfv-modal-gutter-line {
  height: 22.4px;
  line-height: 22.4px;
  font-size: 12px;
  color: var(--text-muted);
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
  color: var(--accent-error);
  font-weight: 400;
}

.jfv-modal-pre :deep(.jfv-quote) {
  color: var(--text-secondary);
}

.jfv-modal-pre :deep(.jfv-json-string-value) {
  color: var(--link-color);
}

.jfv-modal-pre :deep(.jfv-json-number) {
  color: var(--accent-success);
}

.jfv-modal-pre :deep(.jfv-json-boolean) {
  color: var(--accent-blue);
  font-weight: 600;
}

.jfv-modal-pre :deep(.jfv-json-null) {
  color: var(--accent-blue);
  font-weight: 600;
}

.jfv-modal-pre .jfv-json-string {
  color: var(--accent-error) !important;
}

.jfv-modal-pre .jfv-json-number {
  color: var(--accent-success) !important;
}

.jfv-modal-pre .jfv-json-boolean {
  color: var(--accent-blue) !important;
  font-weight: 600;
}

.jfv-modal-pre .jfv-json-null {
  color: var(--accent-blue) !important;
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
