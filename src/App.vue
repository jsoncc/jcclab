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
      <!-- 顶栏三列网格：占位右侧 1fr，与时间列、左侧标题区对齐 -->
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
                <!-- 挂到 body，避免侧栏 overflow 把菜单裁掉 -->
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
                    <button
                      type="button"
                      class="sidebar-dropdown-item"
                      :class="{ active: activeModule === 'formatCheck' && activeTool === 'mybatisSql' }"
                      @click="openTool('mybatisSql')"
                    >
                      MyBatis SQL日志格式化
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
          <UuidGenerator v-else-if="activeTool === 'uuid'" />
          <MyBatisSqlFormatter v-else />
        </div>
        </div>
      </div>
    </main>

    <footer class="page-footer">
      <div class="page-footer-inner">
        <div class="footer-top">
          <div class="footer-head">
            <p class="footer-brand">JsonCC Lab</p>
          </div>

          <p class="footer-tagline">
            <span class="footer-tagline-line">作者：JsonCC</span>
            <span class="footer-tagline-sep" aria-hidden="true">·</span>
            <span class="footer-tagline-line">每天都有新内容</span>
          </p>

          <div class="footer-contact" aria-label="联系邮箱">
            <span class="footer-contact-label">邮箱</span>
            <div class="footer-mail-list">
              <a class="footer-mail" href="mailto:13233768245@163.com">13233768245@163.com</a>
              <a class="footer-mail" href="mailto:896415482@qq.com">896415482@qq.com</a>
            </div>
          </div>
        </div>

        <p class="footer-stats" role="status">{{ footerStatsText }}</p>
      </div>
    </footer>

    <div class="floating-tools">
      <button
        type="button"
        class="floating-tool-btn favorite-btn"
        title="收藏本站"
        aria-label="收藏本站"
        @click="addToBookmarks"
      >
        <Icon class="favorite-icon" :icon="starOutlineIcon" aria-hidden="true" />
      </button>

      <div class="qrcode-tool">
        <button
          type="button"
          class="floating-tool-btn qrcode-btn"
          title="更多精彩"
          aria-label="更多精彩"
        >
          <Icon class="qrcode-icon" :icon="qrcodeIcon" aria-hidden="true" />
        </button>
        <div class="qrcode-popover" aria-hidden="true">
          <img class="qrcode-image" :src="homeQrcodeImg" alt="JsonCC Lab 二维码" />
        </div>
      </div>

      <button
        v-show="showBackToTop"
        type="button"
        class="floating-tool-btn back-to-top"
        title="顶一下"
        aria-label="顶一下"
        @click="scrollToTop"
      >
        <Icon class="back-to-top-icon" :icon="pinTopIcon" aria-hidden="true" />
      </button>
    </div>

    <!-- 点击后，渲染对应 md 内容 -->
    <MarkdownViewer v-if="showViewer" :mdContent="currentMdContent" @close="closeViewer" />
  </div>
</template>

<script setup lang="ts">
/**
 * 站点主界面：侧栏切换模块、Markdown 列表/弹窗阅读、百度翻译、JSON/UUID 工具。
 * 业务数据主要来自 src/assets 下各目录的 .md（由 Vite glob 打包）。
 */
import {
  ref,
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  type CSSProperties,
  type VNodeRef
} from 'vue'
import { Icon } from '@iconify/vue'
import pinTopIcon from '@iconify-icons/radix-icons/pin-top'
import qrcodeIcon from '@iconify-icons/mdi/qrcode'
import starOutlineIcon from '@iconify-icons/mdi/star-outline'
import CryptoJS from 'crypto-js'
import { marked } from 'marked'
import MarkdownViewer from './components/MarkdownViewer.vue'
import JsonFormatValidator from './components/JsonFormatValidator.vue'
import UuidGenerator from './components/UuidGenerator.vue'
import MyBatisSqlFormatter from './components/MyBatisSqlFormatter.vue'
import blogMeta from './assets/blog/blog-meta.json'
import homeQrcodeImg from './assets/images/home/qrcode.png'

/** Vite ?raw 导入在 eager glob 里可能是 string 或 { default: string } */
type GlobRawModule = string | { default: string }
type RawMdMap = Record<string, GlobRawModule>

const rawFromGlob = (mod: GlobRawModule | undefined): string => {
  if (mod == null) return ''
  if (typeof mod === 'string') return mod
  return mod.default ?? ''
}

/** 从 glob 的 key（如 `./assets/blog/标题.md`）取出不含扩展名的文件名 */
const stemFromMdGlobPath = (globKey: string): string | null => {
  const m = globKey.match(/\/([^/]+)\.md$/)
  return m ? m[1] : null
}

type ModuleTabKey = 'all' | 'history' | 'blog' | 'command' | 'vpn' | 'formatCheck' | 'translate'
type ActiveToolKey = 'formatCheck' | 'uuid' | 'mybatisSql'

// —— Markdown 原始文件（构建期打包；key 为形如 ./assets/... 的路径）——
const historyFiles = import.meta.glob('./assets/history/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as RawMdMap

const blogFiles = import.meta.glob('./assets/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as RawMdMap

const commandFiles = import.meta.glob('./assets/command/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as RawMdMap

const vpnFiles = import.meta.glob('./assets/vpn/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as RawMdMap

/** 由 scripts/generate-blog-meta.ts 生成：博客文件路径 → 最后更新时间（Unix 秒） */
const blogMetaMap = blogMeta as Record<string, number>

// —— 各模块在侧栏展示的列表（由 glob 的 key 解析而来）——
const dateList = computed(() => {
  const dates = Object.keys(historyFiles)
    .map(path => {
      const match = path.match(/history-(\d{4}-\d{2}-\d{2})\.md$/)
      return match ? match[1] : null
    })
    .filter((date): date is string => date !== null)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map(date => ({ date }))
  
  return dates
})

type BlogListItem = { name: string; path: string; updatedAt: number }
type MdStemItem = { name: string; path: string }

const blogList = computed((): BlogListItem[] => {
  const meta = blogMetaMap
  return Object.keys(blogFiles)
    .map((path) => {
      const name = stemFromMdGlobPath(path)
      if (!name) return null
      return { name, path, updatedAt: Number(meta[path] || 0) }
    })
    .filter((item): item is BlogListItem => item !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt)
})

const commandList = computed((): MdStemItem[] =>
  Object.keys(commandFiles)
    .map((path) => {
      const name = stemFromMdGlobPath(path)
      return name ? { name, path } : null
    })
    .filter((item): item is MdStemItem => item !== null)
)

const vpnList = computed((): MdStemItem[] =>
  Object.keys(vpnFiles)
    .map((path) => {
      const name = stemFromMdGlobPath(path)
      return name ? { name, path } : null
    })
    .filter((item): item is MdStemItem => item !== null)
    .sort((a, b) => b.name.localeCompare(a.name))
)

/** 「科学上网」单模块视图下：默认展开排序后的第一篇（列表按名称排，首项即展示内容） */
const latestVpnTitle = computed(() => vpnList.value[0]?.name || '')

const latestVpnHtml = computed(() => {
  const latestPath = vpnList.value[0]?.path
  if (!latestPath || !vpnFiles[latestPath]) return '<p>暂无文档内容</p>'
  const rawMd = rawFromGlob(vpnFiles[latestPath])
  const cleaned = String(rawMd).replace(/^---[\s\S]*?---\s*/, '')
  return String(marked.parse(cleaned))
})

// —— UI 状态 ——
const currentMdContent = ref('')
const showViewer = ref(false)
const activeModule = ref<ModuleTabKey>('all')
const activeTool = ref<ActiveToolKey>('formatCheck')
const toolsMenuOpen = ref(false)
const toolsMenuTimer = ref(0)
const toolsAnchorRef = ref<HTMLButtonElement | null>(null)
const nowText = ref('')
let clockTimer = 0
const toolsMenuStyle = ref<CSSProperties>({
  position: 'fixed',
  left: '-9999px',
  top: '-9999px',
  width: '220px',
  zIndex: 3000
})

/** 左侧一级导航（顺序即展示顺序） */
const moduleTabs: { key: ModuleTabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'history', label: '历史上的今天' },
  { key: 'blog', label: '博客' },
  { key: 'command', label: '命令' },
  { key: 'vpn', label: '科学上网' },
  { key: 'formatCheck', label: '工具集合' },
  { key: 'translate', label: '翻译' }
]

/** 「全部」时所有模块都显示；选中某一模块时只显示该块 */
const showModule = (moduleKey: ModuleTabKey) =>
  activeModule.value === 'all' || activeModule.value === moduleKey

const openToolsDefault = () => {
  activeModule.value = 'formatCheck'
  activeTool.value = 'formatCheck'
}

const openTool = (toolKey: ActiveToolKey) => {
  activeModule.value = 'formatCheck'
  activeTool.value = toolKey
  toolsMenuOpen.value = false
}

const toolsTitle = computed(() => {
  if (activeTool.value === 'uuid') return 'UUID在线生成'
  if (activeTool.value === 'mybatisSql') return 'MyBatis SQL日志格式化'
  return 'JSON格式化校验'
})

/** 记录「工具集合」按钮的 DOM，用于把下拉菜单对齐到按钮旁 */
const setToolsAnchor: VNodeRef = (el) => {
  toolsAnchorRef.value = el instanceof HTMLButtonElement ? el : null
}

/** 窄屏顶栏 / 宽屏侧栏两种布局下，下拉菜单位置不同 */
const updateToolsMenuPosition = () => {
  const el = toolsAnchorRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const isNarrowTopNav = window.matchMedia('(max-width: 960px)').matches

  if (isNarrowTopNav) {
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
  // 延迟收起，避免从按钮移入菜单时闪断
  toolsMenuTimer.value = window.setTimeout(() => {
    toolsMenuOpen.value = false
  }, 240)
}

const onWindowRelayout = () => {
  if (!toolsMenuOpen.value) return
  updateToolsMenuPosition()
}

const showBackToTop = ref(false)

const updateBackToTopVisibility = () => {
  const top = window.scrollY || document.documentElement.scrollTop || 0
  showBackToTop.value = top >= window.innerHeight * 0.9
}

const onWindowScroll = () => {
  onWindowRelayout()
  updateBackToTopVisibility()
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const addToBookmarks = () => {
  const title = document.title || 'JsonCC Lab'
  const url = window.location.href
  const navWindow = window as Window & {
    external?: { addFavorite?: (bookmarkUrl: string, bookmarkTitle: string) => void }
    sidebar?: { addPanel?: (panelTitle: string, panelUrl: string, panelId: string) => void }
  }

  try {
    if (typeof navWindow.external?.addFavorite === 'function') {
      navWindow.external.addFavorite(url, title)
      return
    }
    if (typeof navWindow.sidebar?.addPanel === 'function') {
      navWindow.sidebar.addPanel(title, url, '')
      return
    }
  } catch {
    // Ignore and fallback to shortcut hint.
  }

  const shortcut = /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? 'Command + D' : 'Ctrl + D'
  window.alert(`请按 ${shortcut} 将本站加入书签`)
}

// —— 页头实时时钟 ——
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

/** 页脚全站 PV/UV：请求 Cloudflare Worker GET /stats（与翻译可共用同一 Worker） */
const footerStatsText = ref('全站访问统计加载中…')

/** 统计 URL 优先级：VITE_SITE_STATS_URL → VITE_BAIDU_TRANSLATE_URL + /stats → 开发环境 /site-stats（Vite 代理） */
const buildStatsEndpoint = (): string | null => {
  const custom = import.meta.env.VITE_SITE_STATS_URL?.trim()
  if (custom) {
    const c = custom.replace(/\/$/, '')
    return c.endsWith('/stats') ? c : `${c}/stats`
  }
  const base = import.meta.env.VITE_BAIDU_TRANSLATE_URL?.trim()
  if (base) return `${base.replace(/\/$/, '')}/stats`
  if (import.meta.env.DEV) return '/site-stats'
  return null
}

const loadSiteStats = async () => {
  const url = buildStatsEndpoint()
  if (!url) {
    footerStatsText.value =
      '全站统计未配置：生产环境请在 Secrets 填写 VITE_BAIDU_TRANSLATE_URL；统计为同 Worker 的 /stats（需 KV）'
    return
  }
  type StatsPayload = {
    totalPv?: number
    totalUv?: number
    configured?: boolean
    message?: string
    error?: string
  }
  try {
    const res = await fetch(url, { credentials: 'include' })
    const data = (await res.json()) as StatsPayload
    if (data.error === 'origin_not_allowed') {
      footerStatsText.value = '统计接口未放行当前站点域名（Worker 变量 STATS_ORIGINS 或代码白名单）'
      return
    }
    if (data.configured === false) {
      footerStatsText.value =
        data.message || '统计未启用：Worker 请绑定 KV（命名空间 binding 为 SITE_STATS，见 workers/README.md）'
      return
    }
    const pv = Number(data.totalPv ?? 0)
    const uv = Number(data.totalUv ?? 0)
    footerStatsText.value = `总访问量 ${pv.toLocaleString('zh-CN')} · 总访客 ${uv.toLocaleString('zh-CN')}`
  } catch {
    footerStatsText.value =
      '全站统计暂时无法加载（检查 Worker、KV；本地需另开终端 wrangler dev 且 Vite 代理 /site-stats）'
  }
}

onMounted(() => {
  nowText.value = formatNow()
  clockTimer = window.setInterval(() => {
    nowText.value = formatNow()
  }, 1000) as number

  window.addEventListener('scroll', onWindowScroll, true)
  window.addEventListener('resize', onWindowRelayout)
  updateBackToTopVisibility()

  void loadSiteStats()
})

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
  window.removeEventListener('scroll', onWindowScroll, true)
  window.removeEventListener('resize', onWindowRelayout)
})

/** 根据 glob 表中的路径打开 Markdown 弹窗 */
const openMdFromMap = (map: RawMdMap, filePath: string) => {
  const mod = map[filePath]
  if (!mod) return
  currentMdContent.value = rawFromGlob(mod)
  showViewer.value = true
}

type ListModuleKey = 'history' | 'blog' | 'command' | 'vpn'

interface ListModule {
  key: ListModuleKey
  title: string
  items: { key: string; label: string; value: string; href: string }[]
}

/** 侧栏四块列表的数据：history / blog / command / vpn（vpn 单开模块时另有内联展示） */
const listModules = computed((): ListModule[] => [
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

const openModuleItem = (moduleKey: ListModuleKey, value: string) => {
  switch (moduleKey) {
    case 'history':
      openMdFromMap(historyFiles, `./assets/history/history-${value}.md`)
      break
    case 'blog':
      openMdFromMap(blogFiles, value)
      break
    case 'command':
      openMdFromMap(commandFiles, value)
      break
    case 'vpn':
      openMdFromMap(vpnFiles, value)
      break
    default:
      break
  }
}

const closeViewer = () => {
  showViewer.value = false
  currentMdContent.value = ''
}

// —— 百度翻译（签名在前端；生产需 Worker 或同源代理，见 vite 配置 /baidu-fanyi）——
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

/** 生产环境未配 VITE_BAIDU_TRANSLATE_URL 时浏览器无法直连百度域名 */
const baiduTranslateNeedsProxy = computed(
  () => import.meta.env.PROD && !baiduTranslateUrlEnv
)

const translateApiUrl = () => {
  if (baiduTranslateUrlEnv) return baiduTranslateUrlEnv
  if (import.meta.env.DEV) return '/baidu-fanyi'
  return ''
}

/** 推断百度 API 的 target：中文为主 → 译成 en；英文为主 → 译成 zh */
const inferTargetLang = (text: string): 'en' | 'zh' | null => {
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

/** 百度通用翻译接口对单次 q 的字节上限（约值，与官方文档一致的量级） */
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
    const data = (await res.json()) as {
      error_code?: string | number
      error_msg?: string
      trans_result?: { dst: string }[]
    }
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
