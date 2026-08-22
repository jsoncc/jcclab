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
import { ref, watch, computed, onMounted, nextTick } from 'vue'
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

// 代码块头部注入（语言标签 + 复制按钮）
function extractLanguage(codeEl: HTMLElement): string {
  const cls = codeEl.className || ''
  const m = cls.match(/language-(\w[\w-]*)/)
  return m ? m[1] : ''
}

async function handleCopyCode(pre: HTMLElement, btn: HTMLButtonElement): Promise<void> {
  const code = pre.querySelector('code')
  const text = code?.textContent ?? ''
  try {
    await navigator.clipboard.writeText(text)
    btn.textContent = '✓ 已复制'
    btn.style.background = '#1a7f37'
    btn.style.color = '#ffffff'
    btn.style.borderColor = '#1a7f37'
    setTimeout(() => { btn.textContent = '复制'; btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = '' }, 1500)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    btn.textContent = '✓ 已复制'
    btn.style.background = '#1a7f37'
    btn.style.color = '#ffffff'
    btn.style.borderColor = '#1a7f37'
    setTimeout(() => { btn.textContent = '复制'; btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = '' }, 1500)
  }
}

function injectCodeHeaders(): void {
  const container = document.querySelector('.markdown-content')
  if (!container) return
  container.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.code-header')) return
    const code = pre.querySelector('code')
    const lang = code ? extractLanguage(code) : ''
    const header = document.createElement('div')
    header.className = 'code-header'
    const langLabel = document.createElement('span')
    langLabel.className = 'code-lang'
    langLabel.textContent = lang || 'code'
    const copyBtn = document.createElement('button')
    copyBtn.className = 'code-copy-btn'
    copyBtn.textContent = '复制'
    copyBtn.addEventListener('click', () => handleCopyCode(pre, copyBtn))
    header.appendChild(langLabel)
    header.appendChild(copyBtn)
    pre.prepend(header)
  })
}

watch(htmlContent, async () => { await nextTick(); injectCodeHeaders() })
onMounted(async () => { await nextTick(); injectCodeHeaders() })
</script>

<style>
/* ===== 组件布局（使用 .blog-post- 命名空间防止泄漏） ===== */
.blog-post-page {
  padding: 24px 32px;
  max-width: 1500px;
  margin: 0 auto;
}

.blog-post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--bg-primary);
  backdrop-filter: blur(8px);
}

.blog-post-page > .blog-post-header > .back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.blog-post-page > .blog-post-header > .back-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--border-color-light);
  color: var(--text-primary);
}

.blog-post-page > .blog-post-header > .back-btn .back-icon {
  width: 16px;
  height: 16px;
}

.blog-post-page > .blog-post-header > .copy-btn {
  background: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-blue) 100%);
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

.blog-post-page > .blog-post-header > .copy-btn:hover {
  background: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-blue) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
}

.blog-post-page > .blog-post-header > .copy-btn:active {
  transform: translateY(0);
}

.blog-not-found {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-secondary);
}

.blog-not-found h2 {
  font-size: 24px;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.blog-not-found p {
  margin-bottom: 24px;
}

/* ============================================================ */
/*  v-html 内容样式（全局，确保对动态注入的 HTML 生效）            */
/* ============================================================ */

.markdown-content {
  line-height: 1.85;
  color: var(--text-secondary);
  font-size: 16px;
}

.markdown-content h1 {
  margin: 0 0 24px 0;
  font-size: 32px;
  color: var(--text-primary);
  border-bottom: 3px solid var(--border-color);
  padding-bottom: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.markdown-content h2 {
  margin: 32px 0 16px;
  font-size: 24px;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 10px;
  font-weight: 700;
}

.markdown-content h3 {
  margin: 28px 0 14px;
  font-size: 20px;
  color: var(--text-secondary);
  font-weight: 600;
}

.markdown-content h4 {
  margin: 24px 0 12px;
  font-size: 17px;
  color: var(--text-secondary);
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
  border-left: 4px solid var(--accent-blue);
  background: var(--accent-active);
  border-radius: 0 8px 8px 0;
  color: var(--text-secondary);
}

.markdown-content blockquote.warning {
  border-left-color: var(--accent-warning);
  background: var(--callout-warning-bg);
  color: var(--callout-warning-text);
}

.markdown-content blockquote.success {
  border-left-color: var(--accent-success);
  background: var(--callout-success-bg);
  color: var(--callout-success-text);
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
  background: var(--bg-tertiary);
  border-radius: 6px;
  color: var(--accent-blue);
  border: 1px solid var(--border-color);
}

.markdown-content pre {
  margin: 20px 0;
  padding: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow-x: auto;
  line-height: 1.6;
  position: relative;
}

.markdown-content pre code {
  display: block;
  padding: 16px 20px;
  padding-top: 36px;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
}

/* ===== 代码块头部（运行时注入） ===== */
.code-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color-light);
  border-radius: 8px 8px 0 0;
  font-size: 12px;
  z-index: 1;
}

.code-lang {
  color: var(--text-secondary);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  text-transform: lowercase;
}

.code-copy-btn {
  padding: 3px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 5px;
  cursor: pointer;
  font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  transition: all 0.15s ease;
}

.code-copy-btn:hover {
  background: var(--link-color);
  color: var(--on-accent);
  border-color: var(--link-color);
}

.markdown-content table {
  width: 100%;
  margin: 20px 0;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
}

.markdown-content th {
  background: var(--bg-secondary);
  font-weight: 600;
  text-align: left;
  padding: 12px 16px;
  border-bottom: 2px solid var(--border-color);
  color: var(--text-primary);
}

.markdown-content td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.markdown-content tr:last-child td {
  border-bottom: none;
}

.markdown-content tr:nth-child(even) {
  background: var(--bg-secondary);
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
  border-top: 2px solid var(--border-color);
}

.markdown-content a {
  color: var(--accent-blue);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.markdown-content a:hover {
  border-bottom-color: var(--accent-blue);
}

/* ===== hljs 深色适配 ===== */
:root[data-theme="dark"] .markdown-content pre {
  background: #0d1117;
  border-color: #30363d;
}
:root[data-theme="dark"] .markdown-content pre code {
  color: #c9d1d9;
}
:root[data-theme="dark"] .markdown-content .hljs-keyword { color: #ff7b72; }
:root[data-theme="dark"] .markdown-content .hljs-string { color: #a5d6ff; }
:root[data-theme="dark"] .markdown-content .hljs-number { color: #79c0ff; }
:root[data-theme="dark"] .markdown-content .hljs-comment { color: #8b949e; }
:root[data-theme="dark"] .markdown-content .hljs-title { color: #d2a8ff; }
:root[data-theme="dark"] .markdown-content .hljs-attr { color: #79c0ff; }
</style>
