// 消息角色类型
export type MessageRole = 'user' | 'assistant' | 'system'

// 单条消息的类型
export interface Message {
  id: string // 唯一标识
  role: MessageRole // 消息角色
  content: string // 消息内容
  timestamp: number // 时间戳
  imageUrl?: string // 图片
}

// 专门用于 API 请求的类型
export interface ApiMessage {
  role: 'user' | 'assistant'
  content: string
  content_type: 'text'
}

// 对话的类型
export interface Chat {
  id: string // 对话ID
  title: string // 对话标题
  messages: Message[] // 消息列表
  systemPrompt: string // 系统提示词
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

// API请求参数类型
export interface ApiRequestParams {
  messages: {
    role: MessageRole
    content: string
  }[]
}

// 应用设置类型
export interface AppSettings {
  systemPrompt: string // 系统提示词
  apiEndpoint: string // API地址
  apiKey: string // API密钥
  cozeBotId: string // Coze Bot ID
}
