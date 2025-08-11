<template>
  <div class="home-container">
    <div class="welcome-screen">
      <div class="welcome-content">
        <h1 class="welcome-title">嗨！我是你的智聊助手</h1>
        <p class="welcome-subtitle">让我们开始探索智能创造的可能性！</p>

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

        <!-- 快速输入框 -->
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../stores/chat'

const router = useRouter()
const chatStore = useChatStore()
const quickInput = ref('')

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

const adjustQuickInputHeight = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
}

const handleSuggestionClick = async (prompt: string) => {
  const newChatId = chatStore.createNewChat()
  quickInput.value = prompt
  await router.push(`/chat/${newChatId}`)
}

const startQuickChat = async () => {
  if (!quickInput.value.trim()) return

  // const content = quickInput.value.trim()
  const newChatId = chatStore.createNewChat()
  await router.push(`/chat/${newChatId}`)

  // 这里您可能需要触发发送消息的逻辑
  // 具体实现取决于您的store结构
}
</script>

<style scoped>
.home-container {
  height: 100%;
  background-color: white;
}

/* 与ChatView中的欢迎屏幕样式相同 */
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

.quick-input-wrapper {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.quick-input {
  width: 100%;
  min-height: 48px;
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

@media (max-width: 768px) {
  .welcome-title {
    font-size: 2rem;
  }

  .suggestions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
