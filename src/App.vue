<template>
  <div class="home">
    <h1>主页</h1>

    <div class="list">
      <div class="item" v-for="item in list" :key="item.date">
        <a
          :href="item.path"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ item.title }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
const list = [
  {
    date: '2026-03-31',
    title: '历史上的今天 · 3月31日',
    path: '/pages/History31'
  },
  {
    date: '2026-03-30',
    title: '历史上的今天 · 3月30日',
    path: '/pages/History30'
  }
]
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}
h1 {
  text-align: center;
  margin-bottom: 30px;
}
.item {
  padding: 14px 0;
  border-bottom: 1px solid #eee;
}
a {
  font-size: 16px;
  color: #3b82f6;
  text-decoration: none;
}
</style>
