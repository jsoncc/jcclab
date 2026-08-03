<template>
  <div class="p2w">
    <div class="p2w-header">
      <div class="p2w-icon-wrap">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      <div>
        <h3 class="p2w-title">PDF 转 Word</h3>
        <p class="p2w-subtitle">提取 PDF 文本内容并生成为可编辑的 Word 文档</p>
      </div>
    </div>

    <div
      class="p2w-zone"
      :class="{ 'p2w-zone-active': dragging, 'p2w-zone-filled': !!pdfFile }"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="triggerFileInput"
      role="button"
      tabindex="0"
      @keydown.enter.prevent="triggerFileInput"
      @keydown.space.prevent="triggerFileInput"
    >
      <input ref="fileInputRef" type="file" accept=".pdf,application/pdf" class="p2w-hidden" @change="onFileSelected" />
      <template v-if="!pdfFile">
        <div class="p2w-zone-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <p class="p2w-zone-text">选择或拖入 PDF 文件</p>
        <p class="p2w-zone-hint">文件仅在浏览器本地处理，不会上传</p>
      </template>
      <template v-else>
        <div class="p2w-zone-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <p class="p2w-zone-text">{{ pdfFile.name }}</p>
        <p class="p2w-zone-hint">{{ pdfPageCount }} 页 · {{ formatSize(pdfFile.size) }}</p>
      </template>
    </div>

    <div v-if="pdfFile" class="p2w-panel">
      <div class="p2w-panel-row">
        <label class="p2w-label">页码范围</label>
        <select v-model="pageRangeMode" class="p2w-select">
          <option value="all">全部</option>
          <option value="custom">自定义</option>
        </select>
        <input
          v-if="pageRangeMode === 'custom'"
          v-model="pageRangeInput"
          placeholder="如 1,3,5-8"
          class="p2w-input"
        />
        <span v-if="pageRangeMode === 'custom' && computedPages.length > 0" class="p2w-hint">
          共 {{ computedPages.length }} 页
        </span>
        <span v-else-if="pageRangeMode === 'custom' && pageRangeInput && computedPages.length === 0" class="p2w-hint error">
          格式无效
        </span>
      </div>
    </div>

    <div v-if="pdfFile" class="p2w-actions">
      <button type="button" class="p2w-btn p2w-btn-primary" :disabled="!canConvert || converting" @click="startConvert">
        <svg v-if="!converting" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span v-if="!converting">提取并转换为 Word</span>
        <span v-else>转换中…</span>
      </button>
      <button type="button" class="p2w-btn" :disabled="converting" @click="clearAll">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        清空
      </button>
    </div>

    <p class="p2w-status" :class="{ ok: statusKind === 'ok', error: statusKind === 'error' }">
      {{ statusText }}
    </p>

    <div v-if="converting" class="p2w-bar-wrap">
      <div class="p2w-bar" :style="{ width: progressPercent + '%' }"></div>
      <span class="p2w-bar-label">{{ progressPercent }}%</span>
    </div>

    <div v-if="previewText" class="p2w-preview">
      <div class="p2w-preview-head">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        内容预览
      </div>
      <pre class="p2w-preview-body">{{ previewText }}</pre>
    </div>

    <div v-if="canDownload" class="p2w-download">
      <button type="button" class="p2w-btn p2w-btn-primary" @click="downloadDocx">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        下载 Word 文档
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'

pdfjsLib.GlobalWorkerOptions.workerSrc = '//unpkg.com/pdfjs-dist@4.9.155/build/pdf.worker.min.mjs'

type StatusKind = 'idle' | 'ok' | 'error'

const fileInputRef = ref<HTMLInputElement | null>(null)
const pdfFile = ref<File | null>(null)
const pdfPageCount = ref(0)
const dragging = ref(false)
const pageRangeMode = ref<'all' | 'custom'>('all')
const pageRangeInput = ref('')

const converting = ref(false)
const statusKind = ref<StatusKind>('idle')
const statusText = ref('选择 PDF 文件后即可提取文本')
const progressPercent = ref(0)
const previewText = ref('')
const canDownload = ref(false)
const pdfReady = ref(false)

let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null
let docxBlob: Blob | null = null
let dragCounter = 0

const formatSize = (n: number) => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

const parsePageRange = (input: string, total: number): number[] => {
  const result: number[] = []
  const parts = input.split(',').map((s) => s.trim()).filter(Boolean)
  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      const start = Math.max(1, parseInt(rangeMatch[1], 10))
      const end = Math.min(total, parseInt(rangeMatch[2], 10))
      for (let i = start; i <= end; i++) result.push(i)
    } else {
      const num = parseInt(part, 10)
      if (!isNaN(num) && num >= 1 && num <= total) result.push(num)
    }
  }
  return [...new Set(result)].sort((a, b) => a - b)
}

const computedPages = computed(() => {
  if (!pdfPageCount.value || pageRangeMode.value !== 'custom') return []
  return parsePageRange(pageRangeInput.value, pdfPageCount.value)
})

const pagesToRender = computed(() => {
  if (!pdfPageCount.value) return []
  if (pageRangeMode.value === 'all') {
    return Array.from({ length: pdfPageCount.value }, (_, i) => i + 1)
  }
  return computedPages.value
})

const canConvert = computed(() => {
  if (!pdfReady.value || converting.value) return false
  if (pageRangeMode.value === 'custom' && computedPages.value.length === 0) return false
  return true
})

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const onDragEnter = () => { dragCounter++; dragging.value = true }
const onDragOver = () => { dragging.value = true }
const onDragLeave = () => {
  dragCounter--
  if (dragCounter <= 0) { dragCounter = 0; dragging.value = false }
}

const onDrop = (e: DragEvent) => {
  dragCounter = 0; dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type === 'application/pdf') loadPdf(file)
  else { statusKind.value = 'error'; statusText.value = '请拖入 PDF 文件' }
}

const onFileSelected = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) loadPdf(file)
}

const loadPdf = async (file: File) => {
  try {
    pdfFile.value = file
    statusKind.value = 'idle'
    statusText.value = '正在读取 PDF…'
    previewText.value = ''
    canDownload.value = false
    docxBlob = null
    progressPercent.value = 0
    pdfDoc?.destroy()
    pdfDoc = null

    const arrayBuffer = await file.arrayBuffer()
    pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    pdfPageCount.value = pdfDoc.numPages
    pdfReady.value = true
    statusKind.value = 'ok'
    statusText.value = `已加载 PDF，共 ${pdfDoc.numPages} 页`
  } catch {
    pdfFile.value = null
    pdfPageCount.value = 0
    pdfReady.value = false
    statusKind.value = 'error'
    statusText.value = '读取 PDF 失败，请检查文件是否有效'
  }
}

interface TextItem {
  str: string
  x: number
  y: number
  fontSize: number
  bold: boolean
}

interface BlockInfo {
  text: string
  bold: boolean
  centered: boolean
  fontSize: number
}

const isBold = (fontName: string) => /bold|heavy|black|demi/i.test(fontName)

const extractTextFromPage = async (
  pageNum: number,
): Promise<{ items: TextItem[]; pageWidth: number }> => {
  const page = await pdfDoc!.getPage(pageNum)
  const viewport = page.getViewport({ scale: 1 })
  const pageWidth = viewport.width
  const content = await page.getTextContent()
  page.cleanup()
  const items = content.items
    .filter((item: any) => (item.height || 0) >= 5 && item.str.trim())
    .map((item: any) => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      fontSize: item.height || 12,
      bold: isBold(item.fontName || ''),
    }))
  return { items, pageWidth }
}

const estimateBlockCenter = (items: TextItem[]): number => {
  if (!items.length) return 0
  const minX = Math.min(...items.map((i) => i.x))
  const maxX = Math.max(...items.map((i) => i.x + (i.str.length * i.fontSize * 0.5)))
  return (minX + maxX) / 2
}

const groupIntoParagraphs = (
  items: TextItem[],
  pageWidth: number,
): BlockInfo[] => {
  if (!items.length) return []
  const sorted = [...items].sort((a, b) => {
    const yd = b.y - a.y
    return Math.abs(yd) > 4 ? yd : a.x - b.x
  })
  const blocks: BlockInfo[] = []
  let lineItems: TextItem[] = []
  let lastY = sorted[0].y
  for (const item of sorted) {
    if (Math.abs(item.y - lastY) > 20) {
      if (lineItems.length) {
        const text = lineItems.map((i) => i.str).join('').trim()
        if (text) {
          const avgFont = Math.round(
            lineItems.reduce((s, i) => s + i.fontSize, 0) / lineItems.length,
          )
          const boldCount = lineItems.filter((i) => i.bold).length
          const center = estimateBlockCenter(lineItems)
          const halfPage = pageWidth / 2
          const centered = Math.abs(center - halfPage) < pageWidth * 0.15
          blocks.push({
            text: text.replace(/\s+/g, ' '),
            bold: boldCount > lineItems.length / 2,
            centered,
            fontSize: avgFont,
          })
        }
      }
      lineItems = []
    }
    lineItems.push(item)
    lastY = item.y
  }
  if (lineItems.length) {
    const text = lineItems.map((i) => i.str).join('').trim()
    if (text) {
      const avgFont = Math.round(
        lineItems.reduce((s, i) => s + i.fontSize, 0) / lineItems.length,
      )
      const boldCount = lineItems.filter((i) => i.bold).length
      const center = estimateBlockCenter(lineItems)
      const halfPage = pageWidth / 2
      const centered = Math.abs(center - halfPage) < pageWidth * 0.15
      blocks.push({
        text: text.replace(/\s+/g, ' '),
        bold: boldCount > lineItems.length / 2,
        centered,
        fontSize: avgFont,
      })
    }
  }
  return blocks
}

const startConvert = async () => {
  if (!pdfDoc) return
  converting.value = true
  statusKind.value = 'idle'
  statusText.value = '准备提取文本…'
  previewText.value = ''
  canDownload.value = false
  docxBlob = null
  progressPercent.value = 0

  const pageNums = pagesToRender.value
  const total = pageNums.length
  const allBlocks: BlockInfo[] = []

  try {
    for (let i = 0; i < total; i++) {
      const { items, pageWidth } = await extractTextFromPage(pageNums[i])
      const blocks = groupIntoParagraphs(items, pageWidth)

      if (blocks.length) {
        allBlocks.push(...blocks)
      }

      progressPercent.value = Math.round(((i + 1) / total) * 100)
      statusText.value = `提取中… ${i + 1}/${total}`
    }

    if (!allBlocks.length) {
      statusKind.value = 'error'
      statusText.value = '未提取到文本内容'
      converting.value = false
      return
    }

    const doc = new Document({
      creator: 'JsonCC Lab',
      title: pdfFile.value?.name.replace(/\.pdf$/i, '') || 'PDF 导出',
      description: '由 JsonCC Lab PDF 转 Word 工具生成',
      styles: {
        default: {
          document: {
            run: { font: 'Microsoft YaHei' },
          },
        },
      },
      sections: [{
        children: allBlocks.map((block) => new Paragraph({
          alignment: block.centered ? AlignmentType.CENTER : undefined,
          spacing: { after: block.fontSize > 16 ? 160 : 100 },
          children: [new TextRun({
            text: block.text,
            bold: block.bold,
            size: Math.round(block.fontSize * 1.8),
          })],
        })),
      }],
    })

    docxBlob = await Packer.toBlob(doc)

    previewText.value = allBlocks.map((b) => b.text).slice(0, 30).join('\n')
    if (allBlocks.length > 30) previewText.value += '\n\n… 以下略'

    canDownload.value = true
    statusKind.value = 'ok'
    statusText.value = `提取完成，共 ${allBlocks.length} 段文本`
  } catch (e) {
    statusKind.value = 'error'
    statusText.value = '转换失败：' + (e instanceof Error ? e.message : '未知错误')
  } finally {
    converting.value = false
  }
}

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = fileName
  document.body.appendChild(a); a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadDocx = () => {
  if (!docxBlob || !pdfFile.value) return
  const name = pdfFile.value.name.replace(/\.pdf$/i, '') + '.docx'
  downloadBlob(docxBlob, name)
}

const clearAll = () => {
  pdfFile.value = null; pdfPageCount.value = 0; pdfReady.value = false
  pdfDoc?.destroy(); pdfDoc = null
  previewText.value = ''; canDownload.value = false; docxBlob = null
  statusKind.value = 'idle'; statusText.value = '选择 PDF 文件后即可提取文本'
  progressPercent.value = 0
  if (fileInputRef.value) fileInputRef.value.value = ''
}
</script>

<style scoped>
.p2w {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.p2w-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.p2w-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-success), var(--accent-success));
  color: var(--on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.p2w-title {
  margin: 0;
  font-size: 26px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.2;
}

.p2w-subtitle {
  margin: 2px 0 0;
  font-size: 14px;
  color: var(--text-muted);
}

.p2w-zone {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 28px 16px;
  text-align: center;
  cursor: pointer;
  transition: all .25s ease;
  position: relative;
}

.p2w-zone:hover,
.p2w-zone-active {
  border-color: var(--accent-blue);
  background: var(--accent-active);
}

.p2w-zone-filled {
  border-style: solid;
  border-color: var(--accent-blue);
  background: var(--bg-secondary);
}

.p2w-hidden { display: none; }

.p2w-zone-icon {
  color: var(--text-muted);
  margin-bottom: 8px;
  transition: color .25s;
}

.p2w-zone:hover .p2w-zone-icon,
.p2w-zone-active .p2w-zone-icon {
  color: var(--accent-blue);
}

.p2w-zone-text {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.p2w-zone-hint {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-muted);
}

.p2w-panel {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg-tertiary);
}

.p2w-panel-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.p2w-label {
  min-width: 72px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.p2w-select {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-card);
  cursor: pointer;
}

.p2w-input {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 14px;
  color: var(--text-primary);
  width: 130px;
}

.p2w-hint {
  font-size: 13px;
  color: var(--text-muted);
}

.p2w-hint.error { color: var(--accent-error); }

.p2w-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.p2w-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  padding: 9px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all .2s;
}

.p2w-btn:hover:not(:disabled) {
  border-color: var(--text-muted);
  background: var(--bg-tertiary);
}

.p2w-btn-primary {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: var(--on-accent);
}

.p2w-btn-primary:hover:not(:disabled) {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
}

.p2w-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.p2w-status {
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
}

.p2w-status.ok { color: var(--accent-success); }
.p2w-status.error { color: var(--accent-error); }

.p2w-bar-wrap {
  height: 20px;
  background: var(--border-color);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.p2w-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-blue), var(--accent-blue));
  border-radius: 10px;
  transition: width .3s ease;
}

.p2w-bar-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--text-primary);
  font-weight: 600;
}

.p2w-preview {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
}

.p2w-preview-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
}

.p2w-preview-body {
  margin: 0;
  padding: 14px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 320px;
  overflow-y: auto;
  font-family: inherit;
}

.p2w-download {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}

.p2w-download .p2w-btn {
  padding: 11px 28px;
  font-size: 15px;
}
</style>
