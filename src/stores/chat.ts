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
    cozeBotId: import.meta.env.VITE_COZE_BOT_ID || '',
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
   */
  function init() {
    // 职责一：加载对话列表
    const savedChats = localStorage.getItem('chat-list')
    if (savedChats) {
      try {
        chatList.value = JSON.parse(savedChats)
      } catch (e) {
        console.error('加载对话列表失败', e)
      }
    }

    // 职责二：加载应用设置
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      try {
        settings.value = JSON.parse(savedSettings)
      } catch (e) {
        console.error('加载设置失败', e)
      }
    }
  }

  /**
   * @description 更新全局的默认系统提示词
   * @param {string} newPrompt - 新的提示词
   */
  function updateDefaultSystemPrompt(newPrompt: string) {
    if (typeof newPrompt === 'string') {
      settings.value.systemPrompt = newPrompt.trim()
      saveToLocalStorage()
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
      //找不到对话时findIndex返回-1
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
    if (chat && newTitle) {
      chat.title = newTitle
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
   * 【最终优化版】
   * @param {string} messageId - 要更新的消息ID。
   * @param {string} content - 最新的完整内容。
   */
  function updateAssistantMessage(messageId: string, content: string) {
    // 依然先进行安全检查
    if (!currentChat.value) return

    // 找到需要更新的消息在数组中的索引 (index)
    const messageIndex = currentChat.value.messages.findIndex((msg) => msg.id === messageId)

    // 确保找到了消息，并且它确实是助手的消息
    if (messageIndex !== -1 && currentChat.value.messages[messageIndex].role === 'assistant') {
      // 而是创建一个全新的消息对象，并用它替换掉数组中的旧对象。
      const updatedMessage = {
        ...currentChat.value.messages[messageIndex], // 复制旧消息的所有属性
        content: content, // 用新内容覆盖 content 属性
      }

      // 使用 splice 方法，用新对象替换旧对象。
      currentChat.value.messages.splice(messageIndex, 1, updatedMessage)

      // 更新时间和保存
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

    //创建一个message对象
    const message: Message = {
      id: uuidv4(), //生成消息的id
      role, //消息角色：用户或AI
      content, //内容
      timestamp: Date.now(), //时间戳记录当前时间
    }
    currentChat.value.messages.push(message) //将新消息 push 进当前对话的 messages 数组
    updateChat(currentChat.value.id)
    saveToLocalStorage()
    return message
  }

  /**
   * @description 更新应用设置并保存到本地存储
   * 被 SettingsModal.vue 的保存按钮调用
   * @param {Partial<AppSettings>} newSettings - 要更新的设置项
   */
  function updateSettings(newSettings: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...newSettings }
    saveToLocalStorage()
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
    updateDefaultSystemPrompt,
    setCurrentChat,
    createNewChat,
    deleteChat,
    renameChat,
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
    updateSettings,
  }
})
