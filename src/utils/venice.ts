export interface VeniceMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface VeniceParameters {
  character_slug?: string
  strip_thinking_response?: boolean
  disable_thinking?: boolean
  enable_web_search?: 'auto' | 'off' | 'on'
  enable_web_citations?: boolean
  include_search_results_in_stream?: boolean
  include_venice_system_prompt?: boolean
}

export interface VeniceCompletionRequest {
  model: string
  messages: VeniceMessage[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  venice_parameters?: VeniceParameters
}

export interface VeniceStreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      content?: string
      role?: string
    }
    finish_reason: string | null
  }>
}

export class VeniceAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'VeniceAPIError'
  }
}

export class VeniceClient {
  private baseURL = 'https://api.venice.ai/api/v1'
  private apiKey: string

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new VeniceAPIError('Venice API key is required')
    }
    this.apiKey = apiKey
  }

  async createChatCompletion(request: VeniceCompletionRequest): Promise<Response> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      let errorMessage = `Venice API request failed with status ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch {
        // If JSON parsing fails, use the default error message
      }
      throw new VeniceAPIError(errorMessage, response.status)
    }

    return response
  }

  async *streamChatCompletion(request: VeniceCompletionRequest): AsyncGenerator<string, void, unknown> {
    const streamRequest = { ...request, stream: true }
    const response = await this.createChatCompletion(streamRequest)
    
    if (!response.body) {
      throw new VeniceAPIError('No response body received from Venice API')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              return
            }
            try {
              const chunk: VeniceStreamChunk = JSON.parse(data)
              const content = chunk.choices[0]?.delta?.content
              if (content) {
                yield content
              }
            } catch (e) {
              console.error('Failed to parse SSE chunk:', e, 'Data:', data)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async createNonStreamingCompletion(request: VeniceCompletionRequest): Promise<string> {
    const nonStreamRequest = { ...request, stream: false }
    const response = await this.createChatCompletion(nonStreamRequest)
    
    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }
}

export function parseSSEStream(reader: ReadableStreamDefaultReader<Uint8Array>): ReadableStream<string> {
  const decoder = new TextDecoder()
  let buffer = ''

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()
        
        if (done) {
          // Process any remaining buffer
          if (buffer.trim()) {
            const lines = buffer.split('\n')
            for (const line of lines) {
              processLine(line, controller)
            }
          }
          controller.close()
          return
        }

        // Add new data to buffer
        buffer += decoder.decode(value, { stream: true })
        
        // Process complete lines
        const lines = buffer.split('\n')
        // Keep the last line in buffer (might be incomplete)
        buffer = lines.pop() || ''
        
        // Process all complete lines
        for (const line of lines) {
          processLine(line, controller)
        }
        
      } catch (error) {
        controller.error(error)
      }
    },
    
    cancel() {
      reader.releaseLock()
    }
  })
}

function processLine(line: string, controller: ReadableStreamDefaultController<string>) {
  const trimmedLine = line.trim()
  
  if (trimmedLine === '') return
  
  if (trimmedLine.startsWith('data: ')) {
    const data = trimmedLine.slice(6)
    
    if (data === '[DONE]') {
      return
    }
    
    try {
      const chunk: VeniceStreamChunk = JSON.parse(data)
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        controller.enqueue(content)
      }
    } catch (e) {
      // Log but don't fail on parse errors - could be a partial chunk
      console.warn('Could not parse SSE data:', data.substring(0, 100) + '...')
    }
  }
}