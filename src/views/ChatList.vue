<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '../stores/chat'
import type { Chat } from '../types'
import { useRouter } from 'vue-router'
import {
  ChevronLeftIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline'

const chatStore = useChatStore()
const router = useRouter()
const { chatList, currentChatId } = storeToRefs(chatStore)

//用于控制哪个下拉菜单可见
//如果当前点击的聊天项的菜单已经打开，则关闭它（设置为null）；否则，打开对应的菜单（设置为该聊天项的ID）
const openedMenuId = ref<string | null>(null)
const toggleMenu = (chatId: string) => {
  openedMenuId.value = openedMenuId.value === chatId ? null : chatId
}

//点击内容区域时，关闭任何打开的菜单，并导航到对应的聊天页面
const navigateToChat = (chatId: string) => {
  openedMenuId.value = null
  router.push(`/chat/${chatId}`)
}

//创建新对话：调用pinia管理的createNewChat()
const CreateNewChat = () => {
  openedMenuId.value = null
  const newChatId = chatStore.createNewChat()
  router.push(`/chat/${newChatId}`)
}

const handleRename = (chatId: string) => {
  const chat = chatList.value.find((c) => c.id === chatId)
  if (!chat) return
  //使用浏览器原生的 prompt 对话框
  const newTitle = prompt('请输入新的对话标题:', chat.title)
  if (newTitle) {
    chatStore.renameChat(chatId, newTitle)
  }
  openedMenuId.value = null
}

const handleDelete = (chatId: string) => {
  if (confirm('确定要删除这个对话吗？此操作不可撤销。')) {
    chatStore.deleteChat(chatId)
    //如果删除的是当前正在查看的对话，导航到第一个对话或欢迎页
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

// 工具函数
//在content中预览当前的最新消息摘要
const getLastMessage = (chat: Chat) => {
  if (!chat.messages || chat.messages.length === 0) return '暂无消息'
  //根据数组最后一个元素的索引获取最新消息内容
  const lastMsg = chat.messages[chat.messages.length - 1]
  //截取前40个字符，如果超过则添加省略号
  return lastMsg.content.slice(0, 40) + (lastMsg.content.length > 40 ? '...' : '')
}

//时间戳设置，下面的createdAt时间戳作为实参传入，更新最新消息的时间戳
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  //毫秒
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

//与父组件APP的通信
const emit = defineEmits(['toggle-sidebar', 'open-settings'])

const openSettings = () => {
  // 发出一个事件，让父组件 App.vue 去处理
  emit('open-settings')
}
</script>

<template>
  <div class="chat-list-container">
    <!-- 顶部区域 -->
    <div class="chat-list-header">
      <div class="header-title-row">
        <h1 class="app-title">智聊助手</h1>
        <!-- 向父组件 (App.vue) 通信。触发toggle-sidebar事件，App.vue 监听事件后，就会调用toggleSidebar 方法来收起侧边栏。 -->
        <button @click="$emit('toggle-sidebar')" class="close-sidebar-btn" title="隐藏侧边栏">
          <ChevronLeftIcon class="icon" />
        </button>
      </div>

      <button @click="CreateNewChat" class="new-chat-button">
        <PlusIcon class="icon" />
        New chat
      </button>
    </div>

    <!-- 导航菜单 -->
    <div class="nav-menu">
      <div class="nav-item">
        <ChatBubbleLeftRightIcon class="icon" />
        <span>Chats</span>
      </div>
      <div class="nav-item">
        <ArchiveBoxIcon class="icon" />
        <span>Artifacts</span>
      </div>
    </div>

    <!-- 对话历史 -->
    <div class="chat-history">
      <div class="section-title">Recents</div>

      <div v-if="chatList.length > 0" class="chat-list">
        <!-- v-for遍历chatlist数组，为每一个 chat 对象创建一个列表项 -->
        <!-- 动态绑定class，选中时添加active样式 -->
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
            <EllipsisVerticalIcon class="icon" />
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
        <ChatBubbleLeftRightIcon class="empty-state-icon" />
        <p>没有历史会话</p>
        <span>创建新对话开始聊天</span>
      </div>
    </div>

    <!-- 底部设置 -->
    <div class="sidebar-footer">
      <div class="nav-item" @click="openSettings">
        <Cog6ToothIcon class="icon" />
        <span>Settings</span>
      </div>
    </div>
  </div>
</template>

<style>
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

.close-sidebar-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

/* 统一的图标样式 */
.icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
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
  font-size: 14px;
  text-align: left;
}

.new-chat-button .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.new-chat-button:hover {
  background-color: #dbeafe;
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

.empty-state-icon {
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
