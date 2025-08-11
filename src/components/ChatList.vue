<!-- src/components/ChatList.vue -->
<template>
  <div class="chat-list-panel">
    <header>
      <h2>历史会话</h2>
      <button class="new-chat-btn" @click="handleCreateNewChat" title="新对话">+</button>
    </header>
    <ul v-if="chatList.length > 0">
      <li v-for="chat in chatList" :key="chat.id" :class="{ active: currentChatId === chat.id }">
        <div class="chat-item-content" @click="navigateToChat(chat.id)">
          <span class="chat-title">{{ chat.title || '新对话' }}</span>
        </div>
        <!-- "..." 按钮 -->
        <button class="options-btn" @click.stop="toggleMenu(chat.id)">...</button>

        <!-- 下拉菜单 -->
        <div v-if="openedMenuId === chat.id" class="options-menu">
          <div class="menu-item" @click="handleRename(chat.id)">重命名</div>
          <div class="menu-item delete" @click="handleDelete(chat.id)">删除</div>
        </div>
      </li>
    </ul>
    <div v-else class="empty-list">
      <p>没有历史会话</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '../stores/chat'
import { useRouter } from 'vue-router'

const chatStore = useChatStore()
const router = useRouter()

const { chatList, currentChatId } = storeToRefs(chatStore)

// 用于追踪哪个菜单是打开的
const openedMenuId = ref<string | null>(null)

const toggleMenu = (chatId: string) => {
  openedMenuId.value = openedMenuId.value === chatId ? null : chatId
}

const navigateToChat = (chatId: string) => {
  openedMenuId.value = null // 点击导航时关闭菜单
  router.push(`/chat/${chatId}`)
}

const handleCreateNewChat = () => {
  openedMenuId.value = null
  const newChatId = chatStore.createNewChat()
  router.push(`/chat/${newChatId}`)
}

const handleRename = (chatId: string) => {
  const chat = chatList.value.find((c) => c.id === chatId)
  if (!chat) return

  const newTitle = prompt('请输入新的对话标题:', chat.title)
  if (newTitle) {
    chatStore.renameChat(chatId, newTitle)
  }
  openedMenuId.value = null
}

const handleDelete = (chatId: string) => {
  if (confirm('确定要删除这个对话吗？此操作不可撤销。')) {
    chatStore.deleteChat(chatId)

    // 如果删除的是当前对话，需要进行导航
    if (currentChatId.value === chatId) {
      if (chatList.value.length > 0) {
        router.push(`/chat/${chatList.value[0].id}`)
      } else {
        // 如果列表空了，导航到首页
        router.push(`/`)
      }
    }
  }
  openedMenuId.value = null
}
</script>

<style scoped>
/* ... 你之前的样式 ... */
li {
  position: relative; /* 为了定位下拉菜单 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #e9ecef;
}
.chat-item-content {
  flex-grow: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.options-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  margin-left: 8px;
}
.options-btn:hover {
  background-color: #e0e0e0;
}
.options-menu {
  position: absolute;
  right: 1rem;
  top: 2.5rem; /* 根据你的 li 高度微调 */
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  width: 120px;
}
.menu-item {
  padding: 0.5rem 1rem;
}
.menu-item:hover {
  background-color: #f1f1f1;
}
.menu-item.delete {
  color: #d9534f;
}
.empty-list {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}
</style>
