<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useChatStore } from '../stores/chat'
import { useRouter } from 'vue-router'

const chatStore = useChatStore()
const router = useRouter()

// 从 store 中获取对话列表
const { chatList } = storeToRefs(chatStore)

const createNewChat = () => {
  const newChatId = chatStore.createNewChat() // 假设 store 有这个方法
  router.push(`/chat/${newChatId}`)
}
</script>

<template>
  <div class="chat-list-panel">
    <header>
      <h2>聊天记录</h2>
      <button @click="createNewChat">+</button>
    </header>
    <ul>
      <!-- 使用 v-for 循环渲染对话列表 -->
      <router-link
        v-for="chat in chatList"
        :key="chat.id"
        :to="`/chat/${chat.id}`"
        custom
        v-slot="{ navigate, isActive }"
      >
        <li @click="navigate" :class="{ active: isActive }">
          {{ chat.title || '新对话' }}
        </li>
      </router-link>
    </ul>
  </div>
</template>

<style scoped>
.chat-list-panel {
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  border-right: 1px solid #e9ecef;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}
header h2 {
  margin: 0;
  font-size: 1rem;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
}
li {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #e9ecef;
}
li:hover {
  background-color: #e9ecef;
}
li.active {
  background-color: #e0e9f4;
  font-weight: 500;
}
</style>
