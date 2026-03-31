<template>
  <div class="markdown-viewer">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="markdown-content" v-html="htmlContent"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { marked } from 'marked'

const props = defineProps(['mdUrl']) // 传入 md 文件的路径
const htmlContent = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    // 1. 读取 md 文件内容
    const res = await fetch(props.mdUrl)
    const mdText = await res.text()
    
    // 2. 用 marked 把 Markdown 转成 HTML
    htmlContent.value = marked.parse(mdText)
  } catch (err) {
    htmlContent.value = '<p style="color: red;">文件加载失败</p>'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.markdown-viewer {
  max-width: 900px;
  margin: 0 auto;
  padding: 30px 20px;
}
.loading {
  text-align: center;
  font-size: 18px;
  color: #666;
  padding: 50px 0;
}
.markdown-content {
  line-height: 1.8;
  color: #333;
}
/* 还原 Markdown 原生样式，和你原 md 渲染效果一致 */
.markdown-content h1, .markdown-content h2 {
  margin: 24px 0 12px;
  border-bottom: 1px solid #eee;
  padding-bottom: 6px;
}
.markdown-content ul {
  padding-left: 2em;
  margin: 12px 0;
}
.markdown-content li {
  margin: 8px 0;
}
</style>
