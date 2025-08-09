<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChatStore } from '../stores/chat'

// 属性
const props = defineProps<{
  isOpen: boolean
}>()

// 事件
const emit = defineEmits<{
  (e: 'close'): void
}>()

const chatStore = useChatStore()

// 本地状态，用于编辑
const localSystemPrompt = ref(chatStore.settings.systemPrompt)
const localApiEndpoint = ref(chatStore.settings.apiEndpoint)
const localApiKey = ref(chatStore.settings.apiKey)

// 监听props变化，更新本地状态
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      // 打开模态框时，初始化本地状态
      localSystemPrompt.value = chatStore.settings.systemPrompt
      localApiEndpoint.value = chatStore.settings.apiEndpoint
      localApiKey.value = chatStore.settings.apiKey
    }
  },
)

// 关闭模态框
const close = () => {
  emit('close')
}

// 保存设置
const saveSettings = () => {
  // 更新系统提示词
  chatStore.updateSystemPrompt(localSystemPrompt.value)

  // 更新API设置
  chatStore.settings.apiEndpoint = localApiEndpoint.value
  chatStore.settings.apiKey = localApiKey.value

  // 保存设置到本地存储
  localStorage.setItem('app-settings', JSON.stringify(chatStore.settings))

  // 关闭模态框
  close()
}
</script>

<template>
  <div v-if="isOpen" class="settings-modal-backdrop" @click="close">
    <div class="settings-modal" @click.stop>
      <div class="modal-header">
        <h2>设置</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="systemPrompt">系统提示词</label>
          <textarea
            id="systemPrompt"
            v-model="localSystemPrompt"
            rows="5"
            placeholder="设置AI助手的角色和行为"
          ></textarea>
          <p class="help-text">
            系统提示词用于定义AI助手的角色、行为和限制。例如："你是一位经验丰富的前端开发工程师，擅长Vue和React。"
          </p>
        </div>

        <div class="form-group">
          <label for="apiEndpoint">API地址</label>
          <input
            id="apiEndpoint"
            v-model="localApiEndpoint"
            type="text"
            placeholder="输入Coze API地址"
          />
        </div>

        <div class="form-group">
          <label for="apiKey">API密钥</label>
          <input id="apiKey" v-model="localApiKey" type="password" placeholder="输入Coze API密钥" />
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" @click="close">取消</button>
        <button class="save-btn" @click="saveSettings">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-modal {
  background-color: white;
  width: 90%;
  max-width: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1rem;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.help-text {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #666;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  border-top: 1px solid #eee;
}

.cancel-btn,
.save-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.cancel-btn {
  background-color: transparent;
  border: 1px solid #ddd;
  margin-right: 0.5rem;
}

.save-btn {
  background-color: #0366d6;
  color: white;
  border: none;
}
</style>
