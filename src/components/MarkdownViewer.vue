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
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { marked } from '../utils/markedConfig'
import 'highlight.js/styles/github.css'

// ══════════════════════════════════════════════════════════════════
// 代码块头部注入（语言标签 + 复制按钮）
// ══════════════════════════════════════════════════════════════════

/** 从 hljs class 中提取语言名（如 "hljs language-bash" → "bash"） */
function extractLanguage(codeEl: HTMLElement): string {
  const cls = codeEl.className || ''
  const m = cls.match(/language-(\w[\w-]*)/)
  return m ? m[1] : ''
}

/** 为指定容器内所有 <pre> 注入 code-header（语言标签 + 复制按钮） */
function injectCodeHeaders(container: Element): void {
  const pres = container.querySelectorAll('pre')
  pres.forEach((pre) => {
    // 跳过已经注入过的
    if (pre.querySelector('.code-header')) return

    const code = pre.querySelector('code')
    const lang = code ? extractLanguage(code) : ''

    // 创建头部条
    const header = document.createElement('div')
    header.className = 'code-header'

    // 语言标签
    const langLabel = document.createElement('span')
    langLabel.className = 'code-lang'
    langLabel.textContent = lang || 'code'

    // 复制按钮
    const copyBtn = document.createElement('button')
    copyBtn.className = 'code-copy-btn'
    copyBtn.textContent = '复制'
    copyBtn.addEventListener('click', () => handleCopyCode(pre, copyBtn))

    header.appendChild(langLabel)
    header.appendChild(copyBtn)
    pre.prepend(header)
  })
}

/** 复制代码块内容到剪贴板 */
async function handleCopyCode(pre: HTMLElement, btn: HTMLButtonElement): Promise<void> {
  const code = pre.querySelector('code')
  const text = code?.textContent ?? ''
  try {
    await navigator.clipboard.writeText(text)
    btn.textContent = '✓ 已复制'
    btn.style.background = '#1a7f37'
    btn.style.color = '#ffffff'
    btn.style.borderColor = '#1a7f37'
    setTimeout(() => {
      btn.textContent = '复制'
      btn.style.background = ''
      btn.style.color = ''
      btn.style.borderColor = ''
    }, 1500)
  } catch {
    console.error('clipboard.writeText 失败，尝试 fallback')
    // fallback: document.execCommand（旧浏览器兼容）
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    btn.textContent = '✓ 已复制'
    btn.style.background = '#1a7f37'
    btn.style.color = '#ffffff'
    btn.style.borderColor = '#1a7f37'
    setTimeout(() => {
      btn.textContent = '复制'
      btn.style.background = ''
      btn.style.color = ''
      btn.style.borderColor = ''
    }, 1500)
  }
}

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

/** 渲染后注入代码块头部（.markdown-content 路径） */
watch(htmlContent, async () => {
  await nextTick()
  const el = document.querySelector('.markdown-content')
  if (el) injectCodeHeaders(el)
})

/** 博客 HTML 渲染后注入代码块头部（.blog-html-wrapper 路径） */
watch(fullBlogHtml, async () => {
  await nextTick()
  const el = document.querySelector('.blog-html-wrapper')
  if (el) injectCodeHeaders(el)
})

onMounted(async () => {
  await nextTick()
  // 首次挂载时扫描已有内容
  const mdEl = document.querySelector('.markdown-content')
  if (mdEl) injectCodeHeaders(mdEl)
  const blogEl = document.querySelector('.blog-html-wrapper')
  if (blogEl) injectCodeHeaders(blogEl)
})
</script>

<style>
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
  background: var(--bg-card);
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
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-card) 100%);
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
  border: 1px solid var(--border-color);
  font-size: 22px;
  color: var(--text-secondary);
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
  background: var(--border-color);
  color: #1e293b;
  transform: rotate(90deg);
}

.modal-body {
  padding: 32px 40px;
  overflow-y: auto;
  flex: 1;
  background: var(--bg-card);
}

.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: var(--border-color-light);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* ===== 基础排版 ===== */
.markdown-content {
  line-height: 1.7;
  color: #1f2328;
  font-size: 15px;
  font-family: -apple-system, "Segoe UI", Helvetica, Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
  word-wrap: break-word;
}

.markdown-content > *:first-child {
  margin-top: 0 !important;
}

/* ===== 标题 (h1 - h6) ===== */
.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #1f2328;
  position: relative;
}

.markdown-content h1 {
  margin: 0 0 24px 0;
  padding-bottom: 10px;
  font-size: 2em;
  font-weight: 700;
  border-bottom: 1px solid var(--border-color-light);
}

.markdown-content h2 {
  padding-bottom: 8px;
  font-size: 1.5em;
  font-weight: 600;
  border-bottom: 1px solid var(--border-color-light);
}

.markdown-content h3 {
  font-size: 1.25em;
  padding-left: 12px;
  border-left: 3px solid var(--link-color);
}

.markdown-content h4 {
  font-size: 1em;
  padding-left: 10px;
  border-left: 2px solid var(--border-color-light);
}

.markdown-content h5 {
  font-size: 0.9em;
  padding-left: 8px;
  border-left: 2px solid var(--border-color-light);
}
.markdown-content h6 {
  font-size: 0.85em;
  padding-left: 8px;
  border-left: 2px solid var(--border-color-light);
}

/* 标题锚点 */
.markdown-content h1:hover .heading-anchor,
.markdown-content h2:hover .heading-anchor,
.markdown-content h3:hover .heading-anchor,
.markdown-content h4:hover .heading-anchor {
  opacity: 1;
}

.heading-anchor {
  opacity: 0;
  position: absolute;
  left: -1.2em;
  top: 50%;
  transform: translateY(-50%);
  color: var(--link-color);
  text-decoration: none;
  font-size: 0.85em;
  font-weight: 400;
  transition: opacity 0.2s;
}

/* ===== 段落 ===== */
.markdown-content p {
  margin: 0 0 16px 0;
}

/* ===== 列表 ===== */
.markdown-content ul,
.markdown-content ol {
  padding-left: 2em;
  margin: 0 0 16px 0;
}

.markdown-content li {
  margin: 4px 0;
}

.markdown-content li > p {
  margin: 8px 0;
}

.markdown-content ul ul,
.markdown-content ul ol,
.markdown-content ol ul,
.markdown-content ol ol {
  margin: 4px 0;
}

/* 自定义列表 marker */
.markdown-content ul {
  list-style-type: none;
}
.markdown-content ul > li::before {
  content: "▸";
  color: var(--link-color);
  display: inline-block;
  width: 1.3em;
  margin-left: -1.3em;
  font-size: 0.85em;
}
.markdown-content ul ul > li::before,
.markdown-content ul ul ul > li::before {
  content: "▸";
  color: var(--link-color);
  display: inline-block;
  width: 1.3em;
  margin-left: -1.3em;
  font-size: 0.85em;
}

/* 任务列表 */
.markdown-content .task-list-item {
  list-style-type: none;
}
.markdown-content .task-list-item::before {
  content: none;
}
.markdown-content .task-list-item input[type="checkbox"] {
  margin: 0 8px 2px -1.5em;
  accent-color: var(--link-color);
  vertical-align: middle;
}
.markdown-content .task-list-item input[type="checkbox"]:checked + * {
  text-decoration: line-through;
  color: var(--text-secondary);
}

/* ===== 引用块 ===== */
.markdown-content blockquote {
  margin: 0 0 16px 0;
  padding: 12px 16px;
  border-left: 4px solid var(--link-color);
  background: var(--bg-tertiary);
  border-radius: 0 6px 6px 0;
  color: var(--text-secondary);
}

.markdown-content blockquote > :first-child {
  margin-top: 0;
}
.markdown-content blockquote > :last-child {
  margin-bottom: 0;
}

/* 引用块类型 */
.markdown-content blockquote.warning {
  border-left-color: #d4a72c;
  background: var(--callout-warning-bg);
  color: var(--callout-warning-text);
}
.markdown-content blockquote.success {
  border-left-color: var(--accent-success);
  background: var(--callout-success-bg);
  color: var(--callout-success-text);
}
.markdown-content blockquote.info {
  border-left-color: var(--link-color);
  background: var(--callout-info-bg);
  color: var(--callout-info-text);
}
.markdown-content blockquote.tip {
  border-left-color: #8256d0;
  background: var(--callout-tip-bg);
  color: var(--callout-tip-text);
}

/* 嵌套引用块 */
.markdown-content blockquote blockquote {
  margin: 8px 0 0 0;
  border-left-color: #8b949e;
}
.markdown-content blockquote blockquote blockquote {
  border-left-color: #afb8c1;
}

/* ===== 行内代码 ===== */
.markdown-content :not(pre) > code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.875em;
  padding: 2px 6px;
  background: rgba(175, 184, 193, 0.2);
  border-radius: 4px;
  color: #cf222e;
}

/* ===== 代码块 ===== */
.markdown-content pre {
  margin: 0 0 16px 0;
  position: relative;
}

.markdown-content pre {
  padding: 0;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  overflow: hidden;
  line-height: 1.5;
}

.markdown-content pre code {
  display: block;
  padding: 44px 16px 16px 16px;
  background: transparent;
  border: none;
  color: #1f2328;
  font-size: 13.6px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  overflow-x: auto;
  line-height: 1.5;
  word-wrap: normal;
  white-space: pre;
}

/* 代码块头部：语言标签 + 复制按钮（注入 v-html，必须用 ） */
.code-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  background: #e8eaed;
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
  transition: all 0.15s ease;
  font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
}

.code-copy-btn:hover {
  background: var(--link-color);
  color: var(--on-accent);
  border-color: var(--link-color);
}

/* ===== 表格 ===== */
.markdown-content table {
  width: 100%;
  margin: 0 0 16px 0;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
}

.markdown-content thead th {
  position: sticky;
  top: 0;
  background: var(--bg-tertiary);
  font-weight: 600;
  text-align: left;
  padding: 12px 16px;
  border-bottom: 2px solid var(--border-color-light);
  color: #1f2328;
  white-space: nowrap;
}

.markdown-content th:not(:last-child),
.markdown-content td:not(:last-child) {
  border-right: 1px solid var(--border-color-light);
}

.markdown-content td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-color-light);
  color: #1f2328;
  vertical-align: top;
}

.markdown-content tbody tr:last-child td {
  border-bottom: none;
}

.markdown-content tbody tr:nth-child(even) {
  background: var(--bg-tertiary);
}

.markdown-content tbody tr:hover {
  background: #ddf4ff;
}

/* ===== 图片 ===== */
.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin: 8px 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.markdown-content img:hover {
  transform: scale(1.01);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

/* ===== 链接 ===== */
.markdown-content a {
  color: var(--link-color);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.15s;
}

.markdown-content a:hover {
  color: #0550ae;
}

.markdown-content a[target="_blank"]::after {
  content: " ↗";
  font-size: 0.7em;
  opacity: 0.5;
}

/* ===== 分隔线 ===== */
.markdown-content hr {
  margin: 24px 0;
  border: none;
  border-top: 2px dashed var(--border-color-light);
}

/* ===== 键盘按键 ===== */
.markdown-content kbd {
  display: inline-block;
  padding: 2px 6px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.825em;
  line-height: 1.4;
  color: #1f2328;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color-light);
  border-radius: 4px;
  box-shadow: 0 1px 0 var(--border-color-light), inset 0 1px 0 var(--bg-card);
  vertical-align: middle;
}

/* ===== 高亮 ===== */
.markdown-content mark {
  background: #fff8c5;
  color: #1f2328;
  padding: 1px 4px;
  border-radius: 3px;
}

/* ===== 上标/下标 ===== */
.markdown-content sup {
  font-size: 0.8em;
  vertical-align: super;
}
.markdown-content sub {
  font-size: 0.8em;
  vertical-align: sub;
}

/* ===== 删除线 ===== */
.markdown-content del {
  color: var(--text-secondary);
}

/* ===== 注解引用（保留） ===== */
.markdown-content .annotation-ref {
  color: var(--link-color);
  font-weight: bold;
  cursor: help;
  position: relative;
  border-bottom: 1px dashed var(--link-color);
}

.markdown-content .annotation-ref:hover::after {
  content: attr(data-note);
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  background: var(--text-primary);
  color: var(--bg-card);
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
  border-top-color: #1f2328;
}

/* ===== details/summary 折叠块 ===== */
.markdown-content details {
  margin: 0 0 16px 0;
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  padding: 12px 16px;
}

.markdown-content details > summary {
  font-weight: 600;
  cursor: pointer;
  color: var(--link-color);
}

/* ===== 描述列表 ===== */
.markdown-content dl {
  margin: 0 0 16px 0;
}
.markdown-content dt {
  font-weight: 600;
  margin-top: 12px;
}
.markdown-content dd {
  margin-left: 1.5em;
  color: var(--text-secondary);
}


/**
 * 博客 HTML 独立样式：作用于 v-html 注入的内容 与 运行时注入的 DOM 元素
 * 确保构建期生成的 HTML 和 marked 客户端渲染效果一致
 */

/* ===== 基础排版 ===== */
.blog-html-wrapper {
  color: #1f2328;
  font-size: 15px;
  line-height: 1.7;
  font-family: -apple-system, "Segoe UI", Helvetica, Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
  word-wrap: break-word;
}

.blog-html-wrapper > *:first-child { margin-top: 0 !important; }

/* ===== 标题 ===== */
.blog-html-wrapper h1,
.blog-html-wrapper h2,
.blog-html-wrapper h3,
.blog-html-wrapper h4,
.blog-html-wrapper h5,
.blog-html-wrapper h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #1f2328;
}

.blog-html-wrapper h1 {
  margin-top: 0;
  padding-bottom: 10px;
  font-size: 2em;
  font-weight: 700;
  border-bottom: 1px solid var(--border-color-light);
}

.blog-html-wrapper h2 {
  padding-bottom: 8px;
  font-size: 1.5em;
  border-bottom: 1px solid var(--border-color-light);
}

.blog-html-wrapper h3 {
  font-size: 1.25em;
  padding-left: 12px;
  border-left: 3px solid var(--link-color);
}

.blog-html-wrapper h4 {
  font-size: 1em;
  padding-left: 10px;
  border-left: 2px solid var(--border-color-light);
}

.blog-html-wrapper h5 { font-size: 0.875em; color: var(--text-secondary); }
.blog-html-wrapper h6 { font-size: 0.85em; color: var(--text-secondary); }

/* ===== 段落 ===== */
.blog-html-wrapper p { margin: 0 0 16px 0; }

/* ===== 列表 ===== */
.blog-html-wrapper ul,
.blog-html-wrapper ol {
  padding-left: 2em;
  margin: 0 0 16px 0;
}

.blog-html-wrapper li { margin: 4px 0; }
.blog-html-wrapper li > p { margin: 8px 0; }

.blog-html-wrapper ul ul,
.blog-html-wrapper ul ol,
.blog-html-wrapper ol ul,
.blog-html-wrapper ol ol {
  margin: 4px 0;
}

/* ===== 行内代码 ===== */
.blog-html-wrapper :not(pre) > code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.875em;
  padding: 2px 6px;
  background: rgba(175, 184, 193, 0.2);
  border-radius: 4px;
  color: #cf222e;
}

/* ===== 代码块 ===== */
.blog-html-wrapper pre {
  margin: 0 0 16px 0;
  padding: 0;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  line-height: 1.5;
}

.blog-html-wrapper pre code {
  display: block;
  padding: 44px 16px 16px 16px;
  background: transparent;
  border: none;
  color: #1f2328;
  font-size: 13.6px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  overflow-x: auto;
  line-height: 1.5;
  word-wrap: normal;
  white-space: pre;
}

/* ===== 代码块头部 (运行时注入) ===== */
.blog-html-wrapper .code-header,
.markdown-content .code-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  background: #e8eaed;
  border-bottom: 1px solid var(--border-color-light);
  border-radius: 8px 8px 0 0;
  font-size: 12px;
  z-index: 1;
}

.blog-html-wrapper .code-lang,
.markdown-content .code-lang {
  color: var(--text-secondary);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  text-transform: lowercase;
}

.blog-html-wrapper .code-copy-btn,
.markdown-content .code-copy-btn {
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

.blog-html-wrapper .code-copy-btn:hover,
.markdown-content .code-copy-btn:hover {
  background: var(--link-color);
  color: var(--on-accent);
  border-color: var(--link-color);
}

/* ===== 表格 ===== */
.blog-html-wrapper table {
  width: 100%;
  margin: 0 0 16px 0;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
}

.blog-html-wrapper thead th {
  background: var(--bg-tertiary);
  font-weight: 600;
  text-align: left;
  padding: 12px 16px;
  border-bottom: 2px solid var(--border-color-light);
  color: #1f2328;
}

.blog-html-wrapper th:not(:last-child),
.blog-html-wrapper td:not(:last-child) {
  border-right: 1px solid var(--border-color-light);
}

.blog-html-wrapper td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-color-light);
  color: #1f2328;
  vertical-align: top;
}

.blog-html-wrapper tbody tr:last-child td { border-bottom: none; }
.blog-html-wrapper tbody tr:nth-child(even) { background: var(--bg-tertiary); }
.blog-html-wrapper tbody tr:hover { background: #ddf4ff; }

/* ===== 图片 ===== */
.blog-html-wrapper img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin: 8px 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.blog-html-wrapper img:hover {
  transform: scale(1.01);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

/* ===== 链接 ===== */
.blog-html-wrapper a {
  color: var(--link-color);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.blog-html-wrapper a:hover { color: #0550ae; }
.blog-html-wrapper a[target="_blank"]::after {
  content: " ↗";
  font-size: 0.7em;
  opacity: 0.5;
}

/* ===== 引用块 ===== */
.blog-html-wrapper blockquote {
  margin: 0 0 16px 0;
  padding: 12px 16px;
  border-left: 4px solid var(--link-color);
  background: var(--bg-tertiary);
  border-radius: 0 6px 6px 0;
  color: var(--text-secondary);
}

.blog-html-wrapper blockquote > :first-child { margin-top: 0; }
.blog-html-wrapper blockquote > :last-child { margin-bottom: 0; }

.blog-html-wrapper blockquote blockquote {
  margin: 8px 0 0 0;
  border-left-color: #8b949e;
}

/* 引用块类型（HTML 模式） */
.blog-html-wrapper blockquote.warning {
  border-left-color: #d4a72c;
  background: var(--callout-warning-bg);
  color: var(--callout-warning-text);
}
.blog-html-wrapper blockquote.success {
  border-left-color: var(--accent-success);
  background: var(--callout-success-bg);
  color: var(--callout-success-text);
}
.blog-html-wrapper blockquote.info {
  border-left-color: var(--link-color);
  background: var(--callout-info-bg);
  color: var(--callout-info-text);
}
.blog-html-wrapper blockquote.tip {
  border-left-color: #8256d0;
  background: var(--callout-tip-bg);
  color: var(--callout-tip-text);
}

/* ===== 分隔线 ===== */
.blog-html-wrapper hr {
  margin: 24px 0;
  border: none;
  border-top: 2px dashed var(--border-color-light);
}

/* ===== 键盘按键 ===== */
.blog-html-wrapper kbd {
  display: inline-block;
  padding: 2px 6px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.825em;
  color: #1f2328;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color-light);
  border-radius: 4px;
  box-shadow: 0 1px 0 var(--border-color-light), inset 0 1px 0 var(--bg-card);
  vertical-align: middle;
}

/* ===== 高亮 ===== */
.blog-html-wrapper mark {
  background: #fff8c5;
  color: #1f2328;
  padding: 1px 4px;
  border-radius: 3px;
}

/* ===== 上标/下标/删除线 ===== */
.blog-html-wrapper sup { font-size: 0.75em; vertical-align: super; line-height: 0; }
.blog-html-wrapper sub { font-size: 0.75em; vertical-align: sub; line-height: 0; }
.blog-html-wrapper del { color: var(--text-secondary); }

/* ===== 任务列表 ===== */
.blog-html-wrapper .task-list-item { list-style-type: none; }
.blog-html-wrapper .task-list-item input[type="checkbox"] {
  margin: 0 8px 2px -1.5em;
  accent-color: var(--link-color);
  vertical-align: middle;
}

/* ===== details/summary ===== */
.blog-html-wrapper details {
  margin: 0 0 16px 0;
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  padding: 12px 16px;
}

.blog-html-wrapper details > summary {
  font-weight: 600;
  cursor: pointer;
  color: var(--link-color);
}

/* ===== 描述列表 ===== */
.blog-html-wrapper dl { margin: 0 0 16px 0; }
.blog-html-wrapper dt { font-weight: 600; margin-top: 12px; }
.blog-html-wrapper dd { margin-left: 1.5em; color: var(--text-secondary); }

/* ===== hljs 深色适配：浅色默认，深色模式切换 github-dark token ===== */
:root:not([data-theme="dark"]) .hljs {
  background: var(--bg-tertiary);
  color: #24292e;
}
:root[data-theme="dark"] .markdown-content pre,
:root[data-theme="dark"] .blog-html-wrapper pre {
  background: #0d1117;
  border-color: #30363d;
}
:root[data-theme="dark"] .markdown-content pre code,
:root[data-theme="dark"] .blog-html-wrapper pre code {
  color: #c9d1d9;
}
:root[data-theme="dark"] .markdown-content .hljs-keyword,
:root[data-theme="dark"] .blog-html-wrapper .hljs-keyword { color: #ff7b72; }
:root[data-theme="dark"] .markdown-content .hljs-string,
:root[data-theme="dark"] .blog-html-wrapper .hljs-string { color: #a5d6ff; }
:root[data-theme="dark"] .markdown-content .hljs-number,
:root[data-theme="dark"] .blog-html-wrapper .hljs-number { color: #79c0ff; }
:root[data-theme="dark"] .markdown-content .hljs-comment,
:root[data-theme="dark"] .blog-html-wrapper .hljs-comment { color: #8b949e; }
:root[data-theme="dark"] .markdown-content .hljs-title,
:root[data-theme="dark"] .blog-html-wrapper .hljs-title { color: #d2a8ff; }
:root[data-theme="dark"] .markdown-content .hljs-attr,
:root[data-theme="dark"] .blog-html-wrapper .hljs-attr { color: #79c0ff; }
</style>
