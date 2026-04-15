<template>
  <div class="b64f">
    <h3 class="b64f-title">在线Base64转文件工具</h3>

    <div class="b64f-guide" role="note" aria-label="工具简介">
      <p class="b64f-guide-head">工具简介：</p>
      <p class="b64f-guide-text">
        Base64转文件工具可将Base64编码恢复为原始文件，支持自动识别常见文件类型（如 PDF/PNG/JPG/TXT）。
        你只需粘贴Base64内容，点击“Base64转文件”即可下载。
      </p>
    </div>

    <p class="b64f-label">请输入要进行转文件的Base64字符串。</p>
    <textarea
      v-model="inputText"
      class="b64f-input"
      spellcheck="false"
      placeholder="在此输入 Base64 字符串（支持 data: 前缀）…"
      rows="8"
    />

    <div class="b64f-actions">
      <button type="button" class="b64f-btn primary" :disabled="!canRun" @click="convertToFile">Base64转文件</button>
      <button type="button" class="b64f-btn" :disabled="!inputText" @click="clearAll">清空</button>
      <button type="button" class="b64f-link-btn" @click="fillExamplePdf">查看示例</button>
    </div>

    <p class="b64f-status" :class="{ ok: statusKind === 'ok', error: statusKind === 'error' }">
      {{ statusText }}
    </p>

    <div v-if="lastFileInfo" class="b64f-info">
      <span>识别类型：{{ lastFileInfo.mime }}</span>
      <span>建议后缀：.{{ lastFileInfo.ext }}</span>
      <span>大小：{{ lastFileInfo.sizeLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type StatusKind = 'idle' | 'ok' | 'error'

interface FileInfo {
  mime: string
  ext: string
  sizeLabel: string
}

const inputText = ref('')
const statusKind = ref<StatusKind>('idle')
const statusText = ref('等待转换')
const lastFileInfo = ref<FileInfo | null>(null)

const canRun = computed(() => Boolean(inputText.value.trim()))

const MIME_EXT_MAP: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'text/plain': 'txt',
  'application/json': 'json',
  'application/zip': 'zip'
}

const bytesToSize = (n: number) => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

const toUint8Array = (base64: string) => {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const parseInput = (raw: string) => {
  const text = String(raw || '').trim()
  const m = text.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.*)$/is)
  if (m) {
    return {
      mimeFromPrefix: (m[1] || '').toLowerCase() || '',
      payload: (m[2] || '').replace(/\s+/g, '')
    }
  }
  return { mimeFromPrefix: '', payload: text.replace(/\s+/g, '') }
}

const inferFromMagic = (bytes: Uint8Array): { mime: string; ext: string } => {
  const has = (arr: number[]) => arr.every((v, i) => bytes[i] === v)
  if (bytes.length >= 4 && has([0x25, 0x50, 0x44, 0x46])) return { mime: 'application/pdf', ext: 'pdf' }
  if (bytes.length >= 8 && has([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: 'image/png', ext: 'png' }
  }
  if (bytes.length >= 3 && has([0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg' }
  if (bytes.length >= 4 && has([0x47, 0x49, 0x46, 0x38])) return { mime: 'image/gif', ext: 'gif' }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' }
  }
  if (bytes.length >= 2 && has([0x50, 0x4b])) return { mime: 'application/zip', ext: 'zip' }
  return { mime: 'application/octet-stream', ext: 'bin' }
}

const pickType = (mimeFromPrefix: string, bytes: Uint8Array) => {
  if (mimeFromPrefix) {
    return { mime: mimeFromPrefix, ext: MIME_EXT_MAP[mimeFromPrefix] || 'bin' }
  }
  const inferred = inferFromMagic(bytes)
  if (inferred.ext !== 'bin') return inferred
  return inferred
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

const convertToFile = () => {
  try {
    const parsed = parseInput(inputText.value)
    const payload = parsed.payload.replace(/-/g, '+').replace(/_/g, '/')
    const mod = payload.length % 4
    const normalized = mod > 0 ? `${payload}${'='.repeat(4 - mod)}` : payload
    const bytes = toUint8Array(normalized)
    const detected = pickType(parsed.mimeFromPrefix, bytes)
    const blob = new Blob([bytes], { type: detected.mime || 'application/octet-stream' })
    const filename = `jsoncc-export-${Date.now()}.${detected.ext}`
    downloadBlob(blob, filename)

    lastFileInfo.value = {
      mime: detected.mime,
      ext: detected.ext,
      sizeLabel: bytesToSize(bytes.byteLength)
    }
    statusKind.value = 'ok'
    statusText.value = `转换成功，已下载 ${filename}`
  } catch {
    statusKind.value = 'error'
    statusText.value = '转换失败：请输入有效的 Base64 内容'
    lastFileInfo.value = null
  }
}

const clearAll = () => {
  inputText.value = ''
  statusKind.value = 'idle'
  statusText.value = '等待转换'
  lastFileInfo.value = null
}

// 该示例 PDF 只展示一个网址：https://jsoncc.github.io/jcclab/
const fillExamplePdf = () => {
  inputText.value =
    'JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUgODQyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA0IDAgUiA+PiA+PiAvQ29udGVudHMgNSAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iago1IDAgb2JqCjw8IC9MZW5ndGggNjQgPj4Kc3RyZWFtCkJUCi9GMSAyMCBUZgo3MiA3NjAgVGQKKGh0dHBzOi8vanNvbmNjLmdpdGh1Yi5pby9qY2NsYWIvKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI0MSAwMDAwMCBuIAowMDAwMDAwMzExIDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNDI0CiUlRU9GCg=='
  statusKind.value = 'idle'
  statusText.value = '示例已填充，点击“Base64转文件”下载 PDF'
  lastFileInfo.value = null
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
  color: #1677ff;
  font-weight: 500;
}

.b64f-guide {
  border-top: 1px solid #e5e7eb;
  padding-top: 10px;
}

.b64f-guide-head {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.b64f-guide-text {
  margin: 0;
  font-size: 17px;
  line-height: 1.55;
  color: #1f2937;
}

.b64f-label {
  margin: 0;
  font-size: 16px;
  color: #1f2937;
}

.b64f-input {
  width: 100%;
  min-height: 220px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-sizing: border-box;
  padding: 12px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.b64f-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.b64f-btn {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  padding: 10px 18px;
  font-size: 15px;
  cursor: pointer;
}

.b64f-btn.primary {
  background: #1677ff;
  border-color: #1677ff;
  color: #fff;
}

.b64f-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.b64f-link-btn {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 15px;
  cursor: pointer;
  padding: 0 4px;
}

.b64f-link-btn:hover {
  text-decoration: underline;
}

.b64f-status {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.b64f-status.ok {
  color: #16a34a;
}

.b64f-status.error {
  color: #dc2626;
}

.b64f-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  font-size: 13px;
  color: #374151;
}
</style>
