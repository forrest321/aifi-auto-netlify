import { Store } from '@tanstack/store'
import type { Message } from '../utils/ai'

// Types
export interface Conversation {
  id: string
  title: string
  messages: Message[]
}

export interface Settings {
  model: string
  webSearchEnabled: boolean
}

export interface State {
  conversations: Conversation[]
  currentConversationId: string | null
  isLoading: boolean
  settings: Settings
}

const initialState: State = {
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  settings: {
    model: 'venice-uncensored',
    webSearchEnabled: false
  }
}

export const store = new Store<State>(initialState)

export const actions = {

  // Chat actions
  setConversations: (conversations: Conversation[]) => {
    store.setState(state => ({ ...state, conversations }))
  },

  setCurrentConversationId: (id: string | null) => {
    store.setState(state => ({ ...state, currentConversationId: id }))
  },

  addConversation: (conversation: Conversation) => {
    store.setState(state => ({
      ...state,
      conversations: [...state.conversations, conversation],
      currentConversationId: conversation.id
    }))
  },

  updateConversationId: (oldId: string, newId: string) => {
    store.setState(state => ({
      ...state,
      conversations: state.conversations.map(conv =>
        conv.id === oldId ? { ...conv, id: newId } : conv
      ),
      currentConversationId: state.currentConversationId === oldId ? newId : state.currentConversationId
    }))
  },

  updateConversationTitle: (id: string, title: string) => {
    store.setState(state => ({
      ...state,
      conversations: state.conversations.map(conv =>
        conv.id === id ? { ...conv, title } : conv
      )
    }))
  },

  deleteConversation: (id: string) => {
    store.setState(state => ({
      ...state,
      conversations: state.conversations.filter(conv => conv.id !== id),
      currentConversationId: state.currentConversationId === id ? null : state.currentConversationId
    }))
  },

  addMessage: (conversationId: string, message: Message) => {
    store.setState(state => ({
      ...state,
      conversations: state.conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      )
    }))
  },

  setLoading: (isLoading: boolean) => {
    store.setState(state => ({ ...state, isLoading }))
  },

  // Settings actions
  updateSettings: (settings: Partial<Settings>) => {
    store.setState(state => ({
      ...state,
      settings: { ...state.settings, ...settings }
    }))
  }
}

// Selectors
export const selectors = {
  getCurrentConversation: (state: State) => 
    state.conversations.find(c => c.id === state.currentConversationId),
  getConversations: (state: State) => state.conversations,
  getCurrentConversationId: (state: State) => state.currentConversationId,
  getIsLoading: (state: State) => state.isLoading,
  getSettings: (state: State) => state.settings
} 