<template>
  <div class="markdown-modal-overlay" @click.self="closeModal">
    <div class="markdown-modal">
      <div class="modal-header">
        <h3 class="modal-title">历史详情</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else class="markdown-content" v-html="htmlContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { marked } from 'marked'

const props = defineProps(['mdUrl']) // 传入 md 文件的路径
const emit = defineEmits(['close']) // 定义关闭事件
const htmlContent = ref('')
const loading = ref(true)

// 关闭弹窗
const closeModal = () => {
  emit('close')
}

// 加载 md 文件的函数
const loadMarkdown = async () => {
  if (!props.mdUrl) return
  
  loading.value = true
  try {
    // 1. 读取 md 文件内容
    const res = await fetch(props.mdUrl)
    let mdText = await res.text()
    
    // 2. 去掉 YAML front matter (--- 之间的内容)
    mdText = mdText.replace(/^---[\s\S]*?---\s*/, '')
    
    // 3. 用 marked 把 Markdown 转成 HTML
    htmlContent.value = marked.parse(mdText)
  } catch (err) {
    htmlContent.value = '<p style="color: red;">文件加载失败</p>'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMarkdown()
})

// 监听 mdUrl 的变化，重新加载内容
watch(() => props.mdUrl, (newUrl, oldUrl) => {
  console.log('mdUrl changed from', oldUrl, 'to', newUrl)
  loadMarkdown()
}, { immediate: true })
</script>

<style scoped>
/* 遮罩层 */
.markdown-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

/* 弹窗容器 */
.markdown-modal {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 900px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 弹窗头部 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  color: #1f2937;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

/* 弹窗内容区 */
.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
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

/* 还原 Markdown 原生样式 */
.markdown-content h1 {
  margin: 0 0 20px 0;
  font-size: 28px;
  color: #1f2937;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 12px;
}

.markdown-content h2 {
  margin: 24px 0 12px;
  font-size: 20px;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

.markdown-content ul {
  padding-left: 2em;
  margin: 12px 0;
}

.markdown-content li {
  margin: 8px 0;
}

.markdown-content p {
  margin: 12px 0;
}
</style>
