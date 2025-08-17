<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Message } from '../types'
import { renderMarkdown } from '@/utils/markdown'
import CodeBlock from './CodeBlock.vue'

// --- 1. 类型定义 ---
// 普通文本块
interface TextPart {
  type: 'text'
  rawContent: string // 用于复制的原始 Markdown 文本
  renderedContent: string // 用于 v-html 渲染的 HTML
}
// 代码块
interface CodePart {
  type: 'code'
  language: string
  code: string
}
// 特殊的 Markdown 代码块 (带外壳)
interface MarkdownCodePart {
  type: 'markdown-code'
  content: string // 存放原始的 Markdown 文本
}
type ContentPart = TextPart | CodePart | MarkdownCodePart

// --- 2. Props ---
const props = defineProps<{
  message: Message
}>()

// --- 3. 基础状态与计算属性 ---
const copiedPartIndex = ref<number | null>(null) // 用于追踪哪个部分被复制了

const isLoading = computed(() => {
  const content = props.message.content?.trim() || ''
  return content === '正在思考...' || content === '' || content === '加载中...'
})

const formattedTime = computed(() => {
  const date = new Date(props.message.timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

// 4.渲染
const contentParts = computed((): ContentPart[] => {
  if (isLoading.value || !props.message.content) {
    return []
  }
  // 清理多余的换行符
  const content = props.message.content
    .replace(/\n{3,}/g, '\n\n') // 将3个或更多连续换行符替换为2个
    .trim()
  const parts: ContentPart[] = []

  // 正则表达式查找所有代码块
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // a. 添加代码块之前的文本部分
    if (match.index > lastIndex) {
      const textContent = content.substring(lastIndex, match.index)
      if (textContent.trim()) {
        parts.push({
          type: 'text',
          rawContent: textContent,
          renderedContent: renderMarkdown(textContent),
        })
      }
    }

    // b. 添加代码块或 Markdown 代码块部分
    const language = match[1].toLowerCase() || 'plaintext'
    const code = match[2].trim()

    if (language === 'markdown') {
      // 如果 AI 明确指定了 markdown 代码块，用特殊类型处理
      parts.push({
        type: 'markdown-code',
        content: code,
      })
    } else if (code) {
      // 否则，作为普通代码块处理
      parts.push({
        type: 'code',
        language: language,
        code: code,
      })
    }
    lastIndex = match.index + match[0].length
  }

  // c. 添加最后一个代码块之后的剩余文本
  if (lastIndex < content.length) {
    const textContent = content.substring(lastIndex)
    if (textContent.trim()) {
      parts.push({
        type: 'text',
        rawContent: textContent,
        renderedContent: renderMarkdown(textContent),
      })
    }
  }

  // 如果经过所有解析后，parts 数组依然为空，则当作纯文本处理
  if (parts.length === 0 && content.trim()) {
    parts.push({
      type: 'text',
      rawContent: content,
      renderedContent: renderMarkdown(content),
    })
  }

  return parts
})

// --- 5. 复制方法 ---
const copyContent = (text: string, index: number) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      copiedPartIndex.value = index
      setTimeout(() => {
        copiedPartIndex.value = null
      }, 2000)
    })
    .catch((err) => {
      console.error('复制失败:', err)
    })
}
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

    <!-- 正常消息内容 (统一渲染逻辑) -->
    <template v-else>
      <div
        v-for="(part, index) in contentParts"
        :key="`${message.id}-part-${index}`"
        class="content-part"
      >
        <!-- 渲染普通文本部分 (没有外壳) -->
        <div v-if="part.type === 'text'" class="text" v-html="part.renderedContent"></div>

        <!-- 渲染代码块部分 -->
        <CodeBlock v-else-if="part.type === 'code'" :code="part.code" :language="part.language" />

        <!-- 渲染带外壳的 Markdown 部分 -->
        <div v-else-if="part.type === 'markdown-code'" class="code-block markdown-block">
          <div class="code-header">
            <span class="language">MARKDOWN</span>
            <button @click="copyContent(part.content, index)" class="copy-btn">
              {{ copiedPartIndex === index ? '已复制' : '复制' }}
            </button>
          </div>
          <div class="markdown-preview" v-html="renderMarkdown(part.content)"></div>
        </div>
      </div>

      <!-- 空消息处理 -->
      <div
        v-if="!isLoading && (!message.content || message.content.trim() === '')"
        class="empty-message"
      >
        <span class="text-gray-400 italic">(消息内容为空)</span>
      </div>
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
  white-space: normal; /*避免保留原始换行符*/
  word-wrap: break-word;
}

.content-part {
  margin: 0;
}

/* 相邻的 content-part 添加间距 */
.content-part + .content-part {
  margin-top: 1.5em;
}

/* --- 代码块和 Markdown 块的统一样式 --- */
.code-block {
  margin: 0; /* 在 content-part 中控制外边距 */
  border-radius: 6px;
  overflow: hidden;
  background-color: #f6f8fa;
  border: 1px solid #e1e4e8;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5em 1em;
  background-color: #f1f1f1;
  border-bottom: 1px solid #e1e4e8;
}

.language {
  font-size: 0.85em;
  color: #666;
  text-transform: uppercase;
}

.copy-btn {
  border: none;
  background-color: transparent;
  color: #0366d6;
  cursor: pointer;
  font-size: 0.85em;
  padding: 2px 6px;
  border-radius: 3px;
}
.copy-btn:hover {
  background-color: #0366d61a;
}

/* Markdown 预览区的特殊样式 */
.markdown-preview {
  padding: 1em;
}

.timestamp {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 8px;
  text-align: right;
}

/* deep 选择器用于修改 v-html 内部的样式 */
/* 1.移除所有块级元素的默认外边距 */
.text :deep(p),
.text :deep(ul),
.text :deep(ol),
.text :deep(h1),
.text :deep(h2),
.text :deep(h3),
.text :deep(h4),
.text :deep(h5),
.text :deep(h6),
.text :deep(blockquote),
.text :deep(pre) {
  margin: 0;
}

/* 2. 只在相邻的块级元素之间添加上外边距 */
/* + 选择器（相邻兄弟选择器）只会选中紧跟在另一个块级元素后面的元素。*/
.text :deep(p + p),
.text :deep(ul + p),
.text :deep(p + ul),
.text :deep(ol + p),
.text :deep(p + ol),
.text :deep(h1 + p),
.text :deep(h2 + p),
.text :deep(h3 + p),
.text :deep(p + h1),
.text :deep(p + h2),
.text :deep(p + h3),
.text :deep(div + div),
.text :deep(blockquote + p),
.text :deep(p + blockquote) {
  margin-top: 1em;
}

/* 3. 列表处理：移除 ul/ol 的默认内边距 */
.text :deep(ul),
.text :deep(ol) {
  padding-left: 1.5em; /* 保留列表的缩进 */
}

/* 4. 标题的样式*/
.text :deep(h1),
.text :deep(h2),
.text :deep(h3) {
  font-weight: 600;
  margin-bottom: 0.5em; /* 标题和下方内容之间的距离 */
}
.text :deep(h1) {
  font-size: 1.5em;
}
.text :deep(h2) {
  font-size: 1.25em;
}
.text :deep(h3) {
  font-size: 1.1em;
}

/* 5. 其他元素的样式*/
.text :deep(blockquote) {
  border-left: 3px solid #dfe2e5;
  padding-left: 1em;
  color: #6a737d;
  margin-top: 1em; /* 确保引用块也有间距 */
}

.text :deep(hr) {
  margin: 1.5em 0; /* 增加上下外边距，把它和文字推开 */
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
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; /* 使用等宽字体 */
}
</style>
