<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useChatStore } from './stores/chat'
import ChatList from './views/ChatList.vue'
import SettingsModal from './components/SettingsModal.vue'
import { Bars3Icon } from '@heroicons/vue/24/outline' //使用Tailwind CSS图标库

const route = useRoute() //获取当前的路由信息
const chatStore = useChatStore()
const { currentChat } = storeToRefs(chatStore) //解构获取当前对话，保持其响应性

// 侧边栏状态
const sidebarOpen = ref(true)

//控制侧边栏是否展开
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

// 控制模态框显示
const isSettingsModalOpen = ref(false)

const handleOpenSettings = () => {
  isSettingsModalOpen.value = true
}

const handleCloseSettings = () => {
  isSettingsModalOpen.value = false
}
</script>

<template>
  <div id="app">
    <div class="main-layout">
      <!-- 左侧功能栏 -->
      <!-- sidebarOpen为false时隐藏侧边栏（默认） -->
      <div :class="['sidebar', { 'sidebar-hidden': !sidebarOpen }]">
        <!-- v-if性能优化：当侧边栏展开时才渲染ChatList组件  -->
        <!-- 自定义事件监听：子组件ChatList通过$emit调用toggle-sidebar时，app调用toggleSidebar打开关闭侧边栏 -->
        <ChatList
          v-if="sidebarOpen"
          @toggle-sidebar="toggleSidebar"
          @open-settings="handleOpenSettings"
        />
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
              <Bars3Icon class="icon" />
            </button>
            <!-- 只在对话页面显示标题 -->
            <h1 v-if="currentChatTitle" class="current-chat-title">
              {{ currentChatTitle }}
            </h1>
          </div>
        </header>

        <!-- 主内容区域 -->
        <main class="content-area">
          <router-view />
        </main>
      </div>
    </div>
    <SettingsModal :is-open="isSettingsModalOpen" @close="handleCloseSettings" />
  </div>
</template>

<style>
/*全局样式*/
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  /* 字体族适配不同操作系统 */
}

/* 根应用容器布局*/
#app {
  width: 100%;
  height: 100%;
  display: flex;
}

/*主布局容器 */
.main-layout {
  display: flex;
  width: 100%; /* 占满 #app 的宽度 */
  height: 100%; /* 占满 #app 的高度 */
  background-color: #f9fafb;
}

/*侧边栏样式*/
.sidebar {
  width: 320px;
  background-color: white;
  border-right: 1px solid #e5e7eb;
  transition: width 0.3s ease; /* 过渡效果*/
  display: flex;
  flex-direction: column; /* 内容垂直排列 */
  flex-shrink: 0;
}
/* 侧边栏隐藏 */
.sidebar-hidden {
  width: 0;
  overflow: hidden;
  border-right: none;
}

/* 主内容区域 */
.main-content {
  flex: 1; /* 自动占据所有剩余空间 */
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 顶部工具栏  */
.top-header {
  height: 56px;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0; /* 不允许缩小 */
}

/* 内容区域 */
.content-area {
  flex: 1; /* 让内容区域占满剩余空间 */
  overflow: hidden; /* 容器内部滚动 */
}

.content-area > * {
  /* 确保子元素占满整个内容区域 */
  height: 100%;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.menu-toggle-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s ease;
}
.menu-toggle-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

/* 统一的图标样式 */
.icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
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

/* CSS 媒体查询：适配移动端和不同大小的浏览器窗口 */
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
