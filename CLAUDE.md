# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a modern AI-powered chat application built with React 19, TanStack Start, and Venice.ai. It's optimized for Netlify deployment and demonstrates advanced patterns in streaming AI responses, state management, and SSR with support for multiple AI models.

## Development Commands

### Essential Commands
```bash
# Development (recommended - includes Netlify environment)
netlify dev

# Standard development server
npm run dev

# Production build
npm run build

# Preview production build
npm run serve
```

## Architecture Overview

### Hybrid State Management Pattern
The application uses a sophisticated dual-layer approach:
1. **TanStack Store** provides immediate UI reactivity for local state
2. **Convex database** handles persistent storage with graceful fallback
3. All state updates are optimistic - UI updates immediately, then syncs with database

### AI Integration Flow
1. User input captured in `ChatInput` component
2. Message immediately added to local store (optimistic update)
3. Server function `genAIResponse` handles streaming response
4. Venice.ai API called server-side (key never exposed to client)
5. SSE streaming response chunks update UI in real-time
6. Complete message saved to Convex database if available

### Key Architectural Decisions

#### Server Functions Pattern
All API interactions use TanStack Start's `createServerFn` pattern:
- Located in `app/functions/` directory
- Provides type-safe RPC between client and server
- Handles streaming responses efficiently
- Keeps sensitive API keys server-side only

#### Component Structure
Components in `app/components/` follow single-responsibility principle:
- `ChatMessage` - Renders individual messages with Markdown support
- `ChatInput` - Handles user input with auto-resize and keyboard shortcuts
- `Sidebar` - Manages conversation list and navigation
- `SettingsDialog` - Controls application preferences
- All components exported through centralized `index.ts`

#### State Management
Primary state in `app/store/appStore.ts`:
- Conversations array with messages
- Current conversation tracking
- Settings (theme, model selection)
- Sidebar visibility state

Custom hooks abstract complex state logic:
- `useAppState` - Main application state
- `useConversations` - Conversation management with Convex sync

## Critical Implementation Details

### Environment Variables
Required for deployment:
- `VENICE_API_KEY` - Venice.ai API key (server-side only)
- `VITE_CONVEX_URL` - Optional for persistent storage

### Streaming Response Handling
The `genAIResponse` server function implements proper streaming:
1. Returns `ReadableStream` with SSE (Server-Sent Events) format
2. Handles errors gracefully with specific error types
3. Supports conversation context in API calls
4. Supports model selection and web search features
5. OpenAI-compatible streaming format

### Database Schema (Convex)
Simple schema in `convex/schema.ts`:
- `conversations` table with `title` and `messages` fields
- Messages include `role` (user/assistant) and `content`
- Automatic timestamps via Convex

### Routing Structure
File-based routing with TanStack Router:
- `app/routes/__root.tsx` - Root layout with providers
- `app/routes/index.tsx` - Main chat interface
- Automatic code splitting per route

## Development Workflow

### Making UI Changes
1. Components are in `app/components/`
2. Tailwind CSS 4 for styling (configured in `app.css`)
3. Use existing color scheme variables from CSS custom properties

### Adding New Features
1. Update store in `app/store/appStore.ts` if state needed
2. Create server function in `app/functions/` for API interactions
3. Add UI components following existing patterns
4. Ensure optimistic updates for better UX

### Modifying AI Behavior
1. System prompt in `src/utils/ai.ts`
2. Model selection configurable via settings (Llama, GPT-4, Claude, etc.)
3. Web search toggle for up-to-date information
4. Venice-specific parameters in API calls

## Performance Considerations
- Components use React.memo where beneficial
- Virtual DOM updates minimized through TanStack Store
- Code splitting automatic via TanStack Router
- SSR provides fast initial page loads
- Streaming responses prevent UI blocking