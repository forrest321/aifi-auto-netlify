# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is AI-Fi, an automotive finance management system built with TanStack Start, Convex, Venice.ai, Clerk Auth, Upstash data, and Convex AI agents. 
The system replaces traditional Finance Managers in automotive dealerships with specialized AI agents that handle complete vehicle 
purchase transactions for both cash and financed deals. It demonstrates advanced patterns in agent-based AI systems, streaming responses, state management, and SSR.

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

### AI-Fi Agent System
The system is built around specialized Convex AI agents that handle different aspects of automotive finance:

1. **mainEntryAgent** - Entry point, routes users to Dealer or Customer paths
2. **dealerInteractionAgent** - Assists dealers in entering and verifying deal information
3. **customerGeneralInfoAgent** - Handles customers not in system, provides general information
4. **customerPaperworkAgent** - Walks the user through reading and e-signing a set of pdf based paperwork. There will be 
different sets of paperwork and the signing of these sets will be independent of one another. DMV paperwork can be completed at any time. 
Deal specific paperwork must be prepopulated with the respective data points such as price, financing terms, the current date, 
so on and containing all relevant data that are required for legally e-signing. In both cases, the system will use 
tanstack to present the user with a download of the document and a working e-sign signature pad.
5. **customerTransactionAgent** - Manages transaction completion for customers with deals
6. **aftermarketOfferAgent** - Presents 3-tier aftermarket options with objection handling

### Agent-Based Architecture Flow
1. **Entry Point**: A helpful chatbot greets the user and invites them to begin or continue the process of buying a car the way it should be, pain-free!
2. **Dealer Path**: dealerInteractionAgent verifies deal completeness, handles updates, and provides useful tools helpful to an authenticated dealer user
3. **Customer Path**: 
   - General info: customerGeneralInfoAgent for bank programs/payment estimates
   - Paperwork: 
   - Transaction: customerTransactionAgent for deal completion with security verification
4. **Aftermarket Flow**: aftermarketOfferAgent handles upselling during transaction
5. **Tools Integration**: Agents use shared tools for calculations, document generation, signatures

### Hybrid State Management Pattern
The application uses a sophisticated dual-layer approach:
1. **TanStack Store** provides immediate UI reactivity for local state
2. **Convex database** handles persistent storage with graceful fallback  
3. **Convex Agents** handle complex AI workflows with tool integration
4. All state updates are optimistic - UI updates immediately, then syncs with database

### Key Architectural Decisions

#### Convex Agent System
AI-Fi agents are organized in `convex/agents/` directory using @convex-dev/agent:
- **Specialized Tools**: Each agent has access to specific tools for their domain
- **Venice.ai Integration**: Uses venice-uncensored model for intelligent conversation handling
- **Tool Execution**: Agents can execute calculations, retrieve data, update deals
- **Multi-Step Workflows**: Agents handle complex business logic across multiple interactions

#### Agent Tools Architecture
Shared tools in `convex/shared/tools.ts` provide core functionality:
- `getDealInfoTool` - Retrieves simulated deal information from DMS-like system
- `updateDealInfoTool` - Updates deal information with new data
- `calculatePaymentTool` - Performs loan payment calculations
- `calculateFinancedAmountTool` - Calculates total financed amount including taxes
- `generateDocumentsTool` - Generates required documents (DMV, finance, aftermarket)
- `simulateSignatureTool` - Simulates electronic signature application

#### Component Structure
Components in `src/components/` follow single-responsibility principle:
- `ChatMessage` - Renders individual messages with Markdown support
- `ChatInput` - Handles user input with auto-resize and keyboard shortcuts
- `Sidebar` - Manages conversation list and navigation
- `SettingsDialog` - Controls application preferences and AI-Fi agent activation
- All components exported through centralized `index.ts`

#### State Management
Primary state in `src/store/store.ts`:
- Conversations array with messages
- Current conversation tracking  
- Settings (model selection, web search)
- System prompts (including AI-Fi agent configurations)
- Sidebar visibility state

Custom hooks abstract complex state logic:
- `useAppState` - Main application state
- `useConversations` - Conversation management with Convex sync

#### AI-Fi Business Logic
The system implements complex automotive finance workflows:
- **Deal Verification**: Ensures all required information is complete before proceeding
- **Security Protocols**: SMS verification (demo code: 1234) for customer transactions
- **Payment Calculations**: Accurate calculations including tax, fees, aftermarket options
- **Document Workflows**: Automated generation of DMV, finance, and aftermarket contracts
- **3-Tier Aftermarket**: Premium ($3000), Standard ($2000), Basic ($1000) options with objection handling

## Critical Implementation Details

### Environment Variables
Required for deployment:
- `VENICE_API_KEY` - Venice.ai API key for Convex agents (server-side only)
- `CONVEX_DEPLOYMENT` - Convex deployment URL for agent database access
- `VITE_CONVEX_URL` - Convex URL for frontend database connections

### AI Agent Execution
Convex agents handle complex multi-step workflows:
1. Agent receives user input and determines appropriate tools to use
2. Tools execute business logic (calculations, data retrieval, document generation)
3. Agent responds intelligently based on tool results and conversation context
4. Multi-agent handoffs enable specialized workflows (e.g., aftermarket offers)
5. All agent interactions are logged and can be monitored via Convex dashboard

### Database Schema (Convex)
Schema in `convex/schema.ts` supports chat application:
- `conversations` table with `title` and `messages` fields
- Messages include `role` (user/assistant) and `content`
- Agent execution handled by Convex runtime (no additional schema required)

### AI-Fi Test Data
Simulated deals for testing the agent system:
- **Deal 1**: Jane Doe - 2023 Hyundai Santa Fe (finance scenario)
- **Deal 2**: John Smith - 2023 Chevrolet Camaro SS (cash scenario) 
- **Deal 207**: Test Te Tester - 2023 Ford F150 Lariat (comprehensive test data)

### Routing Structure
File-based routing with TanStack Router:
- `src/routes/__root.tsx` - Root layout with providers
- `src/routes/index.tsx` - Main chat interface with AI-Fi agent integration
- Automatic code splitting per route

## Development Workflow

### Making UI Changes
1. Components are in `src/components/`
2. Tailwind CSS 4 for styling (configured in `src/styles.css`)
3. Use existing color scheme variables from CSS custom properties

### Adding New AI-Fi Features
1. Create or modify agents in `convex/agents/` directory to add new capabilities
2. Create new tools using `createTool` from @convex-dev/agent
3. Update agent instructions to include new business logic
4. Test with simulated deal data before deployment

### Modifying Agent Behavior
1. Agent instructions are defined in each agent's respective file in `convex/agents/`
2. Tools can be added/modified to change agent capabilities
3. Business logic flows are controlled by agent instruction prompts
4. Test changes using simulated deals (1, 2, 207) and demo security code (1234)

### Adding New Deal Scenarios
1. Extend `simulatedDeals` object in `convex/shared/tools.ts`
2. Include all required fields for finance vs cash deals
3. Update agent instructions if new deal types require different handling
4. Test new scenarios through dealer and customer workflows

## Performance Considerations
- Components use React.memo where beneficial
- Virtual DOM updates minimized through TanStack Store
- Code splitting automatic via TanStack Router
- SSR provides fast initial page loads
- Streaming responses prevent UI blocking
- Convex agents execute server-side for optimal performance
- Agent tools cache results where appropriate
- Multi-step agent workflows are optimized for minimal round trips

## AI-Fi System Usage

### For Dealers
1. Select "Dealer" in the chat interface
2. Enter deal number when prompted
3. Agent verifies deal completeness against requirements
4. Update missing information when prompted
5. Verify final deal details before customer handoff

### For Customers
1. Select "Customer" in the chat interface  
2. **General Info Path**: Get bank programs and payment estimates
3. **Transaction Path**: Complete deal with security verification
4. Follow prompts for aftermarket options and document signing
5. Review final terms before agreement

### Testing the System
- Use simulated deal numbers: 1, 2, 207
- Customer names: Jane Doe, John Smith, Test Te Tester
- Security verification code: 1234
- Test both dealer verification and customer completion workflows