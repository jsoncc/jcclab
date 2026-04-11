<template>
  <div class="home">
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">JsonCC Lab</h1>
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
      </div>
      <p class="header-time">
        <span class="header-time-icon" aria-hidden="true" />
        {{ nowText }}
      </p>
      <div class="header-right" aria-hidden="true" />
    </header>

    <main class="page-main">
      <div class="content-layout">
        <aside class="module-sidebar">
          <div class="sidebar-nav">
            <template v-for="tab in moduleTabs" :key="tab.key">
              <div
                v-if="tab.key === 'formatCheck'"
                class="sidebar-dropdown"
                :class="{ 'is-open': toolsMenuOpen }"
                @mouseenter="openToolsMenu"
                @mouseleave="closeToolsMenu"
              >
                <button
                  type="button"
                  class="sidebar-item"
                  :class="{ active: activeModule === tab.key }"
                  @click="openToolsDefault"
                  :ref="setToolsAnchor"
                >
                  {{ tab.label }}
                </button>
                <!-- Menu is teleported to body so it won't be clipped by the nav's scroll/overflow. -->
                <Teleport to="body">
                  <div
                    v-show="toolsMenuOpen"
                    class="sidebar-dropdown-menu"
                    role="menu"
                    aria-label="工具集合"
                    :style="toolsMenuStyle"
                    @mouseenter="openToolsMenu"
                    @mouseleave="closeToolsMenu"
                  >
                    <!-- Keep menu open while hovering the panel itself. -->
                    <button
                      type="button"
                      class="sidebar-dropdown-item"
                      :class="{ active: activeModule === 'formatCheck' && activeTool === 'formatCheck' }"
                      @click="openTool('formatCheck')"
                    >
                      JSON格式化校验
                    </button>
                    <button
                      type="button"
                      class="sidebar-dropdown-item"
                      :class="{ active: activeModule === 'formatCheck' && activeTool === 'uuid' }"
                      @click="openTool('uuid')"
                    >
                      UUID在线生成
                    </button>
                  </div>
                </Teleport>
              </div>
              <button
                v-else
                type="button"
                class="sidebar-item"
                :class="{ active: activeModule === tab.key }"
                @click="activeModule = tab.key"
              >
                {{ tab.label }}
              </button>
            </template>
          </div>
        </aside>

        <div class="module-container" :class="{ 'single-view': activeModule !== 'all' }">
        <template v-for="module in listModules" :key="module.key">
          <div v-if="showModule(module.key)" class="list-card">
            <h2 class="module-title">{{ module.title }}</h2>
            <div v-if="module.key === 'vpn' && activeModule === 'vpn'" class="inline-md">
              <h3 v-if="latestVpnTitle" class="inline-md-title">{{ latestVpnTitle }}</h3>
              <div class="inline-md-content" v-html="latestVpnHtml" />
            </div>
            <template v-else>
              <div class="list-item" v-for="item in module.items" :key="item.key">
                <a
                  :href="item.href"
                  class="date-link"
                  @click.prevent="openModuleItem(module.key, item.value)"
                >
                  {{ item.label }}
                </a>
              </div>
            </template>
          </div>
        </template>

        <!-- 翻译模块 -->
        <div v-if="showModule('translate')" class="list-card translate-card">
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

        <!-- 工具集合模块 -->
        <div v-if="showModule('formatCheck')" class="list-card format-check-card">
          <h2 class="module-title">{{ toolsTitle }}</h2>
          <JsonFormatValidator v-if="activeTool === 'formatCheck'" />
          <UuidGenerator v-else />
        </div>
        </div>
      </div>
    </main>

    <footer class="page-footer">
      <div class="page-footer-inner">
        <p class="footer-brand">JsonCC Lab</p>
        <p class="page-subtitle">作者：JsonCC · 每天都有新内容</p>
        <p class="footer-emails">
          邮箱：
          <a href="mailto:13233768245@163.com">13233768245@163.com</a>
          ，
          <a href="mailto:896415482@qq.com">896415482@qq.com</a>
        </p>
      </div>
    </footer>

    <!-- 点击后，渲染对应 md 内容 -->
    <MarkdownViewer v-if="showViewer" :mdContent="currentMdContent" @close="closeViewer" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount, onMounted } from 'vue'
import CryptoJS from 'crypto-js'
import { marked } from 'marked'
import MarkdownViewer from './components/MarkdownViewer.vue'
import JsonFormatValidator from './components/JsonFormatValidator.vue'
import UuidGenerator from './components/UuidGenerator.vue'
import blogMeta from './assets/blog/blog-meta.json'

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
  const meta = blogMeta || {}
  const blogs = Object.keys(blogFiles)
    .map(path => {
      // 从路径 ./assets/blog/文件名.md 中提取文件名
      const match = path.match(/\/([^/]+)\.md$/)
      return match
        ? {
            name: match[1],
            path,
            updatedAt: Number(meta[path] || 0)
          }
        : null
    })
    .filter(blog => blog !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  
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
    .sort((a, b) => b.name.localeCompare(a.name))
  
  return vpns
})

const latestVpnTitle = computed(() => vpnList.value[0]?.name || '')

const latestVpnHtml = computed(() => {
  const latestPath = vpnList.value[0]?.path
  if (!latestPath || !vpnFiles[latestPath]) return '<p>暂无文档内容</p>'
  const rawMd = vpnFiles[latestPath].default || vpnFiles[latestPath]
  const cleaned = String(rawMd).replace(/^---[\s\S]*?---\s*/, '')
  return marked.parse(cleaned)
})

const currentMdContent = ref('')
const showViewer = ref(false)
const activeModule = ref('all')
const activeTool = ref('formatCheck') // formatCheck | uuid
const toolsMenuOpen = ref(false)
const toolsMenuTimer = ref(0)
const toolsAnchorRef = ref(null)
const nowText = ref('')
let clockTimer = 0
const toolsMenuStyle = ref({
  position: 'fixed',
  left: '-9999px',
  top: '-9999px',
  width: '220px',
  zIndex: 3000
})

const moduleTabs = [
  { key: 'all', label: '全部' },
  { key: 'history', label: '历史上的今天' },
  { key: 'blog', label: '博客' },
  { key: 'command', label: '命令' },
  { key: 'vpn', label: '科学上网' },
  { key: 'formatCheck', label: '工具集合' },
  { key: 'translate', label: '翻译' }
]

const showModule = (moduleKey) => activeModule.value === 'all' || activeModule.value === moduleKey

const openToolsDefault = () => {
  activeModule.value = 'formatCheck'
  activeTool.value = 'formatCheck'
}

const openTool = (toolKey) => {
  activeModule.value = 'formatCheck'
  activeTool.value = toolKey
  toolsMenuOpen.value = false
}

const toolsTitle = computed(() => (activeTool.value === 'uuid' ? 'UUID在线生成' : 'JSON格式化校验'))

const setToolsAnchor = (el) => {
  if (el) toolsAnchorRef.value = el
}

const updateToolsMenuPosition = () => {
  const el = toolsAnchorRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const isNarrowTopNav = window.matchMedia('(max-width: 960px)').matches

  if (isNarrowTopNav) {
    // Top nav: open downward, aligned to the anchor.
    const left = Math.max(10, Math.min(rect.left, window.innerWidth - 260))
    const width = Math.max(220, Math.min(rect.width, window.innerWidth - 20))
    toolsMenuStyle.value = {
      position: 'fixed',
      left: `${left}px`,
      top: `${rect.bottom + 8}px`,
      width: `${width}px`,
      zIndex: 3000
    }
    return
  }

  // Left sidebar: open to the right so it doesn't cover the nav list.
  const desiredWidth = 260
  const width = Math.max(220, Math.min(desiredWidth, window.innerWidth - 20))
  const left = Math.max(10, Math.min(rect.right + 10, window.innerWidth - width - 10))
  const top = Math.max(10, Math.min(rect.top, window.innerHeight - 160))
  toolsMenuStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    zIndex: 3000
  }
}

const openToolsMenu = () => {
  if (toolsMenuTimer.value) window.clearTimeout(toolsMenuTimer.value)
  updateToolsMenuPosition()
  toolsMenuOpen.value = true
  nextTick(() => updateToolsMenuPosition())
}

const closeToolsMenu = () => {
  if (toolsMenuTimer.value) window.clearTimeout(toolsMenuTimer.value)
  // Delay close slightly so moving the mouse doesn't collapse the menu.
  toolsMenuTimer.value = window.setTimeout(() => {
    toolsMenuOpen.value = false
  }, 240)
}

const onWindowRelayout = () => {
  if (!toolsMenuOpen.value) return
  updateToolsMenuPosition()
}

const formatNow = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const w = weekdays[now.getDay()]
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${w} ${hh}:${mm}:${ss}`
}

onMounted(() => {
  nowText.value = formatNow()
  clockTimer = window.setInterval(() => {
    nowText.value = formatNow()
  }, 1000)

  // Re-position the menu when the page/layout scrolls or resizes.
  window.addEventListener('scroll', onWindowRelayout, true)
  window.addEventListener('resize', onWindowRelayout)
})

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
  window.removeEventListener('scroll', onWindowRelayout, true)
  window.removeEventListener('resize', onWindowRelayout)
})

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

const listModules = computed(() => [
  {
    key: 'history',
    title: '历史上的今天',
    items: dateList.value.map(item => ({
      key: item.date,
      label: item.date,
      value: item.date,
      href: `#/history/${item.date}`
    }))
  },
  {
    key: 'blog',
    title: '博客',
    items: blogList.value.map(item => ({
      key: item.path,
      label: item.name,
      value: item.path,
      href: `#/blog/${item.name}`
    }))
  },
  {
    key: 'command',
    title: '命令',
    items: commandList.value.map(item => ({
      key: item.path,
      label: item.name,
      value: item.path,
      href: `#/command/${item.name}`
    }))
  },
  {
    key: 'vpn',
    title: '科学上网',
    items: vpnList.value.map(item => ({
      key: item.path,
      label: item.name,
      value: item.path,
      href: `#/vpn/${item.name}`
    }))
  }
])

const openModuleItem = (moduleKey, value) => {
  switch (moduleKey) {
    case 'history':
      goToHistory(value)
      break
    case 'blog':
      goToBlog(value)
      break
    case 'command':
      goToCommand(value)
      break
    case 'vpn':
      goToVpn(value)
      break
    default:
      break
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

<style scoped src="./App.css"></style>
