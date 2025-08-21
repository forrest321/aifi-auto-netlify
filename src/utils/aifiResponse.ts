import { createServerFn } from '@tanstack/react-start'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// AI-Fi Agent Response System - Routes to appropriate Convex agents
export const genResponse = createServerFn({ method: 'GET', response: 'raw' })
  .validator(
    (d: {
      messages: Array<Message>
      conversationId: string
      userName?: string
      userPhone?: string
    }) => d,
  )
  .handler(async ({ data }) => {
    try {
      // Initialize Convex client for server-side operations
      const convexUrl = process.env.CONVEX_DEPLOYMENT || process.env.VITE_CONVEX_URL || import.meta.env.VITE_CONVEX_URL
      if (!convexUrl) {
        throw new Error('Convex URL not configured. Please set CONVEX_DEPLOYMENT or VITE_CONVEX_URL environment variable.')
      }
      
      const convex = new ConvexHttpClient(convexUrl)

      // Get the latest user message
      const latestMessage = data.messages[data.messages.length - 1]
      if (!latestMessage || latestMessage.role !== 'user') {
        throw new Error('No valid user message found')
      }

      // Route message to appropriate agent
      const routing = await convex.query(api.agentRouter.routeMessage, {
        message: latestMessage.content,
        conversationId: data.conversationId,
        userName: data.userName,
        userPhone: data.userPhone,
      })

      // Execute agent with workflow state awareness and get response
      const response = await convex.action(api.agentRouter.executeAgent, {
        agentName: routing.agent,
        message: latestMessage.content,
        userId: routing.currentUser?._id,
        conversationId: data.conversationId,
        action: routing.action,
        workflowState: routing.workflowState,
      })

      // Create streaming response (simulated for now - real streaming will require different approach)
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder()
          
          if (response.success) {
            // For now, send response immediately without artificial delays
            // TODO: Implement true streaming at the Convex agent level
            controller.enqueue(encoder.encode(response.response))
            controller.close()
          } else {
            // Stream error response
            const errorMsg = response.error || 'I encountered an issue processing your request.'
            controller.enqueue(encoder.encode(errorMsg))
            controller.close()
          }
        }
      })

      // Include debug information in response headers
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'X-Agent-Name': routing.agent || '',
          'X-Agent-Action': routing.action || '',
          'X-User-Type': routing.currentUser?.userType || '',
          'X-User-Name': routing.currentUser?.name || '',
          'X-User-Stage': routing.currentUser?.conversationState?.stage || '',
          'X-Workflow-State': routing.workflowState ? 'active' : 'none',
          'X-Routing-Reason': routing.routingReason || '',
        },
      })

    } catch (error) {
      console.error('Error in genAIFiResponse:', error)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'I encountered an unexpected error. Please try again.'
      
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder()
          controller.enqueue(encoder.encode(errorMessage))
          controller.close()
        }
      })

      return new Response(stream, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }
  })