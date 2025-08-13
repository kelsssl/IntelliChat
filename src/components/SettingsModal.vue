<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChatStore } from '../stores/chat'

// --- 属性与事件 (Props & Emits) ---
const props = defineProps<{
  isOpen: boolean
}>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

// --- 状态管理 (State) ---
const chatStore = useChatStore()
// 本地状态，用于在不直接修改 store 的情况下进行编辑
const localSystemPrompt = ref('')

// --- 监听器 (Watcher) ---
// 当模态框被父组件打开时，用 store 中的最新值来初始化本地状态
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      localSystemPrompt.value = chatStore.settings.systemPrompt
    }
  },
)

// --- 方法 (Methods) ---
const close = () => {
  emit('close')
}

const saveSettings = () => {
  // 调用 store action 来更新全局的默认提示词
  chatStore.updateDefaultSystemPrompt(localSystemPrompt.value)
  // 关闭模态框
  close()
}
</script>

<template>
  <!-- 模态框的背景遮罩 -->
  <div v-if="isOpen" class="settings-modal-backdrop" @click="close">
    <!-- 模态框主体，.stop 修饰符防止点击内部时关闭 -->
    <div class="settings-modal" @click.stop>
      <!-- 头部 -->
      <div class="modal-header">
        <h2>自定义助手角色</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <!-- 内容区域 -->
      <div class="modal-body">
        <div class="form-group">
          <label for="systemPrompt">系统提示词 (System Prompt)</label>
          <textarea
            id="systemPrompt"
            v-model="localSystemPrompt"
            rows="8"
            placeholder="例如：你是一位资深的前端开发工程师..."
          ></textarea>
          <p class="help-text">
            在这里定义智聊助手的角色、行为和说话风格。这个设置将会应用到新创建的对话中。
          </p>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <button class="cancel-btn" @click="close">取消</button>
        <button class="save-btn" @click="saveSettings">保存并应用</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 样式部分可以保持不变或按需简化，这里提供一个精简版 */
.settings-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.settings-modal {
  background-color: white;
  width: 90%;
  max-width: 500px;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #9ca3af;
}
.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
}
.help-text {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}
.cancel-btn,
.save-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}
.cancel-btn {
  background-color: white;
  border-color: #d1d5db;
}
.save-btn {
  background-color: #3b82f6;
  color: white;
}
</style>
