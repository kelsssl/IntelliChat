import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message, Chat, AppSettings, MessageRole } from '@/types/index'
import { v4 as uuidv4 } from 'uuid'

const DEFAULT_SYSTEM_PROMPT = '你是一个有帮助的人工智能助手。'

export const useChatStore = defineStore('chat', () => {
  // 1.state：存储核心数据
  const chatList = ref<Chat[]>([]) //存储所有对话的列表。

  const currentChatId = ref<string | null>(null) //追踪当前被激活对话的 ID

  const settings = ref<AppSettings>({
    //存储全局应用设置: API Key 和端点。
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    apiEndpoint: import.meta.env.VITE_COZE_API_ENDPOINT || '',
    apiKey: import.meta.env.VITE_COZE_API_KEY || '',
  })

  const isSending = ref(false) //表示当前是否正在等待AI响应，发送按钮的禁用状态

  //2: GETTERS - 计算属性
  // Getters 用于从 State 中派生出新的状态。
  // 它们是响应式的，并且会被缓存，只有在依赖的状态改变时才会重新计算。

  /**
   * @description 根据 currentChatId 从 chatList 中动态查找并返回当前对话对象。
   * 连接“ID指针”和“实际数据”的桥梁。
   * @returns {Chat | null} 当前激活的对话对象，如果没找到则返回 null。
   */
  const currentChat = computed(() => {
    if (!currentChatId.value) return null
    return chatList.value.find((chat) => chat.id === currentChatId.value) ?? null
  })

  /**
   * @description 为API请求准备的、包含 system prompt 的完整消息列表。
   * 将UI数据 (currentChat.messages) 和业务数据 (systemPrompt) 聚合在一起。
   * @returns {Message[]} 一个符合LLM API格式的完整消息数组。
   */
  const fullMessages = computed(() => {
    if (!currentChat.value) return []
    return [
      {
        role: 'system',
        content: currentChat.value.systemPrompt || settings.value.systemPrompt,
      },
      ...currentChat.value.messages,
    ]
  })

  //3 action ：修改state、封装业务逻辑

  // 3.1 生命周期与持久化
  /**
   * @description 应用的初始化程序。从本地存储加载数据，并设置初始状态。
   * 在 ChatView.vue 的 onMounted 和 router/index.ts 的重定向逻辑中被调用。
   */
  function init() {
    const savedChats = localStorage.getItem('chat-list')
    if (savedChats) {
      chatList.value = JSON.parse(savedChats)
    }

    // 如果列表为空，就让它为空。默认选中第一个对话（如果存在）。
    if (chatList.value.length > 0) {
      setCurrentChat(chatList.value[0].id)
    } else {
      // 如果列表为空，确保当前ID也为空
      currentChatId.value = null
    }

    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      settings.value = JSON.parse(savedSettings)
    }
  }

  /**
   * @description 将当前所有状态保存到本地存储。
   * 这是一个内部辅助函数，在任何修改数据的 Action 后被调用。
   */
  function saveToLocalStorage() {
    localStorage.setItem('chat-list', JSON.stringify(chatList.value))
    localStorage.setItem('app-settings', JSON.stringify(settings.value))
  }

  //3.2对话管理
  /**
   * @description 创建一个全新的对话，被ChatList.vue的“新建对话”按钮调用。
   * @returns {string} 新创建对话的ID，方便路由进行跳转。
   */
  function createNewChat() {
    const now = new Date()
    const time = now.toTimeString().split(' ')[0].slice(0, 5) // 获取 "HH:mm"
    const newChat: Chat = {
      id: uuidv4(),
      title: `新对话 ${time}`, //添加时间戳，避免标题重复
      messages: [],
      systemPrompt: settings.value.systemPrompt,
      createdAt: now.getTime(),
      updatedAt: now.getTime(),
    }
    chatList.value.unshift(newChat)
    saveToLocalStorage()
    return newChat.id
  }

  /**
   * @description 删除指定ID的对话。
   * 被 ChatList.vue 的删除按钮调用。
   * @param {string} chatId - 要删除的对话ID。
   */
  function deleteChat(chatId: string) {
    const index = chatList.value.findIndex((c) => c.id === chatId)
    if (index !== -1) {
      chatList.value.splice(index, 1)
      saveToLocalStorage()
    }
  }

  /**
   * @description 重命名指定ID的对话。
   * 被 ChatList.vue 的重命名功能和 ChatView.vue 的自动标题生成功能调用。
   * @param {string} chatId - 要重命名的对话ID。
   * @param {string} newTitle - 新的标题。
   */
  function renameChat(chatId: string, newTitle: string) {
    const chat = chatList.value.find((c) => c.id === chatId)
    if (chat && newTitle.trim()) {
      chat.title = newTitle.trim()
      updateChat(chatId) // 复用 updateChat 来更新时间戳
      saveToLocalStorage()
    }
  }

  // 3.3消息管理
  /**
   * @description 切换当前激活的对话。这是连接路由和状态的核心。
   * 被 ChatView.vue 中监听路由变化的 watch 回调调用。
   * @param {string} chatId - 要激活的对话ID。
   */
  function setCurrentChat(chatId: string) {
    currentChatId.value = chatId
  }

  /**
   * @description 向当前对话添加一条用户消息。
   * 这是 addUserMessage 的快捷方式，提供给UI层调用。
   * @param {string} content - 消息内容。
   */
  function addUserMessage(content: string) {
    return addMessageToCurrentChat('user', content)
  }

  /**
   * @description 向当前对话添加一条AI助手消息。
   * @param {string} [content=''] - 初始内容，默认为空字符串，用于流式更新。
   */
  function addAssistantMessage(content: string = '') {
    return addMessageToCurrentChat('assistant', content)
  }

  /**
   * @description 实时更新AI助手消息的内容，用于实现打字机效果。
   * @param {string} messageId - 要更新的消息ID。
   * @param {string} content - 最新的完整内容。
   */
  function updateAssistantMessage(messageId: string, content: string) {
    if (!currentChat.value) return

    const message = currentChat.value.messages.find((msg) => msg.id === messageId)
    if (message && message.role === 'assistant') {
      message.content = content
      updateChat(currentChat.value.id)
      saveToLocalStorage()
    }
  }

  //3.4 内部辅助函数

  /**
   * @description 更新指定ID对话的 `updatedAt` 时间戳，是一个内部复用的工具函数。
   * @param {string} chatId - 要更新的对话ID。
   */
  function updateChat(chatId: string) {
    const chat = chatList.value.find((c) => c.id === chatId)
    if (chat) {
      chat.updatedAt = Date.now()
    }
  }

  /**
   * @description 消息添加逻辑，被 addUserMessage 和 addAssistantMessage 复用。
   */
  function addMessageToCurrentChat(role: MessageRole, content: string = '') {
    if (!currentChat.value) return null

    const message: Message = {
      id: uuidv4(),
      role,
      content,
      timestamp: Date.now(),
    }
    currentChat.value.messages.push(message)
    updateChat(currentChat.value.id)
    saveToLocalStorage()
    return message
  }

  return {
    // State
    chatList,
    currentChatId,
    settings,
    isSending,
    // Getters
    currentChat,
    fullMessages,
    // Actions
    init,
    setCurrentChat,
    createNewChat,
    deleteChat,
    renameChat,
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
  }
})
