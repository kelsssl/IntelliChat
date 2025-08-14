<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '../types'
import { renderMarkdown, hasCodeBlock } from '@/utils/markdown'
import CodeBlock from './CodeBlock.vue'

// 定义文本块的"形状"
interface TextPart {
  type: 'text'
  content: string
}

// 定义代码块的"形状"
interface CodePart {
  type: 'code'
  language: string
  code: string
}

// 定义 parts 数组可以包含的联合类型
type ContentPart = TextPart | CodePart

const props = defineProps<{
  message: Message
}>()

// 检查是否是加载状态
const isLoading = computed(() => {
  const content = props.message.content?.trim() || ''
  return content === '正在思考...' || content === '' || content === '加载中...'
})

// 添加调试日志
const debugMessage = computed(() => {
  console.log('MessageComponent 收到的消息:', {
    id: props.message.id,
    content: props.message.content,
    contentLength: props.message.content?.length || 0,
    role: props.message.role,
    isLoading: isLoading.value,
  })
  return props.message
})

const hasCodeBlocks = computed(() => {
  if (isLoading.value) return false
  const result = hasCodeBlock(debugMessage.value.content)
  console.log('是否包含代码块:', result)
  return result
})

const formattedTime = computed(() => {
  const date = new Date(debugMessage.value.timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

// 优化后的内容解析逻辑
const contentParts = computed(() => {
  if (isLoading.value || !debugMessage.value.content) return []

  const content = debugMessage.value.content
  const parts: ContentPart[] = []

  // 如果没有代码块，直接返回整个内容作为文本
  if (!hasCodeBlocks.value) {
    parts.push({
      type: 'text',
      content: renderMarkdown(content),
    })
    return parts
  }

  console.log('原始内容:', content)

  // 更精确的代码块正则表达式，要求```必须在行首或前面只有空白字符
  const codeBlockRegex = /(^|\n)```(\w*)\n?([\s\S]*?)\n?```(?=\n|$)/g
  let lastIndex = 0
  let match

  // 重置正则表达式状态
  codeBlockRegex.lastIndex = 0

  while ((match = codeBlockRegex.exec(content)) !== null) {
    console.log('匹配到代码块:', {
      fullMatch: match[0],
      leadingChar: match[1],
      language: match[2],
      code: match[3],
      startIndex: match.index,
      endIndex: codeBlockRegex.lastIndex,
    })

    // 计算实际的代码块开始位置（跳过前导换行符）
    const codeBlockStart = match.index + (match[1] === '\n' ? 1 : 0)

    // 添加代码块之前的文本
    if (codeBlockStart > lastIndex) {
      const textContent = content.substring(lastIndex, codeBlockStart)
      if (textContent.trim()) {
        console.log('添加文本部分:', textContent)
        parts.push({
          type: 'text',
          content: renderMarkdown(textContent),
        })
      }
    }

    // 添加代码块
    const language = match[2] || 'plaintext'
    const code = match[3]

    // 过滤掉整个内容都被当作markdown代码块的情况
    if (language !== 'markdown' || code.length < content.length * 0.8) {
      console.log('添加代码块:', { language, codeLength: code.length })
      parts.push({
        type: 'code',
        language: language,
        code: code,
      })
    } else {
      // 如果是markdown代码块且包含大部分内容，当作普通文本处理
      console.log('将markdown代码块当作普通文本处理')
      parts.push({
        type: 'text',
        content: renderMarkdown(code),
      })
    }

    lastIndex = codeBlockRegex.lastIndex
  }

  // 添加剩余的文本
  if (lastIndex < content.length) {
    const textContent = content.substring(lastIndex)
    if (textContent.trim()) {
      console.log('添加剩余文本部分:', textContent)
      parts.push({
        type: 'text',
        content: renderMarkdown(textContent),
      })
    }
  }

  console.log('解析后的内容部分:', parts)
  return parts
})

// 单纯的 markdown 渲染（当没有代码块时使用）
const renderedContent = computed(() => {
  if (isLoading.value || !debugMessage.value.content) return ''
  return renderMarkdown(debugMessage.value.content)
})
</script>

<template>
  <div class="message-content">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <span class="loading-text">正在思考...</span>
    </div>

    <!-- 正常消息内容 -->
    <template v-else>
      <!-- 处理真正的空消息情况 -->
      <div v-if="!message.content || message.content.trim() === ''" class="empty-message">
        <span class="text-gray-400 italic">消息内容为空</span>
      </div>

      <!-- 有内容的情况 -->
      <template v-else>
        <!-- 有代码块的复杂渲染 -->
        <template v-if="hasCodeBlocks && contentParts.length > 0">
          <div
            v-for="(part, index) in contentParts"
            :key="`${message.id}-part-${index}`"
            class="content-part"
          >
            <!-- 普通文本部分 -->
            <div v-if="part.type === 'text'" class="text" v-html="part.content"></div>

            <!-- 代码块部分 -->
            <CodeBlock
              v-else-if="part.type === 'code'"
              :code="part.code"
              :language="part.language"
            />
          </div>
        </template>

        <!-- 无代码块的简单渲染 -->
        <div v-else class="text" v-html="renderedContent"></div>
      </template>
    </template>

    <!-- 时间戳 -->
    <div class="timestamp">{{ formattedTime }}</div>
  </div>
</template>

<style scoped>
.message-content {
  width: 100%;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  color: #6b7280;
}

.loading-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.dot {
  width: 6px;
  height: 6px;
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

.loading-text {
  font-size: 0.875rem;
  font-style: italic;
}

.text {
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.content-part {
  margin: 0;
}

.content-part + .content-part {
  margin-top: 0.5rem;
}

.empty-message {
  padding: 8px 0;
}

.timestamp {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 8px;
  text-align: right;
}

/* deep 选择器用于修改 v-html 内部的样式 */
.text :deep(p) {
  margin: 0.5em 0;
}

.text :deep(p:first-child) {
  margin-top: 0;
}

.text :deep(p:last-child) {
  margin-bottom: 0;
}

.text :deep(ul),
.text :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.text :deep(li) {
  margin-bottom: 0.25em;
}

.text :deep(blockquote) {
  border-left: 3px solid #dfe2e5;
  padding-left: 1em;
  color: #6a737d;
  margin: 0.5em 0;
}

.text :deep(a) {
  color: #3b82f6;
  text-decoration: none;
}

.text :deep(a:hover) {
  text-decoration: underline;
}

.text :deep(code) {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 0.875em;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.text :deep(h1),
.text :deep(h2),
.text :deep(h3),
.text :deep(h4),
.text :deep(h5),
.text :deep(h6) {
  margin: 1em 0 0.5em 0;
  font-weight: 600;
}

.text :deep(h1:first-child),
.text :deep(h2:first-child),
.text :deep(h3:first-child),
.text :deep(h4:first-child),
.text :deep(h5:first-child),
.text :deep(h6:first-child) {
  margin-top: 0;
}
</style>
