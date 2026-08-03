<template>
  <div class="p2i">
    <h3 class="p2i-title">PDF转图片工具</h3>

    <div class="p2i-guide" role="note" aria-label="工具简介">
      <p class="p2i-guide-head">工具简介：</p>
      <p class="p2i-guide-text">
        将 PDF 文件的每一页转换为 PNG 或 JPEG 图片，支持逐页输出或竖向合并为长图，可自定义分辨率、页码范围，逐页下载或打包为 ZIP。
      </p>
    </div>

    <div
      class="p2i-dropzone"
      :class="{ 'p2i-dropzone-active': dragging, 'p2i-dropzone-filled': !!pdfFile }"
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
      <input
        ref="fileInputRef"
        type="file"
        accept=".pdf,application/pdf"
        class="p2i-file-input"
        @change="onFileSelected"
      />
      <template v-if="!pdfFile">
        <p class="p2i-dropzone-text">点击或拖拽 PDF 文件到此处</p>
      </template>
      <template v-else>
        <p class="p2i-dropzone-text">{{ pdfFile.name }}</p>
        <p class="p2i-dropzone-meta">{{ pdfPageCount }} 页</p>
      </template>
    </div>

    <div v-if="pdfFile" class="p2i-settings">
      <div class="p2i-setting-row">
        <label class="p2i-label">输出格式</label>
        <select v-model="outputFormat" class="p2i-select">
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
        </select>
      </div>
      <div v-if="outputFormat === 'jpeg'" class="p2i-setting-row">
        <label class="p2i-label">JPEG 质量</label>
        <div class="p2i-range-wrap">
          <input type="range" v-model.number="jpegQuality" min="10" max="100" class="p2i-range" />
          <span class="p2i-range-value">{{ jpegQuality }}%</span>
        </div>
      </div>
      <div class="p2i-setting-row">
        <label class="p2i-label">清晰度</label>
        <select v-model="scale" class="p2i-select">
          <option :value="1">常规的</option>
          <option :value="4">高清（4倍）</option>
        </select>
      </div>
      <div class="p2i-setting-row">
        <label class="p2i-label">输出模式 <span class="p2i-label-hint">「长图」将所选页竖向合并为一张长图片</span></label>
        <select v-model="outputMode" class="p2i-select">
          <option value="single">单页（逐页输出）</option>
          <option value="long">长图（竖向拼接）</option>
        </select>
      </div>
      <div class="p2i-setting-row">
        <label class="p2i-label">页码 <span class="p2i-label-hint">选择要转换的页，选「自定义」可指定范围如 1,3,5-8</span></label>
        <select v-model="pageRangeMode" class="p2i-select">
          <option value="all">全部</option>
          <option value="custom">自定义</option>
        </select>
        <input
          v-if="pageRangeMode === 'custom'"
          v-model="pageRangeInput"
          placeholder="如 1,3,5-8"
          class="p2i-input"
        />
        <span v-if="pageRangeMode === 'custom' && computedPages.length > 0" class="p2i-setting-hint">
          共 {{ computedPages.length }} 页
        </span>
        <span v-else-if="pageRangeMode === 'custom' && pageRangeInput && computedPages.length === 0" class="p2i-setting-hint error">
          无效页码
        </span>
      </div>
    </div>

    <div v-if="pdfFile" class="p2i-actions">
      <button
        type="button"
        class="p2i-btn primary"
        :disabled="!canConvert || converting"
        @click="startConvert"
      >
        {{ converting ? '转换中…' : '开始转换' }}
      </button>
      <button type="button" class="p2i-btn" :disabled="converting" @click="clearAll">清空</button>
    </div>

    <p class="p2i-status" :class="{ ok: statusKind === 'ok', error: statusKind === 'error' }">
      {{ statusText }}
    </p>

    <div v-if="converting" class="p2i-progress-bar-wrap">
      <div class="p2i-progress-bar" :style="{ width: progressPercent + '%' }"></div>
      <span class="p2i-progress-text">{{ progressPercent }}%</span>
    </div>

    <div v-if="outputMode === 'single' && pages.length > 0" class="p2i-results">
      <div v-for="(page, idx) in pages" :key="idx" class="p2i-page-card">
        <img :src="page.dataUrl" :alt="'第' + page.pageNum + '页'" class="p2i-page-img" loading="lazy" />
        <div class="p2i-page-info">
          <span>第 {{ page.pageNum }} 页</span>
          <span>{{ page.width }}x{{ page.height }}</span>
          <span>{{ page.sizeLabel }}</span>
        </div>
        <button type="button" class="p2i-btn small" @click="downloadOne(page)">下载</button>
      </div>
    </div>

    <div v-if="outputMode === 'single' && pages.length > 1" class="p2i-download-all">
      <button type="button" class="p2i-btn primary" @click="downloadAll">
        下载全部 (ZIP)
      </button>
    </div>

    <div v-if="outputMode === 'long' && longImageBlob" class="p2i-long-result">
      <img :src="longImageDataUrl" alt="长图" class="p2i-long-img" />
      <div class="p2i-page-info">
        <span>{{ longImageWidth }}x{{ longImageHeight }}</span>
        <span>{{ longImageSizeLabel }}</span>
      </div>
      <button type="button" class="p2i-btn primary" @click="downloadLongImage">下载长图</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import JSZip from 'jszip'

pdfjsLib.GlobalWorkerOptions.workerSrc = '//unpkg.com/pdfjs-dist@4.9.155/build/pdf.worker.min.mjs'

type StatusKind = 'idle' | 'ok' | 'error'

interface PageResult {
  pageNum: number
  dataUrl: string
  blob: Blob
  sizeLabel: string
  width: number
  height: number
}

const fileInputRef = ref<HTMLInputElement | null>(null)
const pdfFile = ref<File | null>(null)
const pdfPageCount = ref(0)
const dragging = ref(false)
const outputFormat = ref<'png' | 'jpeg'>('png')
const outputMode = ref<'single' | 'long'>('single')
const jpegQuality = ref(90)
const scale = ref(4)
const pageRangeMode = ref<'all' | 'custom'>('all')
const pageRangeInput = ref('')
const converting = ref(false)
const statusKind = ref<StatusKind>('idle')
const statusText = ref('请选择 PDF 文件')
const progressPercent = ref(0)
const pages = ref<PageResult[]>([])
const pdfReady = ref(false)
const longImageDataUrl = ref('')
const longImageBlob = ref<Blob | null>(null)
const longImageSizeLabel = ref('')
const longImageWidth = ref(0)
const longImageHeight = ref(0)

let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null
let dragCounter = 0

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

const canConvert = computed(() => {
  if (!pdfReady.value || converting.value) return false
  if (pageRangeMode.value === 'custom' && computedPages.value.length === 0) return false
  return true
})

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const onDragEnter = () => {
  dragCounter++
  dragging.value = true
}

const onDragOver = () => {
  dragging.value = true
}

const onDragLeave = () => {
  dragCounter--
  if (dragCounter <= 0) {
    dragCounter = 0
    dragging.value = false
  }
}

const onDrop = (e: DragEvent) => {
  dragCounter = 0
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type === 'application/pdf') {
    loadPdf(file)
  } else {
    statusKind.value = 'error'
    statusText.value = '请拖入 PDF 文件'
  }
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
    pages.value = []
    progressPercent.value = 0
    pdfDoc?.destroy()
    pdfDoc = null

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    pdfDoc = await loadingTask.promise
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

const getExt = () => (outputFormat.value === 'jpeg' ? 'jpg' : 'png')

const formatSize = (n: number) => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

const pagesToRender = computed(() => {
  if (!pdfPageCount.value) return []
  if (pageRangeMode.value === 'all') {
    return Array.from({ length: pdfPageCount.value }, (_, i) => i + 1)
  }
  return computedPages.value
})

const startConvert = async () => {
  if (!pdfDoc) return
  converting.value = true
  statusKind.value = 'idle'
  statusText.value = '准备转换…'
  pages.value = []
  longImageBlob.value = null
  longImageDataUrl.value = ''
  progressPercent.value = 0

  const pageNums = pagesToRender.value
  const total = pageNums.length
  const mimeType = outputFormat.value === 'jpeg' ? 'image/jpeg' : 'image/png'
  const quality = outputFormat.value === 'jpeg' ? jpegQuality.value / 100 : undefined

  try {
    if (outputMode.value === 'long') {
      const pageObjs = await Promise.all(pageNums.map((n) => pdfDoc!.getPage(n)))
      const viewports = pageObjs.map((p) => p.getViewport({ scale: scale.value }))
      const maxWidth = Math.max(...viewports.map((v) => v.width))
      const totalHeight = viewports.reduce((sum, v) => sum + v.height, 0)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = Math.ceil(maxWidth)
      canvas.height = Math.ceil(totalHeight)

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      let yOffset = 0
      for (let i = 0; i < total; i++) {
        const pageObj = pageObjs[i]
        const viewport = viewports[i]
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = Math.ceil(viewport.width)
        pageCanvas.height = Math.ceil(viewport.height)
        const pageCtx = pageCanvas.getContext('2d')!
        await pageObj.render({ canvasContext: pageCtx, viewport }).promise
        pageObj.cleanup()

        const xOffset = (canvas.width - pageCanvas.width) / 2
        ctx.drawImage(pageCanvas, xOffset, yOffset)
        yOffset += Math.ceil(viewport.height)

        progressPercent.value = Math.round(((i + 1) / total) * 100)
        statusText.value = `转换中… ${i + 1}/${total}`
      }

      const dataUrl = canvas.toDataURL(mimeType, quality)
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), mimeType, quality)
      })

      longImageDataUrl.value = dataUrl
      longImageBlob.value = blob
      longImageSizeLabel.value = formatSize(blob.size)
      longImageWidth.value = canvas.width
      longImageHeight.value = canvas.height
    } else {
      const results: PageResult[] = []

      for (let i = 0; i < total; i++) {
        const pageNum = pageNums[i]
        const page = await pdfDoc.getPage(pageNum)
        const viewport = page.getViewport({ scale: scale.value })
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({ canvasContext: ctx, viewport }).promise
        page.cleanup()

        const dataUrl = canvas.toDataURL(mimeType, quality)
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), mimeType, quality)
        })

        results.push({
          pageNum,
          dataUrl,
          blob,
          sizeLabel: formatSize(blob.size),
          width: viewport.width,
          height: viewport.height,
        })

        progressPercent.value = Math.round(((i + 1) / total) * 100)
        statusText.value = `转换中… ${i + 1}/${total}`
      }

      pages.value = results
    }

    statusKind.value = 'ok'
    statusText.value = `转换完成，共 ${total} 页`
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
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadOne = (page: PageResult) => {
  const baseName = pdfFile.value
    ? pdfFile.value.name.replace(/\.pdf$/i, '')
    : 'pdf_export'
  downloadBlob(page.blob, `${baseName}_第${page.pageNum}页.${getExt()}`)
}

const downloadAll = async () => {
  const zip = new JSZip()
  const baseName = pdfFile.value
    ? pdfFile.value.name.replace(/\.pdf$/i, '')
    : 'pdf_export'

  for (const page of pages.value) {
    zip.file(`${baseName}_第${page.pageNum}页.${getExt()}`, page.blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, `${baseName}.zip`)
}

const downloadLongImage = () => {
  if (!longImageBlob.value) return
  const baseName = pdfFile.value
    ? pdfFile.value.name.replace(/\.pdf$/i, '')
    : 'pdf_export'
  downloadBlob(longImageBlob.value, `${baseName}_长图.${getExt()}`)
}

const clearAll = () => {
  pdfFile.value = null
  pdfPageCount.value = 0
  pdfReady.value = false
  pdfDoc?.destroy()
  pdfDoc = null
  pages.value = []
  longImageBlob.value = null
  longImageDataUrl.value = ''
  statusKind.value = 'idle'
  statusText.value = '请选择 PDF 文件'
  progressPercent.value = 0
  if (fileInputRef.value) fileInputRef.value.value = ''
}
</script>

<style scoped>
.p2i {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.p2i-title {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
  color: var(--accent-blue);
  font-weight: 500;
}

.p2i-guide {
  border-top: 1px solid var(--border-color);
  padding-top: 10px;
}

.p2i-guide-head {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.p2i-guide-text {
  margin: 0;
  font-size: 17px;
  line-height: 1.55;
  color: var(--text-primary);
}

.p2i-dropzone {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 32px 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
  position: relative;
}

.p2i-dropzone:hover,
.p2i-dropzone-active {
  border-color: var(--accent-blue);
  background-color: var(--accent-active);
}

.p2i-dropzone-filled {
  border-style: solid;
  border-color: var(--accent-blue);
  background-color: var(--bg-tertiary);
}

.p2i-file-input {
  display: none;
}

.p2i-dropzone-text {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.p2i-dropzone-meta {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--text-muted);
}

.p2i-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
}

.p2i-setting-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.p2i-label {
  min-width: 80px;
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

.p2i-label-hint {
  font-weight: 400;
  font-size: 13px;
  color: var(--text-muted);
}

.p2i-select {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-card);
  cursor: pointer;
}

.p2i-input {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 14px;
  color: var(--text-primary);
  width: 140px;
}

.p2i-range-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.p2i-range {
  width: 120px;
  cursor: pointer;
}

.p2i-range-value {
  font-size: 14px;
  color: var(--text-muted);
  min-width: 36px;
}

.p2i-setting-hint {
  font-size: 13px;
  color: var(--text-muted);
}

.p2i-setting-hint.error {
  color: var(--accent-error);
}

.p2i-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.p2i-btn {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  padding: 10px 18px;
  font-size: 15px;
  cursor: pointer;
}

.p2i-btn.primary {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: var(--on-accent);
}

.p2i-btn.small {
  padding: 6px 14px;
  font-size: 14px;
}

.p2i-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.p2i-status {
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
}

.p2i-status.ok {
  color: var(--accent-success);
}

.p2i-status.error {
  color: var(--accent-error);
}

.p2i-progress-bar-wrap {
  height: 20px;
  background: var(--border-color);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.p2i-progress-bar {
  height: 100%;
  background: var(--accent-blue);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.p2i-progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 600;
}

.p2i-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.p2i-page-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
}

.p2i-page-img {
  width: 100%;
  display: block;
  border-bottom: 1px solid var(--border-color);
}

.p2i-page-info {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--text-muted);
}

.p2i-page-card .p2i-btn {
  margin: 0 10px 10px;
  align-self: flex-start;
}

.p2i-download-all {
  margin-top: 4px;
}

.p2i-long-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  background: var(--bg-card);
}

.p2i-long-img {
  max-width: 100%;
  display: block;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}
</style>
