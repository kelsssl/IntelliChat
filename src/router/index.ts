import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/ChatView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 当访问根路径 / 时，自动重定向到第一个对话
      // 在 Pinia 中实现获取第一个对话ID的逻辑
      path: '/',
      redirect: (to) => {
        // 这里先写个占位，后面会从 store 里动态获取
        const firstChatId = 'default-chat-id' // 稍后替换
        return `/chat/${firstChatId}`
      },
    },
    {
      // 定义带参数的动态路由
      path: '/chat/:chatId',
      name: 'chat',
      component: ChatView,
    },
  ],
})

export default router
