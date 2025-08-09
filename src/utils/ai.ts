import { createServerFn } from '@tanstack/react-start'
import { VeniceClient, VeniceAPIError, parseSSEStream, type VeniceMessage } from './venice'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const DEFAULT_SYSTEM_PROMPT = `You are TanStack Chat, an AI assistant using Markdown for clear and structured responses. Format your responses following these guidelines:

1. Use headers for sections:
   # For main topics
   ## For subtopics
   ### For subsections

2. For lists and steps:
   - Use bullet points for unordered lists
   - Number steps when sequence matters
   
3. For code:
   - Use inline \`code\` for short snippets
   - Use triple backticks with language for blocks:
   \`\`\`python
   def example():
       return "like this"
   \`\`\`

4. For emphasis:
   - Use **bold** for important points
   - Use *italics* for emphasis
   - Use > for important quotes or callouts

5. For structured data:
   | Use | Tables |
   |-----|---------|
   | When | Needed |

6. Break up long responses with:
   - Clear section headers
   - Appropriate spacing between sections
   - Bullet points for better readability
   - Short, focused paragraphs

7. For technical content:
   - Always specify language for code blocks
   - Use inline \`code\` for technical terms
   - Include example usage where helpful

Keep responses concise and well-structured. Use appropriate Markdown formatting to enhance readability and understanding.`

// Streaming implementation using Venice API
export const genAIResponse = createServerFn({ method: 'GET', response: 'raw' })
  .validator(
    (d: {
      messages: Array<Message>
      systemPrompt?: { value: string; enabled: boolean }
      model?: string
      webSearchEnabled?: boolean
    }) => d,
  )
  .handler(async ({ data }) => {
    // Check for API key in environment variables
    const apiKey = process.env.VENICE_API_KEY || import.meta.env.VENICE_API_KEY

    if (!apiKey) {
      throw new Error(
        'Missing API key: Please set VENICE_API_KEY in your environment variables or .env file.'
      )
    }
    
    // Create Venice client
    const venice = new VeniceClient(apiKey)

    // Filter out error messages and empty messages
    const formattedMessages = data.messages
      .filter(
        (msg) =>
          msg.content.trim() !== '' &&
          !msg.content.startsWith('Sorry, I encountered an error'),
      )
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content.trim(),
      }))

    if (formattedMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid messages to send' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Prepare system prompt
    const systemPrompt = data.systemPrompt?.enabled
      ? `${DEFAULT_SYSTEM_PROMPT}\n\n${data.systemPrompt.value}`
      : DEFAULT_SYSTEM_PROMPT

    // Debug log to verify prompt layering
    console.log('System Prompt Configuration:', {
      hasCustomPrompt: data.systemPrompt?.enabled,
      customPromptValue: data.systemPrompt?.value,
      finalPrompt: systemPrompt,
    })

    // Prepare messages with system prompt
    const veniceMessages: VeniceMessage[] = [
      { role: 'system', content: systemPrompt },
      ...formattedMessages
    ]

    try {
      // Create streaming request to Venice API
      const response = await venice.createChatCompletion({
        model: data.model || 'venice-uncensored',
        messages: veniceMessages,
        stream: true,
        max_tokens: 4096,
        temperature: 0.7,
        venice_parameters: {
          include_venice_system_prompt: true,
          enable_web_search: data.webSearchEnabled ? 'auto' : 'off',
          enable_web_citations: data.webSearchEnabled || false,
        }
      })

      // Parse SSE stream and return as ReadableStream
      if (!response.body) {
        throw new Error('No response body received from Venice API')
      }

      const reader = response.body.getReader()
      const stream = parseSSEStream(reader)
      
      return new Response(stream)
    } catch (error) {
      console.error('Error in genAIResponse:', error)
      
      // Error handling with specific messages
      let errorMessage = 'Failed to get AI response'
      let statusCode = 500
      
      if (error instanceof VeniceAPIError) {
        errorMessage = error.message
        statusCode = error.statusCode || 500
        
        if (error.statusCode === 429) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.'
        } else if (error.statusCode === 401) {
          errorMessage = 'Authentication failed. Please check your Venice API key.'
        } else if (error.statusCode === 503) {
          errorMessage = 'Venice API is temporarily unavailable. Please try again later.'
        }
      } else if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.'
        } else if (error.message.includes('Connection error')) {
          errorMessage = 'Connection to Venice API failed. Please check your internet connection.'
          statusCode = 503
        } else {
          errorMessage = error.message
        }
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.name : undefined
      }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  })