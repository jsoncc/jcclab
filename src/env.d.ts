/// <reference types="vite/client" />
/** Vue 单文件组件、Vite 注入的环境变量类型声明 */

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_BAIDU_TRANSLATE_URL?: string
  /** Cloudflare Worker 的统计根 URL 或完整 /stats 地址。 */
  readonly VITE_SITE_STATS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
