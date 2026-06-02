<template>
  <div class="base64-file-tools">
    <div class="base64-file-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'decode'"
        :class="['base64-file-tab', { active: activeTab === 'decode' }]"
        @click="activeTab = 'decode'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        Base64转文件
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'encode'"
        :class="['base64-file-tab', { active: activeTab === 'encode' }]"
        @click="activeTab = 'encode'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        文件转Base64
      </button>
    </div>

    <div class="base64-file-tab-content">
      <Base64ToFileTool v-if="activeTab === 'decode'" />
      <FileToBase64Tool v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Base64ToFileTool from './Base64ToFileTool.vue'
import FileToBase64Tool from './FileToBase64Tool.vue'

const activeTab = ref<'decode' | 'encode'>('decode')
</script>

<style scoped>
.base64-file-tools {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.base64-file-tabs {
  display: flex;
  gap: 2px;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 3px;
  width: fit-content;
  margin-bottom: 12px;
}

.base64-file-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.base64-file-tab:hover {
  color: #374151;
}

.base64-file-tab.active {
  background: #fff;
  color: #1677ff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.base64-file-tab-content {
  display: flex;
  flex-direction: column;
}
</style>
