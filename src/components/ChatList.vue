<template>
  <div class="chat-list-container">
    <!-- 顶部区域 -->
    <div class="chat-list-header">
      <div class="header-title-row">
        <h1 class="app-title">Claude</h1>
        <button @click="$emit('toggle-sidebar')" class="close-sidebar-btn" title="隐藏侧边栏">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      <button @click="handleCreateNewChat" class="new-chat-button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        New chat
      </button>
    </div>

    <!-- 导航菜单 -->
    <div class="nav-menu">
      <div class="nav-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span>Chats</span>
      </div>
      <div class="nav-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
        <span>Artifacts</span>
      </div>
    </div>

    <!-- 对话历史 - 保留您的所有逻辑 -->
    <div class="chat-history">
      <div class="section-title">Recents</div>

      <div v-if="chatList.length > 0" class="chat-list">
        <div
          v-for="chat in chatList"
          :key="chat.id"
          :class="['chat-item', { 'chat-item-active': currentChatId === chat.id }]"
        >
          <div class="chat-content" @click="navigateToChat(chat.id)">
            <div class="chat-title">{{ chat.title || '新对话' }}</div>
            <div class="chat-preview">{{ getLastMessage(chat) }}</div>
            <div class="chat-time">{{ formatTime(chat.updatedAt) }}</div>
          </div>

          <!-- 选项按钮 -->
          <button @click.stop="toggleMenu(chat.id)" class="chat-options-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
              />
            </svg>
          </button>

          <!-- 下拉菜单 -->
          <div v-if="openedMenuId === chat.id" class="options-dropdown">
            <div class="dropdown-item" @click="handleRename(chat.id)">重命名</div>
            <div class="dropdown-item delete-item" @click="handleDelete(chat.id)">删除</div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p>没有历史会话</p>
        <span>创建新对话开始聊天</span>
      </div>
    </div>

    <!-- 底部设置 -->
    <div class="sidebar-footer">
      <div class="nav-item" @click="openSettings">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>Settings</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '../stores/chat'
import type { Chat } from '../types'
import { useRouter } from 'vue-router'

const chatStore = useChatStore()
const router = useRouter()
const { chatList, currentChatId } = storeToRefs(chatStore)

const openedMenuId = ref<string | null>(null)

const toggleMenu = (chatId: string) => {
  openedMenuId.value = openedMenuId.value === chatId ? null : chatId
}

const navigateToChat = (chatId: string) => {
  openedMenuId.value = null
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

    if (currentChatId.value === chatId) {
      if (chatList.value.length > 0) {
        router.push(`/chat/${chatList.value[0].id}`)
      } else {
        router.push(`/`)
      }
    }
  }
  openedMenuId.value = null
}

const openSettings = () => {
  console.log('打开设置')
}

// 工具函数
const getLastMessage = (chat: Chat) => {
  if (!chat.messages || chat.messages.length === 0) return '暂无消息'
  const lastMsg = chat.messages[chat.messages.length - 1]
  return lastMsg.content.slice(0, 40) + (lastMsg.content.length > 40 ? '...' : '')
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

defineEmits(['toggle-sidebar'])
</script>

<style>
/* ChatList 专用样式 */
.chat-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: white;
}

/* 顶部区域 */
.chat-list-header {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.header-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.close-sidebar-btn {
  width: 32px;
  height: 32px;
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

.close-sidebar-btn:hover {
  background-color: #f3f4f6;
}

.close-sidebar-btn svg {
  width: 16px;
  height: 16px;
}

.new-chat-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #eff6ff;
  color: #1d4ed8;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.new-chat-button:hover {
  background-color: #dbeafe;
}

.new-chat-button svg {
  width: 20px;
  height: 20px;
}

/* 导航菜单 */
.nav-menu {
  padding: 8px 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  color: #374151;
  transition: background-color 0.2s ease;
}

.nav-item:hover {
  background-color: #f9fafb;
}

.nav-item svg {
  width: 16px;
  height: 16px;
}

/* 对话历史 */
.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.section-title {
  font-size: 12px;
  color: #6b7280;
  margin: 16px 0 8px 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chat-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.chat-item:hover {
  background-color: #f9fafb;
}

.chat-item-active {
  background-color: #eff6ff;
  border-left-color: #3b82f6;
}

.chat-content {
  flex: 1;
  min-width: 0;
}

.chat-title {
  font-weight: 500;
  color: #111827;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.chat-preview {
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.chat-time {
  font-size: 11px;
  color: #9ca3af;
}

.chat-options-btn {
  opacity: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.chat-item:hover .chat-options-btn {
  opacity: 1;
}

.chat-options-btn:hover {
  background-color: #e5e7eb;
}

.chat-options-btn svg {
  width: 14px;
  height: 14px;
}

/* 下拉菜单 */
.options-dropdown {
  position: absolute;
  right: 8px;
  top: 100%;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 120px;
  overflow: hidden;
}

.dropdown-item {
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f9fafb;
}

.delete-item {
  color: #dc2626;
}

.delete-item:hover {
  background-color: #fee2e2;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;
  color: #6b7280;
}

.empty-state svg {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
  margin-bottom: 4px;
}

.empty-state span {
  font-size: 12px;
  opacity: 0.7;
}

/* 底部设置 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #f3f4f6;
}

/* 滚动条样式 */
.chat-history::-webkit-scrollbar {
  width: 6px;
}

.chat-history::-webkit-scrollbar-track {
  background: transparent;
}

.chat-history::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.chat-history::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>
