<template>
  <div class="b64f">
    <h3 class="b64f-title">文件转Base64</h3>

    <div class="b64f-guide" role="note" aria-label="工具简介">
      <p class="b64f-guide-head">工具简介：</p>
      <p class="b64f-guide-text">
        文件转Base64工具可将任意文件编码为Base64字符串（data:前缀），便于在网页、API请求或配置文件中内嵌使用。
        支持图片、文档、压缩包、字体等常见格式，单个文件请勿超过 10 MB。
      </p>
    </div>

    <p class="b64f-label">请选择一个要转换为Base64的文件。</p>

    <div
      class="b64f-dropzone"
      :class="{ active: isDragging }"
      @click="triggerFileInput"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInputRef"
        type="file"
        class="b64f-file-input"
        :accept="acceptSpec"
        @change="onFileChange"
      />
      <p v-if="!selectedFile" class="b64f-dropzone-hint">
        拖拽文件到此处，或<span class="b64f-dropzone-link">点击选择文件</span>
      </p>
      <div v-else class="b64f-file-info">
        <span class="b64f-file-icon">&#128196;</span>
        <span class="b64f-file-name" :title="selectedFile.name">{{ selectedFile.name }}</span>
        <span class="b64f-file-size">{{ fileSizeLabel }}</span>
        <button type="button" class="b64f-file-clear" title="移除文件" @click.stop="clearFile">&times;</button>
      </div>
    </div>

    <div class="b64f-actions">
      <button type="button" class="b64f-btn primary" :disabled="!canRun" @click="convert">文件转Base64</button>
      <button type="button" class="b64f-btn" :disabled="!selectedFile" @click="clearAll">清空</button>
    </div>

    <p class="b64f-status" :class="{ ok: statusKind === 'ok', error: statusKind === 'error' }">
      {{ statusText }}
    </p>

    <div v-if="outputText" class="b64f-output-section">
      <div class="b64f-output-header">
        <span class="b64f-output-label">Base64 结果</span>
        <button type="button" class="b64f-copy-btn" :class="{ copied: copied }" @click="copyOutput">
          {{ copied ? '&#10003; 已复制' : '复制结果' }}
        </button>
      </div>
      <textarea
        class="b64f-output"
        readonly
        spellcheck="false"
        :value="outputText"
        rows="6"
      />
      <p v-if="outputText" class="b64f-output-size">共 {{ outputLength }} 个字符</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type StatusKind = 'idle' | 'ok' | 'error'

const MAX_SIZE = 10 * 1024 * 1024

const ACCEPT_TYPES: { label: string; spec: string }[] = [
  { label: '图片', spec: '.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.ico' },
  { label: '文档', spec: '.pdf,.txt,.json,.xml,.csv,.html,.htm,.md,.docx,.xlsx,.pptx' },
  { label: '压缩包', spec: '.zip' },
  { label: '字体', spec: '.ttf,.woff,.woff2' },
  { label: '所有文件', spec: '*.*' }
]

const acceptSpec = computed(() => ACCEPT_TYPES.map(t => t.spec).join(','))

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const statusKind = ref<StatusKind>('idle')
const statusText = ref('等待选择文件')
const outputText = ref('')
const copied = ref(false)

const canRun = computed(() => Boolean(selectedFile.value))

const bytesToSize = (n: number) => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

const fileSizeLabel = computed(() => {
  return selectedFile.value ? bytesToSize(selectedFile.value.size) : ''
})

const outputLength = computed(() => outputText.value.length.toLocaleString('zh-CN'))

const dragCounter = ref(0)

const onDragEnter = () => {
  dragCounter.value++
  isDragging.value = true
}

const onDragLeave = () => {
  dragCounter.value--
  if (dragCounter.value <= 0) {
    dragCounter.value = 0
    isDragging.value = false
  }
}

const onDrop = (e: DragEvent) => {
  dragCounter.value = 0
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    setFile(files[0])
  }
}

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (files && files.length > 0) {
    setFile(files[0])
  }
}

const setFile = (file: File) => {
  if (file.size > MAX_SIZE) {
    statusKind.value = 'error'
    statusText.value = `文件过大：${bytesToSize(file.size)}，请选择 10 MB 以内的文件`
    selectedFile.value = null
    outputText.value = ''
    return
  }
  selectedFile.value = file
  statusKind.value = 'idle'
  statusText.value = `已选择 ${file.name}（${bytesToSize(file.size)}），点击“文件转Base64”开始转换`
  outputText.value = ''
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const clearFile = () => {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const clearAll = () => {
  clearFile()
  statusKind.value = 'idle'
  statusText.value = '等待选择文件'
  outputText.value = ''
}

const convert = () => {
  if (!selectedFile.value) return
  try {
    const reader = new FileReader()
    reader.onload = () => {
      outputText.value = String(reader.result || '')
      statusKind.value = 'ok'
      statusText.value = '转换成功'
    }
    reader.onerror = () => {
      statusKind.value = 'error'
      statusText.value = '转换失败：无法读取文件'
    }
    reader.readAsDataURL(selectedFile.value)
  } catch {
    statusKind.value = 'error'
    statusText.value = '转换失败，请重试'
  }
}

const copyOutput = async () => {
  if (!outputText.value) return
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(outputText.value)
    } else {
      const ta = document.createElement('textarea')
      ta.value = outputText.value
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    statusKind.value = 'error'
    statusText.value = '复制失败，请手动选择并复制'
  }
}
</script>

<style scoped>
.b64f {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.b64f-title {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
  color: var(--accent-blue);
  font-weight: 500;
}

.b64f-guide {
  border-top: 1px solid var(--border-color);
  padding-top: 10px;
}

.b64f-guide-head {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.b64f-guide-text {
  margin: 0;
  font-size: 17px;
  line-height: 1.55;
  color: var(--text-primary);
}

.b64f-label {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.b64f-dropzone {
  position: relative;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.b64f-dropzone:hover,
.b64f-dropzone.active {
  border-color: var(--accent-blue);
  background-color: var(--accent-active);
}

.b64f-dropzone.active {
  background-color: var(--accent-active);
}

.b64f-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.b64f-dropzone-hint {
  margin: 0;
  font-size: 15px;
  color: var(--text-muted);
}

.b64f-dropzone-link {
  color: var(--accent-blue);
  text-decoration: underline;
}

.b64f-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-primary);
  max-width: 100%;
  overflow: hidden;
}

.b64f-file-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.b64f-file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.b64f-file-size {
  color: var(--text-muted);
  font-size: 12px;
  flex-shrink: 0;
}

.b64f-file-clear {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  flex-shrink: 0;
}

.b64f-file-clear:hover {
  color: var(--accent-error);
}

.b64f-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.b64f-btn {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  padding: 10px 18px;
  font-size: 15px;
  cursor: pointer;
}

.b64f-btn.primary {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: var(--bg-card);
}

.b64f-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.b64f-status {
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
}

.b64f-status.ok {
  color: var(--accent-success);
}

.b64f-status.error {
  color: var(--accent-error);
}

.b64f-output-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.b64f-output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.b64f-output-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.b64f-copy-btn {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-card);
  color: var(--text-primary);
  padding: 4px 12px;
  font-size: 13px;
  cursor: pointer;
}

.b64f-copy-btn:hover {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.b64f-copy-btn.copied {
  border-color: var(--accent-success);
  color: var(--accent-success);
}

.b64f-output {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-sizing: border-box;
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: var(--bg-tertiary);
  word-break: break-all;
}

.b64f-output-size {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
