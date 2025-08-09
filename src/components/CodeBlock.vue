<template>
  <div class="code-block">
    <div class="code-header">
      <span class="language">{{ language }}</span>
      <button class="copy-btn" @click="copyCode" :class="{ copied }">
        {{ copied ? '已复制' : '复制' }}
      </button>
    </div>
    <pre><code :class="language" v-html="highlightedCode"></code></pre>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import hljs from 'highlight.js'

// 组件属性
const props = defineProps<{
  code: string
  language: string
}>()

// 复制状态
const copied = ref(false)

// 高亮后的代码
const highlightedCode = computed(() => {
  if (props.language && hljs.getLanguage(props.language)) {
    try {
      return hljs.highlight(props.language, props.code, true).value
    } catch (e) {
      console.error('代码高亮失败', e)
    }
  }
  // 如果不支持该语言或高亮失败，简单地转义HTML字符
  return props.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
})

// 复制代码到剪贴板
const copyCode = () => {
  navigator.clipboard
    .writeText(props.code)
    .then(() => {
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    })
    .catch((err) => {
      console.error('复制失败:', err)
    })
}
</script>

<style scoped>
.code-block {
  margin: 1em 0;
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

.copy-btn.copied {
  color: #28a745;
}

pre {
  margin: 0;
  padding: 1em;
  overflow-x: auto;
}

code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.85em;
  line-height: 1.45;
}
</style>
