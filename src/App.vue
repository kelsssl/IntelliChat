<template>
  <div id="app">
    <div class="main-layout">
      <!-- 左侧功能栏 -->
      <div :class="['sidebar', { 'sidebar-hidden': !sidebarOpen }]">
        <ChatList v-if="sidebarOpen" @toggle-sidebar="toggleSidebar" />
      </div>

      <!-- 右侧内容区域 -->
      <div class="main-content">
        <!-- 顶部工具栏 -->
        <header class="top-header">
          <div class="header-left">
            <button
              v-if="!sidebarOpen"
              @click="toggleSidebar"
              class="menu-toggle-btn"
              title="显示侧边栏"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <!-- 只在对话页面显示标题 -->
            <h1 v-if="currentChatTitle" class="current-chat-title">
              {{ currentChatTitle }}
            </h1>
          </div>
        </header>

        <!-- 路由视图 - 保留您的路由系统 -->
        <main class="content-area">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useChatStore } from './stores/chat'
import ChatList from './components/ChatList.vue'

// 保留您的所有现有配置
const route = useRoute()
const chatStore = useChatStore()
const { currentChat } = storeToRefs(chatStore)

// 侧边栏状态
const sidebarOpen = ref(true)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

// 当前对话标题
const currentChatTitle = computed(() => {
  // 只在对话页面显示标题
  if (route.name === 'chat' && currentChat.value) {
    return currentChat.value.title || '新对话'
  }
  return null
})
</script>

<style>
/* --- 1. 全局样式重置与盒模型统一 --- */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box; /* 关键！确保 padding 和 border 不会增加元素尺寸 */
}

html,
body {
  height: 100%;
  overflow: hidden; /* 防止 body 产生滚动条 */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* --- 2. 根应用容器布局 --- */
#app {
  width: 100%;
  height: 100%;
  display: flex; /* 让 #app 自身成为 flex 容器 */
}

/* --- 3. 主布局容器 (不再需要 100vh) --- */
.main-layout {
  display: flex;
  width: 100%; /* 占满 #app 的宽度 */
  height: 100%; /* 占满 #app 的高度 */
  background-color: #f9fafb;
}

/* --- 4. 侧边栏样式 (几乎不变) --- */
.sidebar {
  width: 320px;
  background-color: white;
  border-right: 1px solid #e5e7eb;
  transition: width 0.3s ease; /* 过渡效果改为 width */
  display: flex;
  flex-direction: column;
  flex-shrink: 0; /* 关键！防止侧边栏被意外压缩 */
}

.sidebar-hidden {
  width: 0;
  /* 隐藏时添加一些额外样式，防止内容溢出 */
  overflow: hidden;
  border-right: none;
}

/* --- 5. 主内容区域 (最核心的修改) --- */
.main-content {
  flex: 1; /* 自动占据所有剩余空间 */
  display: flex;
  flex-direction: column;
  /* overflow: hidden; */ /* 暂时移除，让子元素滚动 */
  min-width: 0; /* 关键！防止被子元素撑开 */
}

/* 顶部工具栏 (不变) */
.top-header {
  height: 56px;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
}

/* 内容区域 (不变) */
.content-area {
  flex: 1;
  overflow: hidden; /* 关键！让这个容器负责内部滚动 */
}

.content-area > * {
  height: 100%;
  width: 100%;
}

/* --- 6. 其他所有样式保持不变 --- */
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.menu-toggle-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: background-color 0.2s ease;
}
.menu-toggle-btn:hover {
  background-color: #f3f4f6;
}
.menu-toggle-btn svg {
  width: 20px;
  height: 20px;
}
.current-chat-title {
  font-size: 16px;
  font-weight: 500;
  color: #111827;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 768px) {
  .sidebar {
    width: 280px;
  }
  .current-chat-title {
    font-size: 14px;
    max-width: 200px;
  }
}
</style>
