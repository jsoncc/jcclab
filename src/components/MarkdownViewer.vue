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
import { configureMarked } from '../utils/markedConfig'

configureMarked()

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

/** 根据 HTML 注释标记为 blockquote 添加类型 class */
const addBlockquoteClasses = (html: string): string => {
  // 匹配 HTML 注释 + 后面的 blockquote
  return html.replace(
    /<!-- (warning|success|highlight)-start -->\s*\n?\s*<blockquote>/g,
    '<blockquote class="$1">'
  )
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
  
  let rendered = String(marked.parse(mdText))

  // 移除 HTML 注释标记（已不需要，class 已添加）
  rendered = rendered.replace(/<!-- (?:warning|success|highlight)-(?:start|end) -->\s*/g, '')

  // 为包含 ⚠️ 或 ✅ 的 blockquote 添加类型 class（兼容嵌套）
  rendered = rendered.replace(
    /<blockquote>\s*<p>⚠️/g,
    '<blockquote class="warning"><p>⚠️'
  )
  rendered = rendered.replace(
    /<blockquote>\s*<p>✅/g,
    '<blockquote class="success"><p>✅'
  )

  htmlContent.value = rendered
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
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.markdown-modal {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15);
  max-width: 1400px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.modal-title {
  margin: 0;
  font-size: 22px;
  color: #1e293b;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.header-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.copy-all-btn {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.3);
}

.copy-all-btn:hover {
  background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
}

.copy-all-btn:active {
  transform: translateY(0);
}

.close-btn {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  font-size: 22px;
  color: #64748b;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
  transform: rotate(90deg);
}

.modal-body {
  padding: 32px 40px;
  overflow-y: auto;
  flex: 1;
  background: #ffffff;
}

.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.markdown-content {
  line-height: 1.85;
  color: #334155;
  font-size: 16px;
}

.markdown-content h1 {
  margin: 0 0 24px 0;
  font-size: 32px;
  color: #0f172a;
  border-bottom: 3px solid #e2e8f0;
  padding-bottom: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.markdown-content h2 {
  margin: 32px 0 16px;
  font-size: 24px;
  color: #1e293b;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 10px;
  font-weight: 700;
}

.markdown-content h3 {
  margin: 28px 0 14px;
  font-size: 20px;
  color: #334155;
  font-weight: 600;
}

.markdown-content h4 {
  margin: 24px 0 12px;
  font-size: 17px;
  color: #475569;
  font-weight: 600;
}

.markdown-content p {
  margin: 16px 0;
  line-height: 1.9;
}

.markdown-content ul,
.markdown-content ol {
  padding-left: 2em;
  margin: 16px 0;
}

.markdown-content li {
  margin: 10px 0;
  line-height: 1.8;
}

.markdown-content blockquote {
  margin: 20px 0;
  padding: 16px 20px;
  border-left: 4px solid #0284c7;
  background: #f0f9ff;
  border-radius: 0 8px 8px 0;
  color: #475569;
}

.markdown-content blockquote.warning {
  border-left-color: #f59e0b;
  background: #fef3c7;
}

.markdown-content blockquote.success {
  border-left-color: #10b981;
  background: #d1fae5;
}

.markdown-content blockquote p:first-child {
  margin-top: 0;
}

.markdown-content blockquote p:last-child {
  margin-bottom: 0;
}

.markdown-content code {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
  padding: 3px 8px;
  background: #f1f5f9;
  border-radius: 6px;
  color: #0369a1;
  border: 1px solid #e2e8f0;
}

.markdown-content pre {
  margin: 20px 0;
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow-x: auto;
  line-height: 1.6;
}

.markdown-content pre code {
  padding: 0;
  background: none;
  border: none;
  color: #1e293b;
  font-size: 14px;
}

.markdown-content table {
  width: 100%;
  margin: 20px 0;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
}

.markdown-content th {
  background: #f8fafc;
  font-weight: 600;
  text-align: left;
  padding: 12px 16px;
  border-bottom: 2px solid #e2e8f0;
  color: #1e293b;
}

.markdown-content td {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
}

.markdown-content tr:last-child td {
  border-bottom: none;
}

.markdown-content tr:nth-child(even) {
  background: #f8fafc;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin: 20px 0;
}

.markdown-content hr {
  margin: 32px 0;
  border: none;
  border-top: 2px solid #e5e7eb;
}

.markdown-content a {
  color: #0284c7;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.markdown-content a:hover {
  border-bottom-color: #0284c7;
}

.markdown-content .annotation-ref {
  color: #0284c7;
  font-weight: bold;
  cursor: help;
  position: relative;
  border-bottom: 1px dashed #0284c7;
}

.markdown-content .annotation-ref:hover::after {
  content: attr(data-note);
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  background: #1e293b;
  color: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: normal;
  width: 320px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.markdown-content .annotation-ref:hover::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%) translateY(100%);
  border: 8px solid transparent;
  border-top-color: #1e293b;
}
</style>

<style>
/** 博客 HTML 独立样式：作用于 v-html 注入的内容 
 * 基于 theme-factory 的 Modern Minimalist 和 Ocean Depths 主题
 */
.blog-html-wrapper {
  color: #334155;
  font-size: 16px;
  line-height: 1.85;
}

.blog-html-wrapper h1,
.blog-html-wrapper h2,
.blog-html-wrapper h3,
.blog-html-wrapper h4 {
  margin-top: 28px;
  margin-bottom: 14px;
  font-weight: 700;
  color: #0f172a;
}

.blog-html-wrapper p {
  margin: 16px 0;
  line-height: 1.9;
}

.blog-html-wrapper img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin: 20px 0;
}

.blog-html-wrapper pre {
  background: #f8fafc;
  color: #1e293b;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
  margin: 20px 0;
}

.blog-html-wrapper code {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.9em;
}

.blog-html-wrapper blockquote {
  margin: 20px 0;
  padding: 16px 20px;
  border-left: 4px solid #0284c7;
  background: #f0f9ff;
  border-radius: 0 8px 8px 0;
  color: #475569;
}
</style>
