<template>
  <div class="pdf-tools">
    <div class="pdf-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'image'"
        :class="['pdf-tab', { active: activeTab === 'image' }]"
        @click="activeTab = 'image'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        PDF 转图片
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'word'"
        :class="['pdf-tab', { active: activeTab === 'word' }]"
        @click="activeTab = 'word'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        PDF 转 Word
      </button>
    </div>

    <div class="pdf-tab-content">
      <PdfToImage v-if="activeTab === 'image'" />
      <PdfToWord v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'

const PdfToImage = defineAsyncComponent(() => import('./PdfToImage.vue'))
const PdfToWord = defineAsyncComponent(() => import('./PdfToWord.vue'))

const activeTab = ref<'image' | 'word'>('image')
</script>

<style scoped>
.pdf-tools {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.pdf-tabs {
  display: flex;
  gap: 2px;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 16px;
  width: fit-content;
}

.pdf-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  cursor: pointer;
  transition: all .2s;
}

.pdf-tab:hover {
  color: #374151;
}

.pdf-tab.active {
  color: #1677ff;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}

.pdf-tab-content {
  min-height: 200px;
}
</style>
