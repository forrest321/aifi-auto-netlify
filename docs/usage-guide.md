# AI-Fi System Usage Guide

## Getting Started

The AI-Fi system provides an intelligent automotive finance management interface that replaces traditional Finance Managers with specialized AI agents.

## User Interfaces

### Initial Entry
1. **Open the application** at the deployed URL or localhost during development
2. **Select user type**:
   - **"Dealer"** - For dealership staff managing deals
   - **"Customer"** - For customers completing transactions

## Dealer Workflow

### Deal Verification Process
1. **Enter Deal Number** - Input the deal ID from your DMS
2. **Review Completeness** - Agent will check all required information
3. **Complete Missing Data** - Provide any missing required fields:
   - Customer information (name, address, insurance)
   - Vehicle details (year, make, model, VIN)
   - Financial details (sale price, trade info, rebates)
   - For finance: SSN, employment, income details
   - For cash: Out-the-door price expectations
4. **Verify Details** - Review displayed information for accuracy
5. **Confirm or Correct** - Use "Yes" to proceed or provide corrections
6. **Customer Handoff** - Return device to customer once verified

### Required Information by Deal Type

#### Finance Deals Must Include:
- Full customer name and complete address
- Insurance information and policy details
- Vehicle information (year, make, model, VIN)
- Trade vehicle details (if applicable)
- Sale price, rebates, dealer fees ($1,100 standard)
- Trade value and payoff amounts
- Tax rate and tag/title costs ($125 standard)
- Customer SSN for credit application
- Employment history and current job
- Monthly income verification
- Customer payment expectations

#### Cash Deals Must Include:
- All finance requirements EXCEPT:
  - No SSN required
  - No employment/income information needed
- PLUS: Customer's out-the-door price expectation

## Customer Workflows

### General Information Path
**For customers NOT in the system or seeking general info**

1. **Initial Prompt** - Provide name or indicate general information request
2. **System Check** - Agent verifies if you have an active deal
3. **Information Options**:
   - **Bank Programs** - Current financing rates and terms
   - **Payment Estimation** - Calculate approximate monthly payments
4. **Bank Programs Display**:
   - Shows current "as low as" rates with approved credit
   - Multiple lender options with varying terms
5. **Payment Estimation** (if requested):
   - **Disclaimer Agreement** - Confirm understanding this is not a quote
   - **Information Method**:
     - "I know my financed amount" - Direct payment calculation
     - "I know the sale price" - Calculate with standard fees and taxes
   - **Results** - Payments shown for 60 and 72-month terms
6. **Encouragement** - Agent promotes working with dealer for actual quotes

### Transaction Completion Path
**For customers WITH a deal in the system**

#### Security Verification
1. **SMS Code Entry** - 4-digit code "sent" to phone on file
   - **Demo Code**: 1234 (for testing)
   - **One Retry** allowed if incorrect
   - **Dealer Referral** if verification fails twice

#### Document Workflow
2. **DMV Documents** - Sign required DMV paperwork:
   - Odometer Statement, Power of Attorney documents
   - Title Reassignment, Statement of Tag Intent
   - Pollution Statement, Insurance Declaration
   - Bill of Sale and other required forms
3. **Electronic Signature** - Provide name for document signing
4. **Progress Update** - Confirmation of document completion

#### Finance Processing (Finance Deals Only)
5. **Lender Response** - Notification of favorable lender responses
6. **Package Preparation** - Information about financing packages being prepared

#### Aftermarket Options
7. **Long-term Ownership Discussion** - Agent explains maintenance and repair costs
8. **Three-Tier Options**:
   - **Premium Package** ($3,000): Warranty + Maintenance + GAP Insurance
   - **Standard Package** ($2,000): Warranty + GAP Insurance  
   - **Basic Package** ($1,000): Warranty Only
9. **Tailored Recommendations** - Options based on your vehicle type
10. **Selection Process**:
    - Choose desired option or decline
    - **Objection Handling** - Agent explains benefits if declined
    - **Alternative Offers** - May suggest Basic if Premium/Standard declined
    - **Upsell Opportunities** - $100 coupon offers for upgrades

#### Final Review and Completion
11. **Calculation Summary**:
    - Vehicle details and pricing
    - Tax and fee breakdown
    - Selected aftermarket option cost
    - **Total financed amount** (bold)
    - **Monthly payment** (bold)
12. **Final Agreement**:
    - Review all terms carefully
    - Select "Yes I agree" or "I want to change something"
    - Return to aftermarket selection if changes needed
13. **Final Documents**:
    - Buyers Order generation and signing
    - Finance contract (if financed)
    - Aftermarket contract (if selected)
14. **Down Payment** - Dealer confirmation of payment collection
15. **Completion** - Final confirmation with document delivery information

### Cash Deal Differences
- Same workflow but uses out-the-door pricing
- Aftermarket options presented before final documents
- No financing paperwork required
- Simplified document set

## Testing and Demo Features

### Test Deal Numbers
- **Deal 1**: Jane Doe - 2023 Hyundai Santa Fe (finance scenario)
- **Deal 2**: John Smith - 2023 Chevrolet Camaro SS (cash scenario)
- **Deal 207**: Test Te Tester - 2023 Ford F150 Lariat (comprehensive test)

### Demo Configuration
- **Security Code**: Always use 1234 for verification
- **Bank Programs**: Three simulated lenders with competitive rates
- **Aftermarket**: Industry-realistic options and pricing
- **Calculations**: Based on actual automotive finance formulas

## Tips for Optimal Use

### For Dealers
- Ensure all required information is entered before customer handoff
- Double-check vehicle VIN and customer details for accuracy
- Have trade documentation ready if applicable
- Verify customer contact information for SMS delivery

### For Customers
- Have insurance information readily available
- Know your approximate credit score for better rate estimates
- Consider long-term ownership costs when reviewing aftermarket options
- Ask questions if any part of the process is unclear

### For Testing
- Use the designated test deal numbers and customer names
- Always use security code 1234 for verification
- Try both dealer verification and customer completion workflows
- Test different aftermarket option selections

## Troubleshooting

### Common Issues
- **Deal Not Found**: Verify deal number with dealer
- **Security Verification Failed**: Use demo code 1234 or contact dealer
- **Missing Information**: Return to dealer for deal completion
- **Technical Issues**: Refresh browser or restart application

### Getting Help
- Dealers: Contact system administrator or IT support
- Customers: Work with dealer representative for assistance
- Technical Issues: Check browser console for error messages

This system is designed to streamline the automotive finance process while maintaining the personal touch and expertise that customers expect from their vehicle purchase experience.