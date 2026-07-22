<template>
  <div class="blog-post-page">
    <div class="blog-post-header">
      <button class="back-btn" @click="goBack">
        <Icon :icon="arrowLeftIcon" class="back-icon" />
        返回博客列表
      </button>
      <button class="copy-btn" @click="copyContent">复制全文</button>
    </div>
    <article v-if="htmlContent" class="markdown-content" v-html="htmlContent" />
    <div v-else class="blog-not-found">
      <h2>文章未找到</h2>
      <p>抱歉，请求的博客文章不存在或已被移除。</p>
      <button class="back-btn" @click="goBack">返回博客列表</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import arrowLeftIcon from '@iconify-icons/radix-icons/arrow-left'
import { useBlogData } from '../composables/useBlogData'

const route = useRoute()
const router = useRouter()
const { getBlogMdContent, renderMarkdown } = useBlogData()
const htmlContent = ref('')
const blogName = computed(() => (route.params.name as string) || '')

const imageFiles = import.meta.glob('../assets/images/**/*', {
  eager: true,
  import: 'default'
}) as Record<string, string>

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

const processMarkdown = () => {
  const mdText = getBlogMdContent(decodeURIComponent(blogName.value))
  if (!mdText) {
    htmlContent.value = ''
    return
  }
  let cleaned = mdText.replace(/^---[\s\S]*?---\s*/, '')
  cleaned = cleaned.replace(/!\[([^\]]*)\]\((<[^>]+>|[^)]+)\)/g, (_m, alt: string, rawUrl: string) => {
    const normalizedUrl = String(rawUrl || '').trim().replace(/^<|>$/g, '')
    const resolved = resolveMarkdownImage(normalizedUrl)
    return `![${alt}](${resolved})`
  })
  let rendered = String(renderMarkdown(cleaned))
  rendered = rendered.replace(/<!-- (?:warning|success|highlight)-(?:start|end) -->\s*/g, '')
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

watch(() => route.params.name, processMarkdown, { immediate: true })

const goBack = () => {
  router.push('/')
}

const copyContent = async () => {
  const mdText = getBlogMdContent(decodeURIComponent(blogName.value))
  if (!mdText) {
    alert('没有可复制的内容')
    return
  }
  const text = mdText.replace(/^---[\s\S]*?---\s*/, '')
  try {
    await navigator.clipboard.writeText(text)
    alert('内容已复制到剪贴板')
  } catch {
    alert('复制失败，请手动复制')
  }
}
</script>

<style scoped>
.blog-post-page {
  padding: 24px 32px;
  max-width: 900px;
  margin: 0;
}

.blog-post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
}

.back-icon {
  width: 16px;
  height: 16px;
}

.copy-btn {
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

.copy-btn:hover {
  background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
}

.copy-btn:active {
  transform: translateY(0);
}

.blog-not-found {
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
}

.blog-not-found h2 {
  font-size: 24px;
  color: #1e293b;
  margin-bottom: 12px;
}

.blog-not-found p {
  margin-bottom: 24px;
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
</style>
