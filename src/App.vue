<template>
  <div class="home">
    <h1 class="page-title">主页</h1>
    <div class="list-card">
      <div class="list-item" v-for="item in dateList" :key="item.date">
        <a 
          :href="`#/history/${item.date}`" 
          class="date-link"
          @click.prevent="goToHistory(item.date)"
        >
          历史上的今天 · {{ item.date }}
        </a>
      </div>
    </div>

    <!-- 点击日期后，渲染对应 md 内容 -->
    <MarkdownViewer v-if="currentMdUrl" :mdUrl="currentMdUrl" @close="closeHistory" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MarkdownViewer from './components/MarkdownViewer.vue'

// 日期列表（和你原 md 文件名一一对应）
const dateList = ref([
  { date: '2026-04-01' },
  { date: '2026-03-31' },
  { date: '2026-03-30' }
])

const currentMdUrl = ref('')

// 点击日期，加载对应 md 文件
const goToHistory = (date) => {
  currentMdUrl.value = `/today-history/history/history-${date}.md`
}

// 关闭历史详情弹窗
const closeHistory = () => {
  currentMdUrl.value = ''
}
</script>

<style scoped>
.home {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}
.page-title {
  text-align: center;
  font-size: 32px;
  margin-bottom: 30px;
  color: #1f2937;
}
.list-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 30px;
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
