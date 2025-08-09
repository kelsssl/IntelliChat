import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

// 配置MarkdownIt实例
const md: MarkdownIt = new MarkdownIt({
  html: false, // 出于安全考虑禁用HTML
  breaks: true, // 将换行符转换为<br>
  linkify: true, // 自动将URL转为链接
  typographer: true, // 启用一些语言中性的替换+引号美化

  //高亮函数
  highlight: function (str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str, true).value
      } catch {
        // 如果高亮失败，则不执行任何操作
      }
    }

    // 如果没有语言或高亮失败，返回原始代码并由MarkdownIt进行默认的HTML转义
    return md.utils.escapeHtml(str)
  },
})

// 渲染Markdown内容
export function renderMarkdown(content: string): string {
  return md.render(content)
}

// 检测内容是否包含代码块
export function hasCodeBlock(content: string): boolean {
  return content.includes('```')
}

// 提取所有代码块
export function extractCodeBlocks(content: string): { code: string; language: string }[] {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  const blocks: { code: string; language: string }[] = []
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'plaintext',
      code: match[2].trim(),
    })
  }

  return blocks
}
