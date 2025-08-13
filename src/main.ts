import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useChatStore } from './stores/chat' //导入 chat store

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// 应用挂载后，初始化 store 从 localStorage 加载数据
const chatStore = useChatStore()
chatStore.init()
