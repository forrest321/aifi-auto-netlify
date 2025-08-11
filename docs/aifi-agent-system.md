# AI-Fi Agent System Documentation

## Overview

The AI-Fi (Automotive Intelligence - Finance) system is an agent-based AI platform designed to replace traditional Finance Managers in automotive dealerships. Built with Convex agents and integrated tools, it handles complete vehicle purchase transactions for both cash and financed deals.

## Agent Architecture

### Core Agents

#### 1. mainEntryAgent
**Purpose**: Initial user routing and system entry point
- **Role**: Routes users to appropriate workflow paths
- **Tools**: None (routing only)
- **Logic**: 
  - Display AI-Fi logo and interface
  - Offer "Dealer" or "Customer" buttons
  - Transfer to appropriate specialized agent

#### 2. dealerInteractionAgent  
**Purpose**: Dealer workflow for deal verification and data entry
- **Role**: Assist dealers in entering and verifying deal information
- **Tools**: 
  - `getDealInfoTool` - Retrieve deal data from DMS
  - `updateDealInfoTool` - Update incomplete deal information
- **Logic**:
  1. Prompt for deal number
  2. Retrieve and check deal completeness
  3. Identify missing required information
  4. Guide dealer through data entry
  5. Verify final deal details before customer handoff

#### 3. customerGeneralInfoAgent
**Purpose**: Customer interactions for general information and payment estimates  
- **Role**: Handle customers not in system or seeking general information
- **Tools**:
  - `getDealInfoTool` - Check if customer has a deal in system
  - `calculatePaymentTool` - Provide payment estimates
  - `getBankProgramsTool` - Display current financing programs
- **Logic**:
  1. Check if customer has deal in system
  2. Offer bank programs and payment estimation services
  3. Provide payment calculations with disclaimers
  4. Encourage customer to work with dealer for system entry

#### 4. customerTransactionAgent
**Purpose**: Complete transactions for customers with verified deals
- **Role**: Handle full transaction completion including security and signatures
- **Tools**:
  - `getDealInfoTool` - Access deal information
  - `calculatePaymentTool` - Final payment calculations
  - `calculateFinancedAmountTool` - Total financed amount with options
  - `generateDocumentsTool` - Create required paperwork
  - `simulateSignatureTool` - Handle electronic signatures
- **Logic**:
  1. Security verification (4-digit SMS code simulation)
  2. DMV document generation and signing
  3. Hand-off to aftermarket agent
  4. Final payment calculations and review
  5. Remaining document generation and signatures
  6. Down payment collection and completion

#### 5. aftermarketOfferAgent
**Purpose**: Aftermarket product presentation and objection handling
- **Role**: Present 3-tier aftermarket options with professional sales approach
- **Tools**:
  - `getDealInfoTool` - Access vehicle and customer information
- **Options**:
  - **Premium Package**: Warranty + Maintenance + GAP ($3,000)
  - **Standard Package**: Warranty + GAP ($2,000) 
  - **Basic Package**: Warranty only ($1,000)
- **Logic**:
  1. Explain long-term ownership costs
  2. Present tailored options based on vehicle type
  3. Handle objections with benefits reinforcement
  4. Offer alternative options if customer declines
  5. Return selection to transaction agent

## Shared Tools System

### Data Management Tools

#### getDealInfoTool
```typescript
// Retrieves simulated deal information from DMS-like system
args: { dealNumber: string }
returns: JSON deal object or error
```

#### updateDealInfoTool  
```typescript
// Updates deal information with new data
args: { dealNumber: string, updates: Record<string, any> }
returns: Success/failure message
```

### Financial Calculation Tools

#### calculatePaymentTool
```typescript
// Calculate monthly loan payment
args: { principal: number, annualRate: number, termsInMonths: number }
returns: Monthly payment amount (string)
```

#### calculateFinancedAmountTool
```typescript
// Calculate total financed amount including taxes and options
args: { dealNumber: string, aftermarketCost?: number }
returns: { totalFinanced: number, tax: number }
```

### Business Process Tools

#### generateDocumentsTool
```typescript
// Generate required documents for deal completion
args: { dealNumber: string, isFinance: boolean, aftermarketOption?: string }
returns: Array of required documents
```

#### simulateSignatureTool
```typescript
// Simulate electronic signature application
args: { dealNumber: string, customerName: string, documentType: string }
returns: Signature confirmation message
```

#### getBankProgramsTool
```typescript
// Get current bank financing programs (simulated)
args: {} (no parameters)
returns: Array of bank programs with rates and terms
```

## Business Logic Implementation

### Deal Verification Requirements

#### Finance Deals
- Full name, address, insurance information
- Vehicle details (year, make, model, VIN)
- Trade information (if applicable)
- Sale price, rebates, dealer fees ($1,100)
- Trade value/payoff amounts
- Tax rate, tag/title costs ($125)
- SSN, employment history, monthly income
- Payment expectations

#### Cash Deals  
- Same as finance deals except:
- No SSN, employment, or income required
- Include out-the-door (OTD) price expectation

### Security Protocol
- 4-digit verification code sent to phone on file
- Demo code: **1234** (for testing)
- One retry allowed before directing to dealer
- Required before any transaction completion

### Payment Calculation Logic
- **Tax Calculation**: Applied to (sale price - rebate - trade value + dealer fees + aftermarket)
- **Total Financed**: Sale price - rebate + dealer fees + tax + tag/title + aftermarket + trade payoff - trade value
- **Interest Rates** (simulated):
  - Credit >800: 5%
  - Credit 700-800: 6% 
  - Credit <700: 7%

### Document Workflow

#### DMV Documents (All Deals)
- Odometer Statement, Secure Power of Attorney
- Title Reassignment, Power of Attorney
- Statement of Tag Intent, Pollution Statement
- Insurance Declaration, Bill of Sale

#### Additional Documents
- **Cash Deals**: Buyers Order, Dealer Privacy Notice
- **Finance Deals**: Credit Application, Risk Based Pricing Notice, OFAC/ID, Carfax
- **Aftermarket**: Aftermarket Contract (when applicable)

## Test Data and Scenarios

### Simulated Deals
- **Deal 1**: Jane Doe - 2023 Hyundai Santa Fe (finance scenario)
- **Deal 2**: John Smith - 2023 Chevrolet Camaro SS (cash scenario)
- **Deal 207**: Test Te Tester - 2023 Ford F150 Lariat (comprehensive test)

### Demo Configuration
- **Security Code**: 1234
- **Bank Programs**: 3 simulated lenders with competitive rates
- **Aftermarket Take Rates**: Simulated industry-standard acceptance rates
- **Document Generation**: Realistic document sets for each scenario

## Agent Integration with TanStack Start

### Frontend Integration
- Agents operate server-side via Convex runtime
- Frontend chat interface communicates with agents through Convex queries/mutations
- Real-time updates via Convex reactive queries
- Agent responses integrated into chat message stream

### State Management
- Agent conversation state managed by Convex
- Frontend state (UI, current conversation) managed by TanStack Store
- Optimistic updates for immediate UI feedback
- Automatic synchronization between frontend and agent states

## Deployment and Monitoring

### Environment Requirements
- `VENICE_API_KEY` - Required for agent LLM capabilities
- `CONVEX_DEPLOYMENT` - Convex project deployment URL
- `VITE_CONVEX_URL` - Frontend Convex connection

### Monitoring and Debugging
- All agent interactions logged in Convex dashboard
- Tool execution results available for debugging
- Agent conversation flows can be traced
- Performance metrics available through Convex analytics

## Development and Extension

### Adding New Agents
1. Create new agent file in `convex/agents/` directory following naming convention
2. Import necessary tools from `convex/shared/tools.ts`
3. Configure Venice.ai integration and appropriate tools
4. Write detailed instruction prompts for business logic
5. Add export to `convex/agents/index.ts`
6. Test with simulated data before production

### Creating New Tools
1. Add tool to `convex/shared/tools.ts` using `createTool` from @convex-dev/agent
2. Define input/output schemas with Zod
3. Implement business logic in handler function
4. Export tool for use by agents
5. Import and add to appropriate agent configurations

### Modifying Business Logic
1. Update agent instruction prompts in respective agent files
2. Modify tool implementations in `convex/shared/tools.ts` for new requirements
3. Test changes with all simulated deal scenarios
4. Verify multi-agent handoffs work correctly

### Agent File Organization
```
convex/
├── agents/
│   ├── index.ts                     # Agent exports
│   ├── mainEntryAgent.ts           # Entry point routing
│   ├── dealerInteractionAgent.ts   # Dealer workflows
│   ├── customerGeneralInfoAgent.ts # General customer info
│   ├── customerTransactionAgent.ts # Transaction completion
│   └── aftermarketOfferAgent.ts    # Aftermarket sales
├── shared/
│   └── tools.ts                    # Shared tools and data
└── venice_provider.ts              # Venice.ai integration
```

This agent-based architecture provides a scalable, maintainable foundation for automotive finance automation while maintaining the flexibility to adapt to changing business requirements.