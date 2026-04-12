<template>
  <div class="markdown-modal-overlay" @click.self="closeModal">
    <div class="markdown-modal">
      <div class="modal-header">
        <h3 class="modal-title">详情</h3>
        <div class="header-buttons">
          <button class="copy-all-btn" @click="copyAllContent">复制</button>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
      </div>
      <div class="modal-body">
        <div class="markdown-content" v-html="htmlContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 全屏弹窗：把 Markdown 渲染成 HTML；支持把 md 里 images/ 相对路径换成 Vite 打包后的资源 URL。
 */
import { ref, watch } from 'vue'
import { marked } from 'marked'

const props = defineProps<{ mdContent?: string }>()
const emit = defineEmits<{ close: [] }>()
const htmlContent = ref('')
const imageFiles = import.meta.glob('../assets/images/**/*', {
  eager: true,
  import: 'default'
}) as Record<string, string>

/** 外链、data:、# 保持原样；仅处理 images/ 开头的相对路径 */
const resolveMarkdownImage = (rawUrl: string) => {
  const url = String(rawUrl || '').trim()
  if (!url) return url
  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('#')) {
    return url
  }

  const withoutPrefix = url.replace(/^\.\//, '').replace(/^\.\.\//, '')
  if (!withoutPrefix.startsWith('images/')) {
    return url
  }

  const key = `../assets/${withoutPrefix}`
  return imageFiles[key] || url
}

const closeModal = () => {
  emit('close')
}

const copyAllContent = async () => {
  try {
    const textContent = (props.mdContent ?? '').replace(/^---[\s\S]*?---\s*/, '')
    await navigator.clipboard.writeText(textContent)
    alert('内容已复制到剪贴板')
  } catch {
    alert('复制失败，请手动复制')
  }
}

const processMarkdown = () => {
  if (!props.mdContent) {
    htmlContent.value = ''
    return
  }
  
  let mdText = props.mdContent.replace(/^---[\s\S]*?---\s*/, '')

  mdText = mdText.replace(/!\[([^\]]*)\]\((<[^>]+>|[^)]+)\)/g, (_m, alt: string, rawUrl: string) => {
    const normalizedUrl = String(rawUrl || '').trim().replace(/^<|>$/g, '')
    const resolved = resolveMarkdownImage(normalizedUrl)
    return `![${alt}](${resolved})`
  })
  
  htmlContent.value = String(marked.parse(mdText))
}

watch(() => props.mdContent, () => {
  processMarkdown()
}, { immediate: true })
</script>

<style scoped>
.markdown-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.markdown-modal {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 900px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  color: #1f2937;
  font-weight: 600;
}

.header-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.copy-all-btn {
  background: #0969da;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-all-btn:hover {
  background: #0954b3;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.markdown-content {
  line-height: 1.8;
  color: #333;
}

.markdown-content h1 {
  margin: 0 0 20px 0;
  font-size: 28px;
  color: #1f2937;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 12px;
}

.markdown-content h2 {
  margin: 24px 0 12px;
  font-size: 20px;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

.markdown-content ul {
  padding-left: 2em;
  margin: 12px 0;
}

.markdown-content li {
  margin: 8px 0;
}

.markdown-content p {
  margin: 12px 0;
}
</style>
