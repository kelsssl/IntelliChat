import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/ChatView.vue'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: Home,
    },
    {
      path: '/chat/:chatId',
      name: 'chat',
      component: ChatView,
    },
  ],
})

export default router
