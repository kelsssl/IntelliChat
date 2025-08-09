<!-- App.vue 或主布局文件 -->
<script setup lang="ts">
import LeftSidebar from './components/LeftSidebar.vue'
import ChatList from './components/ChatList.vue'
</script>

<template>
  <div id="app-layout">
    <LeftSidebar />
    <ChatList />
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<style>
/* 重置所有元素的默认样式 */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 确保 html 和 body 占满全屏且无滚动条 */
html {
  height: 100%;
  overflow: hidden; /* 防止整体页面滚动 */
}

body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden; /* 防止 body 滚动 */
}

/* Vue 根元素 */
#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* 主布局容器 - 关键修复 */
#app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden; /* 防止水平滚动 */
  position: fixed; /* 固定定位，确保不会移动 */
  top: 0;
  left: 0;
}

/* 左侧边栏 */
.left-sidebar {
  width: 80px; /* 使用固定宽度而不是 flex-basis */
  flex-shrink: 0;
  background-color: #2c3e50;
  height: 100vh;
  overflow: hidden;
}

/* 聊天列表 */
.chat-list-panel {
  width: 280px; /* 使用固定宽度 */
  flex-shrink: 0;
  background-color: #ecf0f1;
  border-right: 1px solid #bdc3c7;
  height: 100vh;
  overflow-y: auto; /* 只允许垂直滚动 */
  overflow-x: hidden; /* 禁用水平滚动 */
}

/* 主内容区 - 占据剩余全部空间 */
.main-content {
  flex: 1;
  height: 100vh;
  overflow: hidden; /* 防止内容溢出 */
  background-color: #ffffff;
  /* 确保宽度计算正确 */
  width: calc(100vw - 360px); /* 100vw - 80px(sidebar) - 280px(chatlist) */
  min-width: 0;
}

/* 响应式处理 */
@media (max-width: 768px) {
  .left-sidebar {
    width: 60px;
  }

  .chat-list-panel {
    width: 200px;
  }

  .main-content {
    width: calc(100vw - 260px);
  }
}

@media (max-width: 640px) {
  /* 移动端隐藏侧边栏，全屏显示聊天 */
  .left-sidebar,
  .chat-list-panel {
    display: none;
  }

  .main-content {
    width: 100vw;
  }
}
</style>
