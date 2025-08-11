<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '../stores/chat'
import { useRoute, useRouter } from 'vue-router'
import type { ApiMessage } from '../types'
import MessageItem from '../components/MessageItem.vue'
import SettingsModal from '../components/SettingsModal.vue'

// Store 和路由初始化
const chatStore = useChatStore()
const route = useRoute()
const router = useRouter()
const { currentChat, isSending, fullMessages } = storeToRefs(chatStore)

// 监听路由变化
watch(
  () => route.params.chatId,
  (newId) => {
    if (newId && typeof newId === 'string') {
      chatStore.setCurrentChat(newId)
    }
  },
  { immediate: true },
)

// 组件挂载
onMounted(() => {
  chatStore.init()
  if (window.innerWidth > 768) {
    inputRef.value?.focus()
  }
})

// 响应式数据
const userInput = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const messageListRef = ref<HTMLDivElement | null>(null)
const isSettingsOpen = ref(false)

// 监听消息变化，自动滚动
watch(
  () => currentChat.value?.messages,
  () => {
    scrollToBottom()
  },
  { deep: true },
)

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// 发送消息
const sendMessage = async () => {
  if (!currentChat.value) {
    alert('错误：请先选择一个对话。')
    return
  }

  const content = userInput.value.trim()
  if (!content || isSending.value) return

  const isFirstUserMessage = currentChat.value.messages.length === 0
  const chatId = currentChat.value.id // 先把 ID 存起来

  chatStore.addUserMessage(content)
  userInput.value = ''
  chatStore.isSending = true

  // 如果是第一条用户消息，立即用这条消息的内容更新标题
  if (isFirstUserMessage) {
    // 截取前 20 个字符作为标题，避免过长
    const newTitle = content.substring(0, 20)
    chatStore.renameChat(chatId, newTitle)
  }

  try {
    const assistantMessage = chatStore.addAssistantMessage()
    if (!assistantMessage) {
      throw new Error('无法创建助手消息')
    }

    const messages: ApiMessage[] = fullMessages.value
      .filter((msg): msg is typeof msg & { role: 'user' | 'assistant' } => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

    const response = await fetch(chatStore.settings.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${chatStore.settings.apiKey}`,
      },
      body: JSON.stringify({
        messages,
        model: 'coze-30b-preview',
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应读取器')
    }

    const decoder = new TextDecoder()
    let accumulatedText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          if (dataStr.trim() === '[DONE]') continue

          try {
            const parsed = JSON.parse(dataStr)
            if (parsed.choices && parsed.choices[0]?.delta?.content) {
              accumulatedText += parsed.choices[0].delta.content
              chatStore.updateAssistantMessage(assistantMessage.id, accumulatedText)
            }
          } catch (e) {
            console.error('解析流数据失败:', dataStr, e)
          }
        }
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    if (currentChat.value && currentChat.value.messages.length > 0) {
      const lastMessage = currentChat.value.messages[currentChat.value.messages.length - 1]
      if (lastMessage?.role === 'assistant') {
        chatStore.updateAssistantMessage(
          lastMessage.id,
          `抱歉，发生了一个错误: ${error instanceof Error ? error.message : '未知错误'}`,
        )
      }
    }
  } finally {
    chatStore.isSending = false
    inputRef.value?.focus()
  }
}

// 按钮操作
const createNewChat = () => {
  const newChatId = chatStore.createNewChat()
  router.push(`/chat/${newChatId}`)
}

const openSettings = () => {
  isSettingsOpen.value = true
}

const closeSettings = () => {
  isSettingsOpen.value = false
}

const chatTitle = computed(() => currentChat.value?.title || 'AI 对话')
</script>

<template>
  <div class="chat-view-root">
    <div v-if="currentChat" class="chat-container">
      <!-- 顶部标题栏 -->
      <header class="chat-header">
        <h1>{{ chatTitle }}</h1>
        <div class="header-actions">
          <button class="header-btn" @click="createNewChat" title="新对话">➕</button>
          <button class="header-btn" @click="openSettings" title="设置">⚙️</button>
        </div>
      </header>

      <!-- 消息列表区域 -->
      <div class="messages-container" ref="messageListRef">
        <div class="messages-inner">
          <!-- 欢迎消息 -->
          <div v-if="currentChat.messages.length === 0" class="welcome-message">
            <h2>开始新的对话</h2>
            <p>向 AI 提问任何问题，我会尽力帮助您。</p>
          </div>

          <!-- 消息列表 -->
          <template v-else>
            <MessageItem
              v-for="message in currentChat.messages"
              :key="message.id"
              :message="message"
              class="message-item"
            />

            <!-- 打字指示器 -->
            <div
              v-if="
                isSending && currentChat.messages.some((m) => m.role === 'assistant' && !m.content)
              "
              class="typing-indicator"
            >
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </template>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-container">
        <div class="input-wrapper">
          <textarea
            v-model="userInput"
            placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
            @keydown.enter.exact.prevent="sendMessage"
            :disabled="isSending"
            ref="inputRef"
            rows="1"
            class="message-input"
          ></textarea>
          <button
            class="send-button"
            @click="sendMessage"
            :disabled="isSending || !userInput.trim()"
          >
            {{ isSending ? '发送中...' : '发送' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 占位符 -->
    <div v-else class="placeholder">
      <div class="placeholder-content">
        <h2>选择对话</h2>
        <p>从左侧选择一个对话或创建新对话开始聊天</p>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <SettingsModal :is-open="isSettingsOpen" @close="closeSettings" />
  </div>
</template>

<style scoped>
/* 根容器 - 占满整个父容器 */
.chat-view-root {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #ffffff;
}

/* 聊天容器 */
.chat-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 占位符 */
.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

.placeholder-content {
  text-align: center;
  color: #666;
}

.placeholder-content h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 300;
}

.placeholder-content p {
  font-size: 1rem;
  opacity: 0.7;
}

/* 头部区域 */
.chat-header {
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #ffffff;
  flex-shrink: 0;
}

.chat-header h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  font-size: 16px;
  transition: all 0.15s ease;
}

.header-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

/* 消息容器 - 可滚动区域 */
.messages-container {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #ffffff;
  padding: 0;
}

.messages-inner {
  max-width: 768px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* 欢迎消息 */
.welcome-message {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
}

.welcome-message h2 {
  font-size: 1.875rem;
  font-weight: 300;
  color: #111827;
  margin-bottom: 12px;
}

.welcome-message p {
  font-size: 1.125rem;
  color: #6b7280;
  line-height: 1.6;
}

/* 消息项 */
.message-item {
  margin-bottom: 24px;
}

.message-item:last-child {
  margin-bottom: 0;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 16px 0;
  margin-top: 12px;
}

.typing-indicator .dot {
  width: 8px;
  height: 8px;
  background-color: #9ca3af;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-indicator .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.4;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* 输入区域 */
.input-container {
  width: 100%;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
  background-color: #ffffff;
  flex-shrink: 0;
}

.input-wrapper {
  max-width: 768px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  min-height: 44px;
  max-height: 200px;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 16px;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  overflow-y: auto;
  transition: border-color 0.15s ease;
  background-color: #ffffff;
}

.message-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.message-input:disabled {
  background-color: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.send-button {
  height: 44px;
  padding: 0 24px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
  white-space: nowrap;
}

.send-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.send-button:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-header {
    padding: 0 16px;
    height: 56px;
  }

  .chat-header h1 {
    font-size: 1rem;
  }

  .messages-inner {
    padding: 16px;
  }

  .input-container {
    padding: 16px;
  }

  .message-input {
    font-size: 16px; /* 防止 iOS 缩放 */
  }

  .welcome-message {
    padding: 32px 16px;
  }

  .welcome-message h2 {
    font-size: 1.5rem;
  }

  .welcome-message p {
    font-size: 1rem;
  }
}
</style>
