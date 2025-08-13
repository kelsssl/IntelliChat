<template>
  <!-- 首页欢迎界面（当没有选择对话时） -->
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
          <PaperAirplaneIcon class="send-icon" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../stores/chat'
import { PaperAirplaneIcon } from '@heroicons/vue/24/solid'

const router = useRouter()
const chatStore = useChatStore()
const quickInput = ref('')

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

//调整输入框最大高度为120
//当用户在 <textarea> 中输入或删除内容时，动态计算出内容所需的高度
//并实时调整文本框的 height 样式，同时限制其最大高度，防止无限增高。
const adjustQuickInputHeight = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
}

const startChatWithContent = async (content: string) => {
  if (!content) return
  const newChatId = chatStore.createNewChat()
  // 将内容作为查询参数传递
  await router.push({ name: 'chat', params: { chatId: newChatId }, query: { initial: content } })
}

// 建议卡片点击处理
const handleSuggestionClick = (prompt: string) => {
  startChatWithContent(prompt)
}

// 快速开始对话
const startQuickChat = async () => {
  startChatWithContent(quickInput.value.trim())
}
</script>

<style scoped>
.home-container {
  height: 100%;
  background-color: white;
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

/* gird网格布局 */
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
  /* 光标悬停时平滑上移 */
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

.send-icon {
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
