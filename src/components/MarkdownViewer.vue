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
        <!-- 博客 HTML 模式：含独立样式 -->
        <div v-if="blogHtml" class="blog-html-wrapper" v-html="fullBlogHtml" />
        <!-- Markdown 模式：marked 渲染 + 组件 scoped 样式 -->
        <div v-else class="markdown-content" v-html="htmlContent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 全屏弹窗，支持两种内容来源：
 *   - blogHtml：博客预生成的完整 HTML，自带内联样式
 *   - mdContent：Markdown 原文，由 marked 动态渲染
 */
import { computed, ref, watch } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  mdContent?: string
  blogHtml?: string
}>()
const emit = defineEmits<{ close: [] }>()
const htmlContent = ref('')
const imageFiles = import.meta.glob('../assets/images/**/*', {
  eager: true,
  import: 'default'
}) as Record<string, string>

/** 提取 body + style，合并为一段可直接 v-html 的片段 */
const fullBlogHtml = computed(() => {
  if (!props.blogHtml) return ''
  const styleMatch = props.blogHtml.match(/<style[^>]*>([\s\S]*)<\/style>/i)
  const bodyMatch = props.blogHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  const styles = styleMatch ? `<style>${styleMatch[1]}</style>` : ''
  const body = bodyMatch ? bodyMatch[1] : props.blogHtml
  return styles + body
})

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
    if (props.blogHtml) {
      // 从 HTML 中提取纯文本（去掉标签）
      const tmp = document.createElement('div')
      tmp.innerHTML = props.blogHtml
      const text = tmp.textContent || tmp.innerText || ''
      await navigator.clipboard.writeText(text)
    } else {
      const textContent = (props.mdContent ?? '').replace(/^---[\s\S]*?---\s*/, '')
      await navigator.clipboard.writeText(textContent)
    }
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
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
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

<style>
/** 博客 HTML 独立样式：作用于 v-html 注入的内容 */
.blog-html-wrapper {
  color: #1f2328;
}
</style>
