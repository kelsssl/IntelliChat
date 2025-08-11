<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '../types'
import { renderMarkdown, hasCodeBlock } from '@/utils/markdown'
import CodeBlock from './CodeBlock.vue'

// 组件属性
const props = defineProps<{
  message: Message
}>()

// 检查消息是否包含代码块
const hasCodeBlocks = computed(() => {
  return hasCodeBlock(props.message.content)
})

// 渲染Markdown内容
const renderedContent = computed(() => {
  return renderMarkdown(props.message.content)
})

// 格式化时间
const formattedTime = computed(() => {
  const date = new Date(props.message.timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

// 如果消息包含代码块，将内容拆分为普通文本和代码块
const contentParts = computed(() => {
  if (!hasCodeBlocks.value) return []

  const parts = []
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g

  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(props.message.content)) !== null) {
    // 添加代码块前的文本
    if (match.index > lastIndex) {
      const textContent = props.message.content.substring(lastIndex, match.index)
      parts.push({
        type: 'text',
        content: renderMarkdown(textContent),
      })
    }

    // 添加代码块
    parts.push({
      type: 'code',
      language: match[1] || 'plaintext',
      code: match[2].trim(),
    })

    lastIndex = match.index + match[0].length
  }

  // 添加最后一个代码块后的文本
  if (lastIndex < props.message.content.length) {
    const textContent = props.message.content.substring(lastIndex)
    parts.push({
      type: 'text',
      content: renderMarkdown(textContent),
    })
  }

  return parts
})
</script>

<template>
  <div class="message-item" :class="message.role">
    <div class="avatar">
      <!-- 根据角色显示不同的头像 -->
      <div v-if="message.role === 'user'" class="user-avatar">你</div>
      <div v-else class="assistant-avatar">AI</div>
    </div>
    <div class="message-content">
      <!-- 使用v-html渲染Markdown内容 -->
      <div v-if="!hasCodeBlocks" class="text" v-html="renderedContent"></div>

      <!-- 如果有代码块，手动拆分内容并渲染 -->
      <template v-else>
        <div v-for="(part, index) in contentParts" :key="index">
          <!-- 普通文本部分 -->
          <div v-if="part.type === 'text'" class="text" v-html="part.content"></div>

          <!-- 代码块部分 -->
          <CodeBlock v-if="part.code === 'code'" :code="part.code" :language="part.language" />
        </div>
      </template>

      <!-- 时间戳 -->
      <div class="timestamp">{{ formattedTime }}</div>
    </div>
  </div>
</template>

<style scoped>
.message-item {
  display: flex;
  margin-bottom: 1.5rem;
  animation: fade-in 0.3s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 1rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.user-avatar {
  background-color: #e1f5fe;
  color: #0288d1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.assistant-avatar {
  background-color: #e8f5e9;
  color: #388e3c;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.message-content {
  flex: 1;
  max-width: calc(100% - 60px);
}

.text {
  line-height: 1.5;
  white-space: pre-wrap;
}

.text :deep(a) {
  color: #0366d6;
  text-decoration: none;
}

.text :deep(a:hover) {
  text-decoration: underline;
}

.text :deep(p) {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.text :deep(ul),
.text :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.text :deep(li) {
  margin: 0.25em 0;
}

.text :deep(blockquote) {
  border-left: 4px solid #dfe2e5;
  padding-left: 1em;
  color: #6a737d;
  margin: 0.5em 0;
}

.timestamp {
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.5rem;
  text-align: right;
}

/* 根据角色设置不同的样式 */
.message-item.user .message-content {
  background-color: #f1f5f9;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
}

.message-item.assistant .message-content {
  background-color: #ffffff;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}
</style>
