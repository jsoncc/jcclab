<template>
  <div class="home">
    <h1 class="page-title">主页</h1>
    
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
    </div>

    <!-- 点击后，渲染对应 md 内容 -->
    <MarkdownViewer v-if="showViewer" :mdContent="currentMdContent" @close="closeViewer" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import MarkdownViewer from './components/MarkdownViewer.vue'

// 使用 import.meta.glob 自动读取 assets/history 目录下的所有 md 文件（作为原始文本）
const historyFiles = import.meta.glob('./assets/history/*.md', { eager: true, query: '?raw', import: 'default' })

// 读取 assets/blog 目录下的所有 md 文件
const blogFiles = import.meta.glob('./assets/blog/*.md', { eager: true, query: '?raw', import: 'default' })

// 读取 assets/command 目录下的所有 md 文件
const commandFiles = import.meta.glob('./assets/command/*.md', { eager: true, query: '?raw', import: 'default' })

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

// 关闭详情弹窗
const closeViewer = () => {
  showViewer.value = false
  currentMdContent.value = ''
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
}
.page-title {
  text-align: center;
  font-size: 32px;
  margin-bottom: 30px;
  color: #1f2937;
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
</style>
