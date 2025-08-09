import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message, Chat, AppSettings, MessageRole } from '@/types/index' // 假设 MessageRole 在 types 中定义
import { v4 as uuidv4 } from 'uuid'

// 默认系统提示词
const DEFAULT_SYSTEM_PROMPT = '你是一个有帮助的人工智能助手。'

export const useChatStore = defineStore('chat', () => {
  // 1. State对话列表
  const chatList = ref<Chat[]>([])
  // 追踪当前激活对话的ID
  const currentChatId = ref<string | null>(null)
  // 应用设置
  const settings = ref<AppSettings>({
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    apiEndpoint: import.meta.env.VITE_COZE_API_ENDPOINT || '',
    apiKey: import.meta.env.VITE_COZE_API_KEY || '',
  })

  // 是否正在发送消息
  const isSending = ref(false)

  // 2. 计算属性 (Getters) 根据 currentChatId 从列表中找到当前对话
  const currentChat = computed(() => {
    // 如果没有ID或找不到，返回一个空的占位对象，防止UI报错
    if (!currentChatId.value) return null
    return chatList.value.find((chat) => chat.id === currentChatId.value)
  })

  // 计算属性：获取带有系统消息的完整消息列表
  const fullMessages = computed(() => {
    if (!currentChat.value) return []
    return [
      { role: 'system', content: currentChat.value.systemPrompt || settings.value.systemPrompt },
      ...currentChat.value.messages,
    ]
  })

  // 3.切换当前对话
  function setCurrentChat(chatId: string) {
    currentChatId.value = chatId
  }

  // 添加消息到当前激活的对话
  function addMessageToCurrentChat(role: MessageRole, content: string = '') {
    if (!currentChat.value) return null // 如果没有当前对话，则不操作

    const message: Message = {
      id: uuidv4(),
      role,
      content,
      timestamp: Date.now(),
    }
    currentChat.value.messages.push(message)
    updateChat(currentChat.value.id) // 更新对话
    saveToLocalStorage() // 保存整个列表
    return message
  }

  // addUserMessage 变成 addMessageToCurrentChat 的一个快捷方式
  function addUserMessage(content: string) {
    return addMessageToCurrentChat('user', content)
  }

  function addAssistantMessage(content: string = '') {
    return addMessageToCurrentChat('assistant', content)
  }

  // 更新指定对话中的助手消息
  function updateAssistantMessage(messageId: string, content: string) {
    if (!currentChat.value) return

    const message = currentChat.value.messages.find((msg) => msg.id === messageId)
    if (message && message.role === 'assistant') {
      message.content = content
      updateChat(currentChat.value.id)
    }
    // 注意：流式更新时频繁保存可能影响性能，可以考虑在流结束后再调用 saveToLocalStorage()
    saveToLocalStorage()
  }

  // 更新指定ID的对话信息
  function updateChat(chatId: string) {
    const chat = chatList.value.find((c) => c.id === chatId)
    if (chat) {
      chat.updatedAt = Date.now()
    }
  }

  // 创建一个全新的对话
  function createNewChat() {
    const newChat: Chat = {
      id: uuidv4(),
      title: '新的对话',
      messages: [],
      systemPrompt: settings.value.systemPrompt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    chatList.value.unshift(newChat) // 添加到列表开头
    saveToLocalStorage()
    return newChat.id // 返回新对话的ID，方便路由跳转
  }

  // 清空当前对话的消息 (保留对话本身)
  function clearCurrentChatMessages() {
    if (currentChat.value) {
      currentChat.value.messages = []
      updateChat(currentChat.value.id)
      saveToLocalStorage()
    }
  }

  // 本地存储逻辑
  function saveToLocalStorage() {
    localStorage.setItem('chat-list', JSON.stringify(chatList.value))
    localStorage.setItem('app-settings', JSON.stringify(settings.value))
  }

  // 初始化逻辑
  function init() {
    // 加载对话列表
    const savedChats = localStorage.getItem('chat-list')
    if (savedChats) {
      try {
        chatList.value = JSON.parse(savedChats)
      } catch (e) {
        console.error('加载对话列表失败', e)
      }
    }

    // 如果加载后列表为空，则创建一个新对话
    if (chatList.value.length === 0) {
      const newId = createNewChat()
      setCurrentChat(newId)
    } else {
      // 默认选中最新的对话（列表中的第一个）
      setCurrentChat(chatList.value[0].id)
    }

    // 加载设置 (逻辑不变)
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      try {
        settings.value = JSON.parse(savedSettings)
      } catch (e) {
        console.error('加载设置失败', e)
      }
    }
  }

  return {
    // state
    chatList,
    currentChatId,
    settings,
    isSending,
    // getters
    currentChat,
    fullMessages,
    // actions
    setCurrentChat,
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
    createNewChat,
    clearCurrentChatMessages,
    init,
  }
})
