<template>
  <div class="home">
    <h1 class="page-title">主页</h1>
    <p class="page-subtitle">作者：JsonCC · 每天都有新内容</p>
    <p class="repo-cta">
      项目源码与更新：
      <a
        href="https://github.com/jsoncc/today-history"
        target="_blank"
        rel="noopener noreferrer"
        class="repo-link"
      >
        GitHub - jsoncc/today-history
      </a>
    </p>
    
    <div class="module-container">
      <!-- 历史上的今天模块 -->
      <div class="list-card">
        <h2 class="module-title">历史上的今天</h2>
        <div class="list-item" v-for="item in dateList" :key="item.date">
          <a 
            :href="`#/history/${item.date}`" 
            class="date-link"
            @click.prevent="goToHistory(item.date)"
          >
            {{ item.date }}
          </a>
        </div>
      </div>

      <!-- 博客模块 -->
      <div class="list-card">
        <h2 class="module-title">博客</h2>
        <div class="list-item" v-for="item in blogList" :key="item.path">
          <a 
            :href="`#/blog/${item.name}`" 
            class="date-link"
            @click.prevent="goToBlog(item.path)"
          >
            {{ item.name }}
          </a>
        </div>
      </div>

      <!-- 命令模块 -->
      <div class="list-card">
        <h2 class="module-title">命令</h2>
        <div class="list-item" v-for="item in commandList" :key="item.path">
          <a 
            :href="`#/command/${item.name}`" 
            class="date-link"
            @click.prevent="goToCommand(item.path)"
          >
            {{ item.name }}
          </a>
        </div>
      </div>

      <!-- VPN模块 -->
      <div class="list-card">
        <h2 class="module-title">科学上网</h2>
        <div class="list-item" v-for="item in vpnList" :key="item.path">
          <a 
            :href="`#/vpn/${item.name}`" 
            class="date-link"
            @click.prevent="goToVpn(item.path)"
          >
            {{ item.name }}
          </a>
        </div>
      </div>

      <!-- 翻译模块 -->
      <div class="list-card translate-card">
        <h2 class="module-title">翻译</h2>
        <p class="translate-hint">自动识别左侧为中文或英文，点击翻译后在右侧显示另一种语言</p>
        <div class="translate-toolbar">
          <p
            class="translate-detect"
            :class="{ warn: translateDetectWarn }"
            role="status"
            aria-live="polite"
          >
            {{ translateDetectMessage }}
          </p>
          <button
            type="button"
            class="translate-submit"
            :disabled="translateLoading || !canTranslate"
            @click="runTranslate"
          >
            {{ translateLoading ? '翻译中…' : '翻译' }}
          </button>
        </div>
        <div class="translate-panels">
          <div class="translate-panel">
            <label class="panel-label" for="translate-input">原文</label>
            <textarea
              id="translate-input"
              v-model="translateSource"
              class="translate-textarea"
              placeholder="在此输入要翻译的内容…"
              rows="10"
              spellcheck="false"
            />
          </div>
          <div class="translate-divider" aria-hidden="true" />
          <div class="translate-panel">
            <label class="panel-label" for="translate-output">译文</label>
            <textarea
              id="translate-output"
              :value="translateResult"
              class="translate-textarea translate-output"
              readonly
              placeholder="翻译结果将显示在这里"
              rows="10"
              spellcheck="false"
            />
          </div>
        </div>
        <p v-if="translateError" class="translate-error">{{ translateError }}</p>
      </div>
    </div>

    <!-- 点击后，渲染对应 md 内容 -->
    <MarkdownViewer v-if="showViewer" :mdContent="currentMdContent" @close="closeViewer" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CryptoJS from 'crypto-js'
import MarkdownViewer from './components/MarkdownViewer.vue'

// 使用 import.meta.glob 自动读取 assets/history 目录下的所有 md 文件（作为原始文本）
const historyFiles = import.meta.glob('./assets/history/*.md', { eager: true, query: '?raw', import: 'default' })

// 读取 assets/blog 目录下的所有 md 文件
const blogFiles = import.meta.glob('./assets/blog/*.md', { eager: true, query: '?raw', import: 'default' })

// 读取 assets/command 目录下的所有 md 文件
const commandFiles = import.meta.glob('./assets/command/*.md', { eager: true, query: '?raw', import: 'default' })

// 读取 assets/vpn 目录下的所有 md 文件
const vpnFiles = import.meta.glob('./assets/vpn/*.md', { eager: true, query: '?raw', import: 'default' })

// 从文件路径中提取日期并生成 dateList
const dateList = computed(() => {
  const dates = Object.keys(historyFiles)
    .map(path => {
      // 从路径 ./assets/history/history-2026-03-30.md 中提取日期 2026-03-30
      const match = path.match(/history-(\d{4}-\d{2}-\d{2})\.md$/)
      return match ? match[1] : null
    })
    .filter(date => date !== null)
    .sort((a, b) => new Date(b) - new Date(a)) // 按日期降序排列
    .map(date => ({ date }))
  
  return dates
})

// 从文件路径中提取博客文件名并生成 blogList
const blogList = computed(() => {
  const blogs = Object.keys(blogFiles)
    .map(path => {
      // 从路径 ./assets/blog/文件名.md 中提取文件名
      const match = path.match(/\/([^/]+)\.md$/)
      return match ? { name: match[1], path } : null
    })
    .filter(blog => blog !== null)
  
  return blogs
})

// 从文件路径中提取命令文件名并生成 commandList
const commandList = computed(() => {
  const commands = Object.keys(commandFiles)
    .map(path => {
      // 从路径 ./assets/command/文件名.md 中提取文件名
      const match = path.match(/\/([^/]+)\.md$/)
      return match ? { name: match[1], path } : null
    })
    .filter(command => command !== null)
  
  return commands
})

// 从文件路径中提取VPN文件名并生成 vpnList
const vpnList = computed(() => {
  const vpns = Object.keys(vpnFiles)
    .map(path => {
      // 从路径 ./assets/vpn/文件名.md 中提取文件名
      const match = path.match(/\/([^/]+)\.md$/)
      return match ? { name: match[1], path } : null
    })
    .filter(vpn => vpn !== null)
  
  return vpns
})

const currentMdContent = ref('')
const showViewer = ref(false)

// 点击日期，加载对应 md 文件
const goToHistory = (date) => {
  const filePath = `./assets/history/history-${date}.md`
  if (historyFiles[filePath]) {
    currentMdContent.value = historyFiles[filePath].default || historyFiles[filePath]
    showViewer.value = true
  }
}

// 点击博客，加载对应 md 文件
const goToBlog = (path) => {
  if (blogFiles[path]) {
    currentMdContent.value = blogFiles[path].default || blogFiles[path]
    showViewer.value = true
  }
}

// 点击命令，加载对应 md 文件
const goToCommand = (path) => {
  if (commandFiles[path]) {
    currentMdContent.value = commandFiles[path].default || commandFiles[path]
    showViewer.value = true
  }
}

// 点击VPN，加载对应 md 文件
const goToVpn = (path) => {
  if (vpnFiles[path]) {
    currentMdContent.value = vpnFiles[path].default || vpnFiles[path]
    showViewer.value = true
  }
}

// 关闭详情弹窗
const closeViewer = () => {
  showViewer.value = false
  currentMdContent.value = ''
}

// 翻译：百度翻译开放平台通用翻译 API（开发/preview 走 Vite 代理 /baidu-fanyi 避免 CORS）
const translateSource = ref('')
const translateResult = ref('')
const translateLoading = ref(false)
const translateError = ref('')

const baiduAppId = import.meta.env.VITE_BAIDU_APP_ID
const baiduSecret = import.meta.env.VITE_BAIDU_SECRET
const baiduTranslateUrlEnv = String(import.meta.env.VITE_BAIDU_TRANSLATE_URL || '').trim()

const baiduTranslateConfigured = computed(
  () => Boolean(String(baiduAppId || '').trim() && String(baiduSecret || '').trim())
)

/** GitHub Pages 等静态部署无法直连百度（无 CORS），必须配置可转发的 URL */
const baiduTranslateNeedsProxy = computed(
  () => import.meta.env.PROD && !baiduTranslateUrlEnv
)

const translateApiUrl = () => {
  if (baiduTranslateUrlEnv) return baiduTranslateUrlEnv
  if (import.meta.env.DEV) return '/baidu-fanyi'
  return ''
}

/** 推断百度 API 的 target：中文为主 → 译成 en；英文为主 → 译成 zh */
const inferTargetLang = (text) => {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const latin = (text.match(/[a-zA-Z]/g) || []).length
  if (cjk === 0 && latin === 0) return null
  return cjk >= latin ? 'en' : 'zh'
}

const translateDetectMessage = computed(() => {
  if (!baiduTranslateConfigured.value) {
    return '本地：复制 .env.example 为 .env 并填写密钥；线上：在 GitHub 仓库 Secrets 配置 VITE_BAIDU_APP_ID / VITE_BAIDU_SECRET'
  }
  if (baiduTranslateNeedsProxy.value) {
    return '线上需在 GitHub Secrets 增加 VITE_BAIDU_TRANSLATE_URL（可用仓库 workers 目录部署 Cloudflare Worker 获得地址）'
  }
  const t = translateSource.value.trim()
  if (!t) return '输入内容后将自动判断中文或英文'
  const to = inferTargetLang(t)
  if (!to) return '未检测到中文或英文字符，请补充正文后再翻译'
  return to === 'en' ? '识别为中文 → 译为英文' : '识别为英文 → 译为中文'
})

const translateDetectWarn = computed(() => {
  if (!baiduTranslateConfigured.value) return true
  if (baiduTranslateNeedsProxy.value) return true
  const t = translateSource.value.trim()
  if (!t) return false
  return inferTargetLang(t) === null
})

const canTranslate = computed(() => {
  const t = translateSource.value.trim()
  return Boolean(
    baiduTranslateConfigured.value &&
      !baiduTranslateNeedsProxy.value &&
      t &&
      inferTargetLang(t)
  )
})

const BAIDU_Q_MAX_BYTES = 6000

const runTranslate = async () => {
  const text = translateSource.value.trim()
  if (!text) return
  if (!baiduTranslateConfigured.value) {
    translateError.value = '未配置百度翻译 APP ID 或密钥'
    return
  }
  const to = inferTargetLang(text)
  if (!to) {
    translateError.value = '请输入含中文或英文的内容'
    return
  }
  if (new TextEncoder().encode(text).length > BAIDU_Q_MAX_BYTES) {
    translateError.value = `单次翻译请勿超过约 ${BAIDU_Q_MAX_BYTES} 字节（UTF-8）`
    return
  }
  translateError.value = ''
  translateLoading.value = true
  translateResult.value = ''
  try {
    const apiUrl = translateApiUrl()
    if (!apiUrl) {
      throw new Error('未配置翻译接口地址：生产环境请设置 VITE_BAIDU_TRANSLATE_URL')
    }
    const appid = String(baiduAppId).trim()
    const secret = String(baiduSecret).trim()
    const salt = String(Date.now())
    const sign = CryptoJS.MD5(`${appid}${text}${salt}${secret}`).toString()

    const body = new URLSearchParams({
      q: text,
      from: 'auto',
      to,
      appid,
      salt,
      sign
    })

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: body.toString()
    })
    const data = await res.json()
    if (data.error_code != null) {
      const code = data.error_code
      const msg = data.error_msg || '百度翻译接口错误'
      throw new Error(`${msg}（${code}）`)
    }
    const parts = data.trans_result
    if (!Array.isArray(parts) || !parts.length) throw new Error('未返回译文')
    const out = parts.map((p) => p.dst).join('\n')
    if (!String(out).trim()) throw new Error('未返回译文')
    translateResult.value = out.trim()
  } catch (e) {
    translateError.value = e instanceof Error ? e.message : '翻译失败，请稍后重试'
  } finally {
    translateLoading.value = false
  }
}
</script>

<style scoped>
.home {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

.module-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 30px;
}

.list-card {
  flex: 1;
  min-width: calc(50% - 10px);
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  max-height: 360px;
  overflow-y: auto;
}
.page-title {
  text-align: center;
  font-size: 32px;
  margin-bottom: 10px;
  color: #1f2937;
  font-weight: 700;
}

.page-subtitle {
  text-align: center;
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 40px;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.repo-cta {
  margin: -24px 0 28px;
  text-align: center;
  color: #4b5563;
  font-size: 15px;
}

.repo-link {
  color: #0969da;
  font-weight: 600;
  text-decoration: none;
}

.repo-link:hover {
  text-decoration: underline;
}

.module-title {
  font-size: 20px;
  margin: 0 0 20px 0;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}
.list-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}
.list-item:last-child {
  border-bottom: none;
}
.date-link {
  font-size: 18px;
  color: #0969da;
  text-decoration: none;
  font-weight: 500;
}
.date-link:hover {
  text-decoration: underline;
}

.translate-card {
  flex: 1 1 100%;
  min-width: 100%;
  max-height: none;
}

.translate-hint {
  margin: -8px 0 16px;
  font-size: 14px;
  color: #6b7280;
}

.translate-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.translate-detect {
  margin: 0;
  flex: 1;
  min-width: 200px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.translate-detect.warn {
  color: #b45309;
}

.translate-submit {
  padding: 8px 20px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: #0969da;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.translate-submit:hover:not(:disabled) {
  background: #0558b8;
}

.translate-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.translate-panels {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  min-height: 220px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fafafa;
}

.translate-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
}

.panel-label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  padding: 10px 14px 6px;
}

.translate-textarea {
  flex: 1;
  width: 100%;
  min-height: 200px;
  padding: 12px 14px 16px;
  border: none;
  resize: vertical;
  font-size: 15px;
  line-height: 1.55;
  color: #1f2937;
  font-family: inherit;
  box-sizing: border-box;
}

.translate-textarea:focus {
  outline: none;
}

.translate-output {
  background: #f9fafb;
  color: #111827;
}

.translate-divider {
  width: 1px;
  background: #e5e7eb;
  min-height: 100%;
}

.translate-error {
  margin: 12px 0 0;
  font-size: 14px;
  color: #b91c1c;
}

@media (max-width: 640px) {
  .translate-panels {
    grid-template-columns: 1fr;
  }

  .translate-divider {
    width: 100%;
    height: 1px;
    min-height: 0;
  }
}
</style>
