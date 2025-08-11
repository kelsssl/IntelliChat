<template>
  <div class="chat-view-container">
    <!-- 对话内容区域 -->
    <div class="messages-scroll-area" ref="messageListRef">
      <!-- 首页欢迎界面（当没有选择对话时） -->
      <div v-if="!currentChat" class="welcome-screen">
        <div class="welcome-content">
          <h1 class="welcome-title">Hello! I'm Claude</h1>
          <p class="welcome-subtitle">How can I help you today?</p>

          <div class="suggestions-grid">
            <div
              v-for="suggestion in suggestions"
              :key="suggestion.title"
              @click="handleSuggestionClick(suggestion.prompt)"
              class="suggestion-card"
            >
              <h3 class="suggestion-title">{{ suggestion.icon }} {{ suggestion.title }}</h3>
              <p class="suggestion-description">{{ suggestion.description }}</p>
            </div>
          </div>

          <!-- 首页快速输入 -->
          <div class="quick-input-wrapper">
            <textarea
              v-model="quickInput"
              @keydown.enter.exact.prevent="startQuickChat"
              @input="adjustQuickInputHeight"
              placeholder="或者直接在这里输入您的问题..."
              class="quick-input"
              rows="1"
            />
            <button @click="startQuickChat" :disabled="!quickInput.trim()" class="quick-send-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 对话消息（当有选择对话时） -->
      <div v-else class="messages-container">
        <!-- 空对话欢迎 -->
        <div v-if="currentChat.messages.length === 0" class="empty-chat-welcome">
          <h2 class="empty-chat-title">开始新的对话</h2>
          <p class="empty-chat-subtitle">向 AI 提问任何问题，我会尽力帮助您。</p>
        </div>

        <!-- 消息列表 - 保留您的MessageItem组件 -->
        <template v-else>
          <div
            v-for="message in currentChat.messages"
            :key="message.id"
            :class="[
              'message-wrapper',
              message.role === 'user' ? 'user-message' : 'assistant-message',
            ]"
          >
            <div class="message-row">
              <!-- AI头像 -->
              <div v-if="message.role === 'assistant'" class="avatar avatar-ai">AI</div>

              <!-- 消息气泡 -->
              <div
                :class="[
                  'message-bubble',
                  message.role === 'user' ? 'user-bubble' : 'assistant-bubble',
                ]"
              >
                <MessageItem :message="message" />
              </div>

              <!-- 用户头像 -->
              <div v-if="message.role === 'user'" class="avatar avatar-user">You</div>
            </div>
          </div>

          <!-- 打字指示器 -->
          <div v-if="isSending" class="typing-wrapper">
            <div class="message-row">
              <div class="avatar avatar-ai">AI</div>
              <div class="typing-bubble">
                <div class="typing-dots">
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 底部输入区域 - 保留您的发送逻辑 -->
    <div class="input-area">
      <div class="input-container">
        <div class="input-wrapper">
          <textarea
            v-model="userInput"
            ref="inputRef"
            placeholder="发送消息给Claude..."
            @keydown.enter.exact.prevent="sendMessage"
            @input="adjustTextareaHeight"
            :disabled="isSending"
            class="message-input"
            rows="1"
          >
          </textarea>
          <button
            @click="sendMessage"
            :disabled="!userInput.trim() || isSending"
            class="send-button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <div class="input-footer">智聊助手仅供参考，重要决策请谨慎核实。</div>
      </div>
    </div>

    <SettingsModal :is-open="isSettingsOpen" @close="closeSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '../stores/chat'
import { useRoute, useRouter } from 'vue-router'
import type { ApiMessage } from '../types'
import MessageItem from '../components/MessageItem.vue'
import SettingsModal from '../components/SettingsModal.vue'

const chatStore = useChatStore()
const route = useRoute()
const router = useRouter()
const { currentChat, isSending, fullMessages } = storeToRefs(chatStore)

const userInput = ref('')
const quickInput = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const messageListRef = ref<HTMLDivElement | null>(null)
const isSettingsOpen = ref(false)

// 建议数据
const suggestions = [
  {
    icon: '💡',
    title: '创意写作',
    description: '帮你写故事、诗歌或者创意内容',
    prompt: '帮我写一个创意故事',
  },
  {
    icon: '🔧',
    title: '代码帮助',
    description: '解决编程问题，代码调试和优化',
    prompt: '我需要代码方面的帮助',
  },
  {
    icon: '📚',
    title: '学习辅导',
    description: '解答问题，提供学习建议',
    prompt: '我想学习新知识',
  },
  {
    icon: '💼',
    title: '工作助手',
    description: '帮助处理工作任务和项目',
    prompt: '帮我处理工作任务',
  },
]

// 保留您所有现有的监听器和方法
watch(
  () => route.params.chatId,
  (newId) => {
    if (newId && typeof newId === 'string') {
      chatStore.setCurrentChat(newId)
    }
  },
  { immediate: true },
)

onMounted(() => {
  chatStore.init()
  if (window.innerWidth > 768) {
    inputRef.value?.focus()
  }
})

watch(
  () => currentChat.value?.messages,
  () => {
    scrollToBottom()
  },
  { deep: true },
)

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

const adjustTextareaHeight = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
}

const adjustQuickInputHeight = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
}

// 建议卡片点击处理
const handleSuggestionClick = async (prompt: string) => {
  const newChatId = chatStore.createNewChat()
  await router.push(`/chat/${newChatId}`)

  // 等待路由完成后设置输入内容
  await nextTick()
  userInput.value = prompt
  inputRef.value?.focus()
}

// 快速开始对话
const startQuickChat = async () => {
  if (!quickInput.value.trim()) return

  const content = quickInput.value.trim()
  const newChatId = chatStore.createNewChat()
  await router.push(`/chat/${newChatId}`)

  // 等待路由完成后发送消息
  await nextTick()
  userInput.value = content
  quickInput.value = ''

  // 自动发送消息
  sendMessage()
}

// 保留您现有的完整sendMessage方法（不做任何修改）
const sendMessage = async () => {
  if (!currentChat.value) {
    alert('错误：请先选择一个对话。')
    return
  }

  const content = userInput.value.trim()
  if (!content || isSending.value) return

  const isFirstUserMessage = currentChat.value.messages.length === 0
  const chatId = currentChat.value.id

  chatStore.addUserMessage(content)
  userInput.value = ''
  chatStore.isSending = true

  // 重置输入框高度
  await nextTick()
  if (inputRef.value) {
    inputRef.value.style.height = '48px'
  }

  if (isFirstUserMessage) {
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

const closeSettings = () => {
  isSettingsOpen.value = false
}
</script>

<style scoped>
/* ChatView 样式 */
.chat-view-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f9fafb;
}

/* 欢迎屏幕 */
.welcome-screen {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.welcome-content {
  width: 100%;
  max-width: 640px;
  text-align: center;
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 300;
  color: #111827;
  margin-bottom: 16px;
}

.welcome-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 32px;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.suggestion-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.suggestion-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.suggestion-title {
  font-weight: 500;
  color: #111827;
  margin-bottom: 8px;
  font-size: 16px;
}

.suggestion-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

/* 快速输入 */
.quick-input-wrapper {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.quick-input {
  width: 100%;
  /* min-height: 48px; */
  max-height: 120px;
  padding: 12px 50px 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 24px;
  font-size: 16px;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  overflow-y: auto;
  transition: border-color 0.2s ease;
  background-color: white;
  height: 48px;
}

.quick-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.quick-send-btn {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 32px;
  height: 32px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.quick-send-btn:hover:not(:disabled) {
  background-color: #2563eb;
}

.quick-send-btn:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

.quick-send-btn svg {
  width: 16px;
  height: 16px;
}

/* 消息容器 */
.messages-scroll-area {
  flex: 1;
  overflow-y: auto;
  /* background-color: white; */
}

.messages-container {
  width: 100%;
  max-width: 1024px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

/* 空对话欢迎 */
.empty-chat-welcome {
  text-align: center;
  padding: 48px 24px;
}

.empty-chat-title {
  font-size: 1.5rem;
  font-weight: 300;
  color: #111827;
  margin-bottom: 12px;
}

.empty-chat-subtitle {
  font-size: 1rem;
  color: #6b7280;
}

/* 消息样式 */
.message-wrapper {
  margin-bottom: 24px;
}

.user-message {
  margin-left: 48px;
}

.assistant-message {
  margin-right: 48px;
}

.message-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.user-message .message-row {
  justify-content: flex-end;
}

.assistant-message .message-row {
  justify-content: flex-start;
}

/* 头像 */
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.avatar-ai {
  background-color: #3b82f6;
  color: white;
}

.avatar-user {
  background-color: #d1d5db;
  color: #374151;
}

/* 消息气泡 */
.message-bubble {
  max-width: 600px;
  padding: 16px 20px;
  border-radius: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-bubble {
  background-color: #3b82f6;
  color: white;
}

.assistant-bubble {
  background-color: white;
  border: 1px solid #e5e7eb;
  color: #111827;
}

/* 打字指示器 */
.typing-wrapper {
  margin-bottom: 24px;
  margin-right: 48px;
}

.typing-bubble {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.typing-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: #9ca3af;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}
.dot:nth-child(2) {
  animation-delay: -0.16s;
}
.dot:nth-child(3) {
  animation-delay: 0s;
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
.input-area {
  background-color: white;
  border-top: 1px solid #e5e7eb;
  padding: 24px;
  flex-shrink: 0;
}

.input-container {
  max-width: 768px;
  margin: 0 auto;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.message-input {
  flex: 1;
  /* min-height: 48px; */
  max-height: 200px;
  padding: 12px 50px 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 24px;
  font-size: 16px;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  overflow-y: auto;
  transition: border-color 0.2s ease;
  background-color: white;
  height: 48px;
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
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 32px;
  height: 32px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.send-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.send-button:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

.send-button svg {
  width: 16px;
  height: 16px;
}

.input-footer {
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
}

/* 滚动条样式 */
.messages-scroll-area::-webkit-scrollbar,
.chat-history::-webkit-scrollbar {
  width: 6px;
}

.messages-scroll-area::-webkit-scrollbar-track,
.chat-history::-webkit-scrollbar-track {
  background: transparent;
}

.messages-scroll-area::-webkit-scrollbar-thumb,
.chat-history::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.messages-scroll-area::-webkit-scrollbar-thumb:hover,
.chat-history::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-title {
    font-size: 2rem;
  }

  .suggestions-grid {
    grid-template-columns: 1fr;
  }

  .messages-container {
    padding: 16px;
  }

  .user-message {
    margin-left: 16px;
  }

  .assistant-message {
    margin-right: 16px;
  }

  .input-area {
    padding: 16px;
  }

  .message-input {
    font-size: 16px; /* 防止iOS缩放 */
  }
}
</style>
