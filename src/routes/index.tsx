import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Settings } from 'lucide-react'
import { 
  SettingsDialog, 
  ChatMessage, 
  LoadingIndicator, 
  ChatInput, 
  Sidebar, 
  WelcomeScreen,
  type DebugInfo
} from '../components'
import { useConversations, useAppState, actions } from '../store'
import { type Message } from '../utils'
import { genResponse } from '../utils/aifiResponse'

function Home() {
  const {
    conversations,
    currentConversationId,
    currentConversation,
    setCurrentConversationId,
    createNewConversation,
    updateConversationTitle,
    deleteConversation,
    addMessage,
  } = useConversations()
  
  const { isLoading, setLoading } = useAppState()

  // Memoize messages to prevent unnecessary re-renders
  const messages = useMemo(() => currentConversation?.messages || [], [currentConversation]);

  // Local state
  const [input, setInput] = useState('')
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [pendingMessage, setPendingMessage] = useState<Message | null>(null)
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    systemMode: 'AI-Fi',
    messageCount: 0
  });

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight
    }
  }, []);

  // Scroll to bottom when messages change or loading state changes
  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])
  
  // Update message count in debug info when messages change
  useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      messageCount: messages.length,
    }))
  }, [messages])

  const createTitleFromInput = useCallback((text: string) => {
    const words = text.trim().split(/\s+/)
    const firstThreeWords = words.slice(0, 3).join(' ')
    return firstThreeWords + (words.length > 3 ? '...' : '')
  }, []);

  // Helper functions to extract user information from conversation
  const extractUserName = useCallback((messages: Message[]) => {
    // Look for name patterns in user messages
    for (const msg of messages) {
      if (msg.role === 'user') {
        const nameMatch = msg.content.match(/(?:my name is|i'm|i am)\s+([a-zA-Z\s]+)/i)
        if (nameMatch) {
          return nameMatch[1].trim()
        }
      }
    }
    return undefined
  }, []);

  const extractUserPhone = useCallback((messages: Message[]) => {
    // Look for phone patterns in user messages
    for (const msg of messages) {
      if (msg.role === 'user') {
        const phoneMatch = msg.content.match(/(?:phone|number|call me at)\s*[:\-]?\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i)
        if (phoneMatch) {
          return phoneMatch[1].replace(/[-.\s]/g, '')
        }
      }
    }
    return undefined
  }, []);

  // Process AI response through AI-Fi agent system
  const processAIResponse = useCallback(async (conversationId: string, userMessage: Message) => {
    try {
      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        conversationId: conversationId,
        messageCount: messages.length + 1,
      }))

      // Always route through AI-Fi agent system
      const response = await genResponse({
        data: {
          messages: [...messages, userMessage],
          conversationId: conversationId,
          userName: extractUserName(messages),
          userPhone: extractUserPhone(messages),
        },
      })
      
      // Extract debug headers from response
      const agentName = response.headers.get('X-Agent-Name')
      const agentAction = response.headers.get('X-Agent-Action')
      const userType = response.headers.get('X-User-Type')
      const userName = response.headers.get('X-User-Name')
      const userStage = response.headers.get('X-User-Stage')
      
      setDebugInfo(prev => ({
        ...prev,
        lastAgent: agentName || undefined,
        lastAction: agentAction || undefined,
        currentUser: {
          name: userName || undefined,
          userType: userType || undefined,
          stage: userStage || undefined,
        },
      }))

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader found in response')
      }

      const decoder = new TextDecoder()

      let done = false
      let newMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: '',
      }
      while (!done) {
        const out = await reader.read()
        done = out.done
        if (!done) {
          // Venice API returns plain text chunks for streaming
          const chunk = decoder.decode(out.value)
          if (chunk) {
            newMessage = {
              ...newMessage,
              content: newMessage.content + chunk,
            }
            setPendingMessage(newMessage)
          }
        }
      }

      setPendingMessage(null)
      setLoading(false) // Turn off loading when streaming is complete
      if (newMessage.content.trim()) {
        // Add AI message to Convex
        console.log('Adding AI response to conversation:', conversationId)
        await addMessage(conversationId, newMessage)
      }
    } catch (error) {
      console.error('Error in AI response:', error)
      setLoading(false) // Turn off loading on error
      
      // Update debug info with error
      setDebugInfo(prev => ({
        ...prev,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      }))
      
      // Add an error message to the conversation
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error generating a response. Please set the required API keys in your environment variables.',
      }
      await addMessage(conversationId, errorMessage)
    }
  }, [messages, addMessage, setLoading, setDebugInfo]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const currentInput = input
    setInput('') // Clear input early for better UX
    setLoading(true)
    setError(null)
    
    const conversationTitle = createTitleFromInput(currentInput)

    try {
      // Create the user message object
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: currentInput.trim(),
      }
      
      let conversationId = currentConversationId

      // If no current conversation, create one in Convex first
      if (!conversationId) {
        try {
          console.log('Creating new Convex conversation with title:', conversationTitle)
          // Create a new conversation with our title
          const convexId = await createNewConversation(conversationTitle)
          
          if (convexId) {
            console.log('Successfully created Convex conversation with ID:', convexId)
            conversationId = convexId
            
            // Add user message directly to Convex
            console.log('Adding user message to Convex conversation:', userMessage.content)
            await addMessage(conversationId!, userMessage)
          } else {
            console.warn('Failed to create Convex conversation, falling back to local')
            // Fallback to local storage if Convex creation failed
            const tempId = Date.now().toString()
            const tempConversation = {
              id: tempId,
              title: conversationTitle,
              messages: [],
            }
            
            actions.addConversation(tempConversation)
            conversationId = tempId
            
            // Add user message to local state
            actions.addMessage(conversationId, userMessage)
          }
        } catch (error) {
          console.error('Error creating conversation:', error)
          throw new Error('Failed to create conversation')
        }
      } else {
        // We already have a conversation ID, add message directly to Convex
        console.log('Adding user message to existing conversation:', conversationId)
        await addMessage(conversationId, userMessage)
      }
      
      // Process with AI after message is stored
      await processAIResponse(conversationId!, userMessage)
      
    } catch (error) {
      console.error('Error:', error)
      setLoading(false) // Ensure loading is turned off on error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error processing your request.',
      }
      if (currentConversationId) {
        await addMessage(currentConversationId, errorMessage)
      }
      else {
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError('An unknown error occurred.')
        }
      }
    }
  }, [input, isLoading, createTitleFromInput, currentConversationId, createNewConversation, addMessage, processAIResponse, setLoading]);

  const handleDeleteChat = useCallback(async (id: string) => {
    await deleteConversation(id)
  }, [deleteConversation]);

  const handleUpdateChatTitle = useCallback(async (id: string, title: string) => {
    await updateConversationTitle(id, title)
    setEditingChatId(null)
    setEditingTitle('')
  }, [updateConversationTitle]);

  return (
    <div className="relative flex h-screen bg-gray-900">
      {/* Settings Button */}
      <div className="absolute z-50 top-5 right-5">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center justify-center w-10 h-10 text-white transition-opacity rounded-full bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar */}
      <Sidebar 
        conversations={conversations}
        currentConversationId={currentConversationId}
        setCurrentConversationId={setCurrentConversationId}
        handleDeleteChat={handleDeleteChat}
        editingChatId={editingChatId}
        setEditingChatId={setEditingChatId}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
        handleUpdateChatTitle={handleUpdateChatTitle}
        debugInfo={debugInfo}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {error && (
          <p className="w-full max-w-3xl p-4 mx-auto font-bold text-orange-500">{error}</p>
        )}
        {currentConversationId ? (
          <>
            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 pb-24 overflow-y-auto"
            >
              <div className="w-full max-w-3xl px-4 mx-auto">
                {[...messages, pendingMessage]
                  .filter((message): message is Message => message !== null)
                  .map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                {isLoading && <LoadingIndicator />}
              </div>
            </div>

            {/* Input */}
            <ChatInput 
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </>
        ) : (
          <WelcomeScreen 
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Home,
})