<template>
  <div class="home" :data-theme="themeKey">
    <header class="page-header">
      <div class="header-left">
        <button
          type="button"
          class="home-link"
          title="返回首页"
          @click="router.push('/')"
        >
          <Icon :icon="homeIcon" class="home-link-icon" aria-hidden="true" />
        </button>
      </div>
      <p class="header-time">
        <Icon class="header-time-icon" :icon="calendarClockOutlineIcon" aria-hidden="true" />
        <button type="button" class="header-time-btn" @click="showPerpetualCalendar = true">
          {{ nowText }}
        </button>
      </p>
      <div class="header-right">
        <div class="header-search">
          <input
            v-model="headerSearchKeyword"
            class="header-search-input"
            type="search"
            placeholder="搜索站内内容、文档与工具"
            @focus="onHeaderSearchFocus"
            @blur="onHeaderSearchBlur"
            @keydown.enter.prevent="runHeaderSearchEnter"
          />
          <div v-if="showHeaderSearchPanel" class="header-search-panel" role="listbox" aria-label="全站速查建议">
            <button
              v-for="item in headerSearchResults"
              :key="item.key"
              type="button"
              class="header-search-item"
              @mousedown.prevent="applyHeaderSearchItem(item)"
            >
              <span class="header-search-item-title">{{ item.title }}</span>
              <span class="header-search-item-meta">{{ item.meta }}</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="page-main">
      <div class="content-layout" :class="{ 'no-sidebar': isBlogPost }">
        <aside v-if="!isBlogPost" class="module-sidebar">
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
                    <button
                      type="button"
                      class="sidebar-dropdown-item"
                      :class="{ active: activeModule === 'formatCheck' && activeTool === 'base64Decode' }"
                      @click="openTool('base64Decode')"
                    >
                      在线Base64编解码
                    </button>
                    <button
                      type="button"
                      class="sidebar-dropdown-item"
                      :class="{ active: activeModule === 'formatCheck' && activeTool === 'base64File' }"
                      @click="openTool('base64File')"
                    >
                      Base64转文件
                    </button>
                    <button
                      type="button"
                      class="sidebar-dropdown-item"
                      :class="{ active: activeModule === 'formatCheck' && activeTool === 'pdfTools' }"
                      @click="openTool('pdfTools')"
                    >
                      PDF转换
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
        <BlogPost v-if="isBlogPost" />
        <template v-else>
        <template v-for="module in listModules" :key="module.key">
          <div v-if="showModule(module.key)" class="list-card">
            <h2 class="module-title">
              {{ module.title }}
              <!-- 隐藏今日热榜模块（2026-07-19）
              <button
                v-if="module.key === 'hotnews' && hasHotnewsHistory"
                type="button"
                class="hotnews-history-toggle"
                :title="showHotnewsHistory ? '收起历史' : '查看历史'"
                @click="showHotnewsHistory = !showHotnewsHistory"
              >
                {{ showHotnewsHistory ? '收起 ▲' : '查看历史 ▼' }}
              </button>
              -->
            </h2>
            <div v-if="module.key === 'vpn' && activeModule === 'vpn'" class="inline-md">
              <h3 v-if="latestVpnTitle" class="inline-md-title">{{ latestVpnTitle }}</h3>
              <div class="inline-md-content" v-html="latestVpnHtml" />
            </div>
            <template v-else-if="module.key === 'blog'">
              <template v-for="group in blogGroups" :key="group.label">
                <h3 class="list-group-title">{{ group.label }}</h3>
                <div class="list-item" v-for="item in group.items" :key="item.path">
                  <a
                    :href="`#/blog/${item.name}`"
                    class="date-link"
                    @click.prevent="openModuleItem('blog', item.path)"
                  >
                    {{ item.name }}
                  </a>
                </div>
              </template>
            </template>
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
          <MyBatisSqlFormatter v-else-if="activeTool === 'mybatisSql'" />
          <Base64Decoder v-else-if="activeTool === 'base64Decode'" />
          <Base64FileTool v-else-if="activeTool === 'base64File'" />
          <PdfTools v-else-if="activeTool === 'pdfTools'" />
        </div>
        </template>
        </div>
      </div>
    </main>

    <footer class="page-footer" :class="{ collapsed: footerCollapsed }">
      <div class="footer-toggle" @click="footerCollapsed = !footerCollapsed" title="切换页脚">
        <Icon :icon="chevronDownIcon" class="footer-toggle-icon" :class="{ rotated: !footerCollapsed }" aria-hidden="true" />
      </div>
      <div class="page-footer-inner" v-show="!footerCollapsed">
        <p class="footer-line">
          <span>每天都有新内容</span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a
            class="footer-link footer-email-link"
            href="mailto:13233768245@163.com"
            title="13233768245@163.com"
          >
            <Icon :icon="emailOutlineIcon" class="footer-email-icon" aria-hidden="true" /> 邮箱</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a
            class="footer-link"
            href="https://github.com/jsoncc/jcclab"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon :icon="githubIcon" class="footer-github-icon" aria-hidden="true" /> GitHub</a>
        </p>
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

      <div class="theme-tool">
        <button
          type="button"
          class="floating-tool-btn theme-btn"
          title="切换主题"
          aria-label="切换主题"
          @click.stop="showThemePicker = !showThemePicker"
        >
          <Icon v-if="themeKey === 'dark'" class="theme-icon" :icon="themeNightIcon" aria-hidden="true" />
          <Icon v-else class="theme-icon" :icon="themeSunnyIcon" aria-hidden="true" />
        </button>
        <div v-if="showThemePicker" class="theme-picker" @click.stop>
          <button
            v-for="t in themes"
            :key="t.key"
            type="button"
            class="theme-option"
            :class="{ active: themeKey === t.key }"
            @click="setTheme(t.key)"
          >
            <span class="theme-swatch" :style="{ background: t.color }"></span>
            <span class="theme-label">{{ t.label }}</span>
          </button>
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

    <PerpetualCalendar v-if="showPerpetualCalendar" @close="showPerpetualCalendar = false" />

    <!-- 点击后，渲染对应 md / html 内容 -->
    <MarkdownViewer
      v-if="showViewer"
      :mdContent="currentMdContent"
      :blogHtml="currentBlogHtml"
      @close="closeViewer"
    />
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
  watch,
  type CSSProperties,
  type VNodeRef
} from 'vue'
import { defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import pinTopIcon from '@iconify-icons/radix-icons/pin-top'
import chevronDownIcon from '@iconify-icons/radix-icons/chevron-down'
import qrcodeIcon from '@iconify-icons/mdi/qrcode'
import starOutlineIcon from '@iconify-icons/mdi/star-outline'
import themeSunnyIcon from '@iconify-icons/mdi/weather-sunny'
import themeNightIcon from '@iconify-icons/mdi/weather-night'
import githubIcon from '@iconify-icons/mdi/github'
import emailOutlineIcon from '@iconify-icons/mdi/email-outline'
import homeIcon from '@iconify-icons/mdi/home-outline'
import calendarClockOutlineIcon from '@iconify-icons/mdi/calendar-clock-outline'
import CryptoJS from 'crypto-js'
import { marked } from './utils/markedConfig'
const MarkdownViewer = defineAsyncComponent(() => import('./components/MarkdownViewer.vue'))
import JsonFormatValidator from './components/JsonFormatValidator.vue'
import UuidGenerator from './components/UuidGenerator.vue'
import MyBatisSqlFormatter from './components/MyBatisSqlFormatter.vue'
import Base64Decoder from './components/Base64Decoder.vue'
import Base64FileTool from './components/Base64FileTool.vue'
const PdfTools = defineAsyncComponent(() => import('./components/PdfTools.vue'))
const PerpetualCalendar = defineAsyncComponent(() => import('./components/PerpetualCalendar.vue'))
import homeQrcodeImg from './assets/images/home/qrcode.png'
import { rawFromGlob, stemFromGlobPath } from './utils/sharedGlob'
const BlogPost = defineAsyncComponent(() => import('./views/BlogPost.vue'))

/** Vite ?raw 导入在 eager glob 里可能是 string 或 { default: string } */
type GlobRawModule = string | { default: string }
type RawMdMap = Record<string, GlobRawModule>

type ModuleTabKey = 'all' | 'blog' | 'vpn' | 'formatCheck' | 'translate'
type ActiveToolKey = 'formatCheck' | 'uuid' | 'mybatisSql' | 'base64Decode' | 'base64File' | 'pdfTools'

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

const vpnFiles = import.meta.glob('./assets/vpn/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as RawMdMap

// 隐藏今日热榜模块（2026-07-19）
// const hotnewsFiles = import.meta.glob('./assets/hotnews/*.md', {
//   eager: true,
//   query: '?raw',
//   import: 'default'
// }) as RawMdMap

type BlogGroup = { label: string; items: { name: string; path: string }[] }
type MdStemItem = { name: string; path: string }

const groupKey = (name: string): string => {
  if (name.startsWith('Git') || name.startsWith('GIT_')) return 'Git'
  if (name.startsWith('GitHub')) return 'GitHub'
  if (name.startsWith('OpenCode') || name.startsWith('opencode')) return 'OpenCode'
  return '其他'
}

const groupOrder: Record<string, number> = {
  'Git': 1,
  'GitHub': 2,
  'OpenCode': 3,
  '其他': 4
}

const blogGroups = computed((): BlogGroup[] => {
  const groups = new Map<string, { name: string; path: string }[]>()
  for (const path of Object.keys(blogFiles)) {
    const name = stemFromGlobPath(path, 'md')
    if (!name) continue
    const key = groupKey(name)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push({ name, path })
  }
  for (const items of groups.values()) {
    items.sort((a, b) => a.name.localeCompare(b.name))
  }
  return Array.from(groups.entries())
    .sort((a, b) => (groupOrder[a[0]] ?? 99) - (groupOrder[b[0]] ?? 99))
    .map(([label, items]) => ({ label, items }))
})
const vpnList = computed((): MdStemItem[] =>
  Object.keys(vpnFiles)
    .map((path) => {
      const name = stemFromGlobPath(path, 'md')
      return name ? { name, path } : null
    })
    .filter((item): item is MdStemItem => item !== null)
    .sort((a, b) => b.name.localeCompare(a.name))
)

// 隐藏今日热榜模块（2026-07-19）
// const hotnewsList = computed((): MdStemItem[] =>
//   Object.keys(hotnewsFiles)
//     .map((path) => {
//       const name = stemFromGlobPath(path, 'md')
//       return name ? { name, path } : null
//     })
//     .filter((item): item is MdStemItem => item !== null)
//     .sort((a, b) => b.name.localeCompare(a.name))
// )
//
// /** 今日热榜：仅展示当天（北京时间）的文件；找不到则 fallback 到最新一条 */
// const todayHotnews = computed((): MdStemItem | null => {
//   const today = new Intl.DateTimeFormat('en-CA', {
//     timeZone: 'Asia/Shanghai',
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit'
//   }).format(new Date())
//   return (
//     hotnewsList.value.find((item) => item.name === `hotnews-${today}.md`) ??
//     hotnewsList.value[0] ??
//     null
//   )
// })
//
// /** 是否有多条历史（用于决定是否显示"查看历史"按钮） */
// const hasHotnewsHistory = computed(() => hotnewsList.value.length > 1)
//
// /** 是否展开历史列表（默认收起） */
// const showHotnewsHistory = ref(false)

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
const route = useRoute()
const router = useRouter()
const isBlogPost = computed(() => route.name === 'blog-post')
const currentMdContent = ref('')
const currentBlogHtml = ref('')
const showViewer = ref(false)
const activeModule = ref<ModuleTabKey>('all')
const activeTool = ref<ActiveToolKey>('formatCheck')
const toolsMenuOpen = ref(false)
const toolsMenuTimer = ref(0)
const toolsAnchorRef = ref<HTMLButtonElement | null>(null)
const nowText = ref('')
let clockTimer = 0
const showThemePicker = ref(false)
/** 旧主题值迁移：default/sunset/desert → light，dark → dark，无值 → light */
const migrateTheme = (v: string | null): 'light' | 'dark' =>
  v === 'dark' ? 'dark' : 'light'
const themeKey = ref<'light' | 'dark'>(migrateTheme(localStorage.getItem('theme')))
const footerCollapsed = ref(true)

/**
 * 主题色板：浅色（白纸极简）/ 深色（深夜蓝，参考 doc2md）
 */
const themes = [
  {
    key: 'light', label: '浅色',
    bgPrimary: '#f6f8fa', bgSecondary: '#f8fafc', bgTertiary: '#f6f8fa', bgCard: '#ffffff',
    textPrimary: '#1f2937', textSecondary: '#64748b', textMuted: '#6b7280', textHeading: '#1f2328',
    borderColor: '#e2e8f0', borderColorLight: '#d0d7de', borderColorInput: '#d0d7de',
    linkColor: '#0969da', linkHover: '#1d4ed8',
    accentBlue: '#1677ff', accentSuccess: '#16a34a', accentWarning: '#f59e0b', accentError: '#dc2626',
    accentActive: '#dbeafe', onAccent: '#ffffff',
    color: '#ffffff'
  },
  {
    key: 'dark', label: '深色',
    bgPrimary: '#2a2a2c', bgSecondary: '#343438', bgTertiary: '#262628', bgCard: '#2a2a2c',
    textPrimary: '#e8e8e8', textSecondary: '#9aa0a6', textMuted: '#8b8b90', textHeading: '#e8e8e8',
    borderColor: '#3f3f42', borderColorLight: '#4a4a4e', borderColorInput: '#4a4a4e',
    linkColor: '#58a6ff', linkHover: '#79b8ff',
    accentBlue: '#3b82f6', accentSuccess: '#22c55e', accentWarning: '#fbbf24', accentError: '#f87171',
    accentActive: '#1d4ed8', onAccent: '#ffffff',
    color: '#2a2a2c'
  },
]

watch(themeKey, (val) => {
  localStorage.setItem('theme', val)
  const theme = themes.find(t => t.key === val)
  if (!theme) return
  const root = document.documentElement
  root.style.setProperty('--bg-primary', theme.bgPrimary)
  root.style.setProperty('--bg-secondary', theme.bgSecondary)
  root.style.setProperty('--bg-tertiary', theme.bgTertiary)
  root.style.setProperty('--bg-card', theme.bgCard)
  root.style.setProperty('--text-primary', theme.textPrimary)
  root.style.setProperty('--text-secondary', theme.textSecondary)
  root.style.setProperty('--text-muted', theme.textMuted)
  root.style.setProperty('--text-heading', theme.textHeading)
  root.style.setProperty('--border-color', theme.borderColor)
  root.style.setProperty('--border-color-light', theme.borderColorLight)
  root.style.setProperty('--border-color-input', theme.borderColorInput)
  root.style.setProperty('--link-color', theme.linkColor)
  root.style.setProperty('--link-hover', theme.linkHover)
  root.style.setProperty('--accent-blue', theme.accentBlue)
  root.style.setProperty('--accent-success', theme.accentSuccess)
  root.style.setProperty('--accent-warning', theme.accentWarning)
  root.style.setProperty('--accent-error', theme.accentError)
  root.style.setProperty('--accent-active', theme.accentActive)
  root.style.setProperty('--on-accent', theme.onAccent)
  root.style.colorScheme = val === 'dark' ? 'dark' : 'light'
}, { immediate: true })

const setTheme = (key: string) => {
  if (key === 'dark' || key === 'light') themeKey.value = key
  showThemePicker.value = false
}

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
  // { key: 'history', label: '历史上的今天' }, // 暂时隐藏
  { key: 'blog', label: '博客' },
  // { key: 'command', label: '命令' }, // 已移除，内容已拆分到博客模块
  // { key: 'vpn', label: '科学上网' }, // 已隐藏
  { key: 'formatCheck', label: '工具集合' },
  { key: 'translate', label: '翻译' }
]

/** 「全部」时所有模块都显示；选中某一模块时只显示该块
 * 接受 ListModuleKey 和 ModuleTabKey 两种类型
 */
const showModule = (moduleKey: ListModuleKey | ModuleTabKey) =>
  activeModule.value === 'all' || activeModule.value === moduleKey

const openToolsDefault = () => {
  footerCollapsed.value = true
  activeModule.value = 'formatCheck'
  activeTool.value = 'formatCheck'
}

const openTool = (toolKey: ActiveToolKey) => {
  footerCollapsed.value = true
  activeModule.value = 'formatCheck'
  activeTool.value = toolKey
  toolsMenuOpen.value = false
}

const toolsTitle = computed(() => {
  if (activeTool.value === 'uuid') return 'UUID在线生成'
  if (activeTool.value === 'mybatisSql') return 'MyBatis SQL日志格式化'
  if (activeTool.value === 'base64Decode') return '在线Base64编解码工具'
  if (activeTool.value === 'base64File') return 'Base64转文件'
  if (activeTool.value === 'pdfTools') return 'PDF 转换'
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
const showPerpetualCalendar = ref(false)

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

/**
 * 生产环境常见误填：漏写协议（如 xxx.workers.dev）或带尾斜杠。
 * 这里做一次归一化，降低 Secrets 配置错误导致的 Failed to fetch。
 */
const normalizeHttpUrl = (raw: string | undefined | null) => {
  const s = String(raw || '').trim()
  if (!s) return ''
  const withProtocol =
    /^https?:\/\//i.test(s) ? s : s.startsWith('//') ? `https:${s}` : `https://${s}`
  return withProtocol.replace(/\/+$/, '')
}

/** 统计 URL 优先级：VITE_SITE_STATS_URL → VITE_BAIDU_TRANSLATE_URL + /stats → 开发环境 /site-stats（Vite 代理） */
const buildStatsEndpoint = (): string | null => {
  const custom = normalizeHttpUrl(import.meta.env.VITE_SITE_STATS_URL)
  if (custom) {
    return custom.endsWith('/stats') ? custom : `${custom}/stats`
  }
  const base = normalizeHttpUrl(import.meta.env.VITE_BAIDU_TRANSLATE_URL)
  if (base) return base.endsWith('/stats') ? base : `${base}/stats`
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

const onDocumentClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.theme-tool')) showThemePicker.value = false
}

onMounted(() => {
  nowText.value = formatNow()
  clockTimer = window.setInterval(() => {
    nowText.value = formatNow()
  }, 1000) as number

  window.addEventListener('scroll', onWindowScroll, true)
  window.addEventListener('resize', onWindowRelayout)
  window.addEventListener('click', onDocumentClick, true)
  updateBackToTopVisibility()

  void loadSiteStats()
})

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
  if (headerSearchBlurTimer.value) window.clearTimeout(headerSearchBlurTimer.value)
  window.removeEventListener('scroll', onWindowScroll, true)
  window.removeEventListener('resize', onWindowRelayout)
  window.removeEventListener('click', onDocumentClick, true)
})

/** 根据 glob 表中的路径打开 Markdown 弹窗 */
type ListModuleKey = 'blog' | 'vpn'

interface ListModule {
  key: ListModuleKey
  title: string
  items: { key: string; label: string; value: string; href: string }[]
}

type HeaderSearchItem = {
  key: string
  title: string
  meta: string
  tags: string[]
  action: () => void
}

/** 侧栏列表的数据：blog（history 模块已隐藏，command 已拆分，vpn 已隐藏，hotnews 已隐藏） */
const listModules = computed((): ListModule[] => [
  // {
  //   key: 'history',
  //   title: '历史上的今天',
  //   items: dateList.value.map(item => ({
  //     key: item.date,
  //     label: item.date,
  //     value: item.date,
  //     href: `#/history/${item.date}`
  //   }))
  // }, // 暂时隐藏
  // 隐藏今日热榜模块（2026-07-19）
  // {
  //   key: 'hotnews',
  //   title: '今日热榜',
  //   items: (showHotnewsHistory.value
  //     ? hotnewsList.value
  //     : todayHotnews.value
  //       ? [todayHotnews.value]
  //       : []
  //   ).map(item => ({
  //     key: item.path,
  //     label: item.name,
  //     value: item.path,
  //     href: `#/hotnews/${item.name}`
  //   }))
  // },
  {
    key: 'blog',
    title: '博客',
    items: blogGroups.value.flatMap(group =>
      group.items.map(item => ({
        key: item.path,
        label: item.name,
        value: item.path,
        href: `#/blog/${item.name}`
      }))
    )
  },
  // {
  //   key: 'command',
  //   title: '命令',
  //   items: commandList.value.map(item => ({
  //     key: item.path,
  //     label: item.name,
  //     value: item.path,
  //     href: `#/command/${item.name}`
  //   }))
  // }, // 已移除，内容已拆分到博客模块
  // {
  //   key: 'vpn',
  //   title: '科学上网',
  //   items: vpnList.value.map(item => ({
  //     key: item.path,
  //     label: item.name,
  //     value: item.path,
  //     href: `#/vpn/${item.name}`
  //   }))
  // } // 已隐藏
])

const openModuleItem = (moduleKey: ListModuleKey, value: string) => {
  switch (moduleKey) {
    // case 'history':
    //   openMdFromMap(historyFiles, `./assets/history/history-${value}.md`)
    //   break // 已隐藏
    // 隐藏今日热榜模块（2026-07-19）
    // case 'hotnews':
    //   openMdFromMap(hotnewsFiles, value)
    //   break
    case 'blog':
      footerCollapsed.value = true
      const blogName = stemFromGlobPath(value, 'md')
      if (blogName) {
        router.push({ name: 'blog-post', params: { name: blogName } })
      }
      break
    // case 'command':
    //   openMdFromMap(commandFiles, value)
    //   break // 已移除，内容已拆分到博客模块
    // case 'vpn':
    //   openMdFromMap(vpnFiles, value)
    //   break // 已隐藏
    default:
      break
  }
}

const headerSearchKeyword = ref('')
const headerSearchFocused = ref(false)
const headerSearchBlurTimer = ref(0)

const toTool = (tool: ActiveToolKey) => {
  footerCollapsed.value = true
  activeModule.value = 'formatCheck'
  activeTool.value = tool
}

const headerSearchCandidates = computed<HeaderSearchItem[]>(() => [
  {
    key: 'tool-json',
    title: '工具：JSON格式化校验',
    meta: '工具集合',
    tags: ['json', '格式化', '校验', '工具'],
    action: () => toTool('formatCheck')
  },
  {
    key: 'tool-uuid',
    title: '工具：UUID在线生成',
    meta: '工具集合',
    tags: ['uuid', '工具', '生成'],
    action: () => toTool('uuid')
  },
  {
    key: 'tool-mybatis',
    title: '工具：MyBatis SQL日志格式化',
    meta: '工具集合',
    tags: ['mybatis', 'sql', '日志', '工具'],
    action: () => toTool('mybatisSql')
  },
  {
    key: 'tool-base64',
    title: '工具：在线Base64编解码工具',
    meta: '工具集合',
    tags: ['base64', '解码', '编码', 'base64解码', 'base64编码', '在线base64编解码工具', '工具'],
    action: () => toTool('base64Decode')
  },
  {
    key: 'tool-base64-file',
    title: '工具：Base64转文件',
    meta: '工具集合',
    tags: ['base64', '文件', '转文件', '文件转base64', '编码', '下载', '工具'],
    action: () => toTool('base64File')
  },
  {
    key: 'tool-pdf',
    title: '工具：PDF转换（转图片 / 转Word）',
    meta: '工具集合',
    tags: ['pdf', '转图片', '转word', 'png', 'jpeg', 'docx', '转换', '格式转换', '工具'],
    action: () => toTool('pdfTools')
  },
  // ...dateList.value.slice(0, 30).map((item) => ({
  //   key: `history-${item.date}`,
  //   title: `历史上的今天：${item.date}`,
  //   meta: '历史模块',
  //   tags: ['历史', 'history', item.date],
  //   action: () => openModuleItem('history', item.date)
  // })), // 已隐藏
  // 隐藏今日热榜模块（2026-07-19）
  // ...hotnewsList.value.slice(0, 40).map((item) => ({
  //   key: `hotnews-${item.path}`,
  //   title: `今日热榜：${item.name}`,
  //   meta: '热榜模块',
  //   tags: ['热榜', 'hotnews', item.name],
  //   action: () => openModuleItem('hotnews', item.path)
  // })),
  ...blogGroups.value.flatMap(g => g.items).slice(0, 40).map((item) => ({
    key: `blog-${item.path}`,
    title: `博客：${item.name}`,
    meta: '博客模块',
    tags: ['博客', 'blog', item.name],
    action: () => openModuleItem('blog', item.path)
  })),
  // ...commandList.value.slice(0, 40).map((item) => ({
  //   key: `command-${item.path}`,
  //   title: `命令：${item.name}`,
  //   meta: '命令模块',
  //   tags: ['命令', 'command', item.name],
  //   action: () => openModuleItem('command', item.path)
  // })), // 已移除，内容已拆分到博客模块
  // ...vpnList.value.slice(0, 40).map((item) => ({
  //   key: `vpn-${item.path}`,
  //   title: `科学上网：${item.name}`,
  //   meta: '科学上网模块',
  //   tags: ['科学上网', 'vpn', item.name],
  //   action: () => openModuleItem('vpn', item.path)
  // })) // 已隐藏
])

const headerSearchResults = computed(() => {
  const kw = headerSearchKeyword.value.trim().toLowerCase()
  if (!kw) return headerSearchCandidates.value.slice(0, 8)
  return headerSearchCandidates.value
    .filter((item) => {
      const bag = [item.title, item.meta, ...item.tags].join(' ').toLowerCase()
      return bag.includes(kw)
    })
    .slice(0, 8)
})

const showHeaderSearchPanel = computed(
  () => headerSearchFocused.value && headerSearchResults.value.length > 0
)

const onHeaderSearchFocus = () => {
  if (headerSearchBlurTimer.value) window.clearTimeout(headerSearchBlurTimer.value)
  headerSearchFocused.value = true
}

const onHeaderSearchBlur = () => {
  if (headerSearchBlurTimer.value) window.clearTimeout(headerSearchBlurTimer.value)
  headerSearchBlurTimer.value = window.setTimeout(() => {
    headerSearchFocused.value = false
  }, 120)
}

const applyHeaderSearchItem = (item: HeaderSearchItem) => {
  item.action()
  headerSearchFocused.value = false
}

const runHeaderSearchEnter = () => {
  const first = headerSearchResults.value[0]
  if (first) applyHeaderSearchItem(first)
}

const closeViewer = () => {
  showViewer.value = false
  currentMdContent.value = ''
  currentBlogHtml.value = ''
}

// —— 百度翻译（签名在前端；生产需 Worker 或同源代理，见 vite 配置 /baidu-fanyi）——
const translateSource = ref('')
const translateResult = ref('')
const translateLoading = ref(false)
const translateError = ref('')

const baiduAppId = import.meta.env.VITE_BAIDU_APP_ID
const baiduSecret = import.meta.env.VITE_BAIDU_SECRET
const baiduTranslateUrlEnv = normalizeHttpUrl(import.meta.env.VITE_BAIDU_TRANSLATE_URL)

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
