import type { ApiMessage } from '@/types'

// 启用模拟模式，避免消耗真实API额度
const IS_MOCK_MODE = true // 设置为 true 来测试UI功能

// Coze API 请求体的"蓝图"
interface CozeChatPayload {
  bot_id: string
  user_id: string
  additional_messages: ApiMessage[]
  stream: boolean
}

/**
 * @description 使用原生 fetch API 与 Coze 服务进行流式通信
 */
export async function fetchCozeStream(
  endpoint: string,
  apiKey: string,
  payload: CozeChatPayload,
): Promise<ReadableStream | null> {
  // 如果开启了模拟模式，直接返回模拟数据流
  if (IS_MOCK_MODE) {
    console.log('使用模拟模式，避免消耗API额度')
    return createMockStream()
  }

  // 真实的 fetch 逻辑
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      // 特殊处理余额不足的错误
      if (errorData.code === 4011) {
        throw new Error(`Coze Token 余额不足，请充值后再试。错误代码: ${errorData.code}`)
      }

      throw new Error(
        `API请求失败: ${response.status} ${response.statusText}. ${errorData.message || errorData.msg || ''}`,
      )
    }

    return response.body
  } catch (error) {
    console.error('网络请求或处理失败:', error)
    throw error
  }
}

// 增强的模拟数据流，包含代码块和复杂内容
function createMockStream(): ReadableStream {
  const mockResponses = [
    '你好！我是智聊助手。让我为你演示一下我的功能。\n\n',
    '我可以帮你编写代码，比如这个简单的 JavaScript 函数：\n\n',
    '```javascript\n',
    'function greetUser(name) {\n',
    '  return `Hello, ${name}! 欢迎使用智聊助手。`;\n',
    '}\n\n',
    'console.log(greetUser("用户"));\n',
    '```\n\n',
    '我还可以：\n',
    '- **回答问题** - 解答各种技术和非技术问题\n',
    '- **编写代码** - 支持多种编程语言\n',
    '- **分析问题** - 帮助你理解复杂概念\n',
    '- **提供建议** - 给出实用的解决方案\n\n',
    '这是一个模拟回复，用于测试前端功能。真实使用时请检查你的 Coze 账户。',
  ]

  let index = 0

  return new ReadableStream({
    start(controller) {
      const pushChunk = () => {
        if (index < mockResponses.length) {
          const chunk = mockResponses[index++]

          // 【修复】正确转义 JSON 字符串，处理换行符和特殊字符
          const escapedContent = chunk
            .replace(/\\/g, '\\\\') // 转义反斜杠
            .replace(/"/g, '\\"') // 转义双引号
            .replace(/\n/g, '\\n') // 转义换行符
            .replace(/\r/g, '\\r') // 转义回车符
            .replace(/\t/g, '\\t') // 转义制表符

          // 模拟 Coze API 返回的 SSE 格式
          const sseFormattedChunk = `data: {"message":{"role":"assistant","type":"answer","content":"${escapedContent}"}}\n\n`
          controller.enqueue(new TextEncoder().encode(sseFormattedChunk))

          // 模拟打字速度
          setTimeout(pushChunk, 100)
        } else {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        }
      }

      pushChunk()
    },
  })
}
