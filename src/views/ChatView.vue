<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { fetchCozeStream } from '@/api/cozeService' // 导入我们专业的API服务
import { storeToRefs } from 'pinia'
import { useChatStore } from '../stores/chat'
import { useRoute, useRouter } from 'vue-router'
import type { ApiMessage } from '../types'
import MessageItem from '../components/MessageItem.vue'
import SettingsModal from '../components/SettingsModal.vue'
import { PaperAirplaneIcon } from '@heroicons/vue/24/solid'

// Store 和路由初始化
const chatStore = useChatStore()
const route = useRoute()
const router = useRouter()
const { currentChat, isSending, fullMessages } = storeToRefs(chatStore)

// 组件本地状态
const userInput = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const messageListRef = ref<HTMLDivElement | null>(null)
const isSettingsOpen = ref(false) // 注意：这个在你的代码中没有被使用，可以考虑移除

// 监听路由变化，同步当前对话
watch(
  () => route.params.chatId,
  (newId) => {
    if (newId && typeof newId === 'string') {
      chatStore.setCurrentChat(newId)
    }
  },
  { immediate: true },
)

// 组件挂载时
onMounted(async () => {
  // 检查路由中是否有从 WelcomeView 传递过来的初始消息
  if (route.query.initial && typeof route.query.initial === 'string') {
    userInput.value = route.query.initial
    await router.replace({ query: {} }) // 清理URL，防止刷新时重复发送
    sendMessage() // 自动发送
  } else if (window.innerWidth > 768) {
    inputRef.value?.focus()
  }
})

// 监听消息变化，自动滚动到底部
watch(() => currentChat.value?.messages, scrollToBottom, { deep: true })

// 滚动到底部
async function scrollToBottom() {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// 动态调整输入框高度
function adjustTextareaHeight(event: Event) {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
}

const sendMessage = async () => {
  //1.准备阶段
  if (!currentChat.value) {
    alert('错误：请先选择一个对话。')
    return
  }

  const content = userInput.value.trim()
  if (!content || isSending.value) return

  const isFirstUserMessage = currentChat.value.messages.length === 0
  const chatId = currentChat.value.id

  // 立刻将用户消息添加到UI
  chatStore.addUserMessage(content)
  userInput.value = '' //发送后清空输入框内容
  chatStore.isSending = true // 禁用UI

  // 立刻重置输入框高度
  await nextTick()
  if (inputRef.value) {
    inputRef.value.style.height = '48px'
  }

  // 如果是第一条消息，就更新标题
  if (isFirstUserMessage) {
    chatStore.renameChat(chatId, content.substring(0, 20))
  }

  //2.API 交互
  try {
    // 创建AI消息占位符，用于接收流式数据
    const assistantMessage = chatStore.addAssistantMessage()
    if (!assistantMessage) throw new Error('无法在UI上创建助手消息占位符')

    // 准备发送给 API 的数据
    const messages: ApiMessage[] = fullMessages.value
      .filter((msg): msg is typeof msg & { role: 'user' | 'assistant' } => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
        content_type: 'text',
      }))

    // 发送网络请求：使用封装好的API 服务
    const stream = await fetchCozeStream(
      chatStore.settings.apiEndpoint,
      chatStore.settings.apiKey,
      {
        bot_id: chatStore.settings.cozeBotId,
        user_id: 'user_12345',
        additional_messages: messages,
        stream: true,
      },
    )

    if (!stream) throw new Error('未能获取到 API 的响应流 (stream)')

    // 处理流式响应
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let accumulatedText = ''
    let hasReceivedContent = false // 新增标志位，用于检查是否收到过有效内容
    let buffer = '' // 【新增】用于缓存不完整的数据

    while (true) {
      const { value, done } = await reader.read()
      if (done) break // 当服务器关闭流时，退出循环

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk // 【修复】将新数据添加到缓冲区

      // 【修复】按双换行符分割完整的 SSE 事件
      const events = buffer.split('\n\n')
      // 保留最后一个可能不完整的事件
      buffer = events.pop() || ''

      for (const eventBlock of events) {
        if (!eventBlock.trim()) continue

        const lines = eventBlock.split('\n')
        let currentEvent = ''
        let eventData = ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            eventData = line.slice(5).trim()
          }
        }

        // 处理完整的事件
        if (eventData) {
          if (eventData === '"[DONE]"' || eventData === '[DONE]') continue

          try {
            const parsed = JSON.parse(eventData)

            // 优先检查流中是否包含错误事件
            if (currentEvent === 'conversation.chat.failed') {
              throw new Error(parsed.last_error?.msg || '流式传输过程中发生未知错误')
            }

            let contentToAdd = ''

            // 【修复】同时支持模拟模式和正式模式的数据格式
            if (currentEvent === 'conversation.message.delta') {
              // 正式模式：只处理 delta 事件中的 answer 类型消息
              if (
                parsed.type === 'answer' &&
                typeof parsed.content === 'string' &&
                parsed.content.trim() && // 确保内容不为空
                !parsed.content.includes('"msg_type"') // 过滤掉包含调试JSON的内容
              ) {
                contentToAdd = parsed.content
              }
            } else if (parsed.message) {
              // 模拟模式：处理简化格式的消息
              if (
                parsed.message.role === 'assistant' &&
                parsed.message.type === 'answer' &&
                typeof parsed.message.content === 'string' &&
                parsed.message.content.trim()
              ) {
                contentToAdd = parsed.message.content
              }
            }

            // 如果获取到了有效内容，则更新UI
            if (contentToAdd) {
              accumulatedText += contentToAdd
              hasReceivedContent = true // 标记已经收到了有效内容
              // 高频调用 store action，实时更新UI，形成打字机效果
              chatStore.updateAssistantMessage(assistantMessage.id, accumulatedText)
            }
          } catch (e) {
            if (e instanceof Error) throw e
            // 忽略 JSON 解析错误，可能是由于数据分割导致的
            console.warn('解析事件数据失败:', eventData, e)
          }
        }
      }
    }

    // 在 while 循环之后，进行最终检查
    if (!hasReceivedContent) {
      // 如果整个流都结束了，但我们一个有效的 answer 都没收到，
      // 这很可能是因为 API 直接返回了 failed 和 done 事件（比如余额不足时）
      // 此时我们抛出一个通用错误，让 catch 块来处理
      throw new Error('API 没有返回任何有效内容，请检查额度或联系支持。')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    const errorMessage = error instanceof Error ? error.message : '发生未知错误'

    // 找到我们之前创建的那个空的助手消息
    const lastMsg = currentChat.value?.messages[currentChat.value.messages.length - 1]
    if (lastMsg && lastMsg.role === 'assistant') {
      // 更新它的内容为错误信息
      chatStore.updateAssistantMessage(lastMsg.id, `抱歉，发生了一个错误：${errorMessage}`)
    }
  } finally {
    // --- 阶段三：收尾 (完全保留你的逻辑) ---
    chatStore.isSending = false // 解禁UI
    inputRef.value?.focus()
  }
}

// 关闭设置弹窗
const closeSettings = () => {
  isSettingsOpen.value = false
}
</script>

<template>
  <div v-if="currentChat" class="chat-view-container">
    <!-- 对话内容区域 -->
    <div class="messages-scroll-area" ref="messageListRef">
      <!-- 对话消息 -->
      <div class="messages-container">
        <!-- 空对话欢迎 -->
        <div v-if="currentChat.messages.length === 0" class="empty-chat-welcome">
          <h2 class="empty-chat-title">开始新的对话</h2>
          <p class="empty-chat-subtitle">向我提问，我会尽力帮助您。</p>
        </div>
        <!-- 消息列表  -->
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
              <div v-if="message.role === 'assistant'" class="avatar avatar-ai">智</div>

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
              <div v-if="message.role === 'user'" class="avatar avatar-user">你</div>
            </div>
          </div>

          <!-- 打字指示器
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
      </div> -->
        </template>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="input-area">
      <div class="input-container">
        <div class="input-wrapper">
          <textarea
            v-model="userInput"
            ref="inputRef"
            placeholder="发送消息给智聊助手..."
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
            <PaperAirplaneIcon class="send-icon" />
          </button>
        </div>
        <div class="input-footer">智聊助手仅供参考，重要决策请谨慎核实。</div>
      </div>
    </div>

    <SettingsModal :is-open="isSettingsOpen" @close="closeSettings" />
  </div>
</template>
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

.send-icon {
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  min-height: 60vh;
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

/* 打字指示器
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
} */

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
