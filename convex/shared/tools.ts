import { tool } from "ai";
import { z } from "zod";
import { createTool } from "@convex-dev/agent";

// Simulated deals data based on provided documents for preview/simulation purposes
export const simulatedDeals: Record<string, any> = {
  "1": {
    fullName: "Jane Doe",
    address: "123 Oak Street, Rivertown, CA 90210",
    insurance: "Geico G09876543 effective 3/15/24 expiring 3/15/25",
    vehicle: "5XYZWDLB8JG512345 2023 Hyundai Santa Fe Limited Black 1,500 Miles",
    trade: "1GNSKBE0XBR123456 Chevrolet Tahoe LT 30,000 miles White",
    salePrice: 38000,
    rebate: 1500,
    dealerFees: 1100,
    tradeValue: 28000,
    tradePayoff: 25000,
    taxRate: 0.085,
    ssn: "123456789",
    creditScore: 780,
    timeAtAddress: "5 yrs, Rent, $2000 per month",
    employment: "Full-time, 6 years at XYZ Corporation, Senior Accountant",
    monthlyIncome: 6000,
    expectation: "payment below $700",
    tagTitleCost: 125,
    isFinance: true,
  },
  "2": {
    fullName: "John Smith",
    address: "789 Pine Street, Sunnyside, TX 75001",
    insurance: "Allstate A11223344 effective 2/20/24 expiring 2/20/25",
    vehicle: "2G1FC3D36D9165432 2023 Chevrolet Camaro SS Red 800 Miles",
    trade: "1GNSCBKC7JR123456 Chevrolet Suburban Premier 25,000 miles Silver",
    salePrice: 42000,
    rebate: 2500,
    dealerFees: 1100,
    tradeValue: 32000,
    tradePayoff: 28000,
    taxRate: 0.07,
    ssn: "987654321",
    creditScore: 805,
    timeAtAddress: "3 yrs, Rent, $1800 per month",
    employment: "Full-time, 8 years at ABC Industries, Marketing Manager",
    monthlyIncome: 8000,
    expectation: "payment below $800",
    tagTitleCost: 125,
    isFinance: true,
  },
  "3": {
    fullName: "Max Johnson",
    address: "456 Birch Lane, Mountain View, CO 80301",
    insurance: "Progressive P99887766 effective 5/10/24 expiring 5/10/25",
    vehicle: "1C4RJFAG5LC123456 2023 Jeep Grand Cherokee Limited White 1,200 Miles",
    trade: "1GYS4JKJ4FR123456 Cadillac Escalade Luxury 20,000 miles Black",
    salePrice: 48000,
    rebate: 1800,
    dealerFees: 1100,
    tradeValue: 40000,
    tradePayoff: 35000,
    taxRate: 0.065,
    ssn: "567891234",
    creditScore: 815,
    timeAtAddress: "7 yrs, Own, Mortgage $2500 per month",
    employment: "Retired",
    monthlyIncome: 7000,
    expectation: "payment below $900",
    tagTitleCost: 125,
    isFinance: true,
  },
  "207": {
    fullName: "Test Te Tester",
    address: "555 Maple St Honeycomb FL 37756",
    insurance: "State Farm F10923335 effective 4/09/24 expiring 4/09/25",
    vehicle: "1FTFW1ED7LKE28463 2023 Ford F150 Lariat Blue 193 Miles",
    trade: "1FTEW1EP1KK123456 Ford F150 XLT 18,350 miles Green",
    salePrice: 69500,
    rebate: 2000,
    dealerFees: 1100,
    tradeValue: 42500,
    tradePayoff: 35000,
    taxRate: 0.06,
    ssn: "888553322",
    creditScore: 832,
    timeAtAddress: "10 yrs, Own, $1500 per month",
    employment: "Retired",
    monthlyIncome: 7500,
    expectation: "payment below $1000",
    tagTitleCost: 125,
    isFinance: true,
  },
  "107": {
    fullName: "Jane Louise Smith",
    address: "456 Oak Street, Smalltown, FL 33876 USA",
    insurance: "XYZ Insurance Policy 987654321 Effective Date: 2022-07-01 Expiration Date: 2023-07-01",
    vehicle: "5XYPGDA50MG123456 White SX trim with 34,500 miles",
    trade: "2FMPK3G97GB123456 Ford Edge SEL Magnetic Metallic 103,487 miles",
    salePrice: 17500,
    rebate: 0,
    dealerFees: 1100,
    tradeValue: 5000,
    tradePayoff: 6327.34,
    taxRate: 0.06,
    tagTitleCost: 125,
    otdExpectation: 20975.84,
    isFinance: false, // Cash deal based on OTD expectation and lack of income/ssn
  },
};

// Tool to retrieve deal info
export const getDealInfoTool = createTool({
  description: "Retrieve simulated deal information from the DMS-like system.",
  args: z.object({
    dealNumber: z.string().describe("The deal number to retrieve."),
  }),
  handler: async (ctx, args): Promise<string> => {
    const deal = simulatedDeals[args.dealNumber];
    if (!deal) {
      return JSON.stringify({ error: "Deal not found" });
    }
    return JSON.stringify(deal);
  },
});

// Tool to update deal info
export const updateDealInfoTool = createTool({
  description: "Update simulated deal information.",
  args: z.object({
    dealNumber: z.string().describe("The deal number to update."),
    updates: z.record(z.any()).describe("Key-value pairs to update in the deal."),
  }),
  handler: async (ctx, args): Promise<string> => {
    if (!simulatedDeals[args.dealNumber]) {
      return "Deal not found";
    }
    simulatedDeals[args.dealNumber] = { ...simulatedDeals[args.dealNumber], ...args.updates };
    return "Deal updated successfully";
  },
});

// Tool for financial calculations (e.g., monthly payments using standard loan formula)
export const calculatePaymentTool = createTool({
  description: "Calculate monthly loan payment based on amount, rate, and terms.",
  args: z.object({
    principal: z.number().describe("The loan principal amount."),
    annualRate: z.number().describe("Annual interest rate as percentage."),
    termsInMonths: z.number().describe("Loan terms in months."),
  }),
  handler: async (ctx, args): Promise<string> => {
    const monthlyRate = args.annualRate / 12 / 100;
    const payment = args.principal * (monthlyRate * Math.pow(1 + monthlyRate, args.termsInMonths)) / (Math.pow(1 + monthlyRate, args.termsInMonths) - 1);
    return payment.toFixed(2);
  },
});

// Tool for calculating total financed amount, taxes, etc., based on deal logic
export const calculateFinancedAmountTool = createTool({
  description: "Calculate the total financed amount including taxes, fees, and aftermarket add-ons. Tax is on (sale - rebate - tradeValue + dealerFees + aftermarket).",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    aftermarketCost: z.number().optional().default(0).describe("Additional cost for aftermarket products."),
  }),
  handler: async (ctx, args): Promise<string> => {
    const deal = simulatedDeals[args.dealNumber];
    if (!deal) {
      return JSON.stringify({ error: "Deal not found" });
    }
    const taxableAmount = deal.salePrice - (deal.rebate || 0) - (deal.tradeValue || 0) + deal.dealerFees + args.aftermarketCost;
    const tax = taxableAmount * deal.taxRate;
    const totalFinanced = deal.salePrice - (deal.rebate || 0) + deal.dealerFees + tax + (deal.tagTitleCost || 125) + args.aftermarketCost + (deal.tradePayoff || 0) - (deal.tradeValue || 0);
    return JSON.stringify({ totalFinanced, tax });
  },
});

// Tool for simulating bank program info
export const getBankProgramsTool = tool({
  description: "Get current bank financing programs (simulated rates as low as).",
  parameters: z.object({}),
  execute: async () => ({
    programs: [
      { bank: "Bank A", rate: "as low as 4.99% with approved credit", terms: "up to 72 months" },
      { bank: "Bank B", rate: "as low as 5.49% with approved credit", terms: "up to 84 months" },
      { bank: "Manufacturer Finance", rate: "as low as 3.99% with approved credit", terms: "up to 60 months" },
    ],
  }),
});

// Generate documents
export const generateDocumentsTool = createTool({
  description: "Generate required documents for a deal (DMV, cash, or finance).",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    isFinance: z.boolean().describe("Whether the deal is financed."),
    aftermarketOption: z.string().optional().describe("Selected aftermarket option (e.g., Option 1, Option 2, Option 3, none)."),
  }),
  handler: async (ctx, args): Promise<string> => {
    const deal = simulatedDeals[args.dealNumber];
    if (!deal) {
      return JSON.stringify({ error: "Deal not found" });
    }
    const dmvDocs = [
      "Odometer Statement",
      "Secure Power of Attorney",
      "Title Reassignment",
      "Power of Attorney",
      "Statement of Tag Intent",
      "Pollution Statement",
      "Insurance Declaration",
      "Bill of Sale",
    ];
    const cashDocs = ["Buyers Order", "Dealer Privacy Notice"].concat(args.aftermarketOption ? ["Aftermarket Contract"] : []);
    const financeDocs = ["Credit Application", "Risk Based Pricing Notice", "OFAC/ID", "Carfax"].concat(args.aftermarketOption ? ["Aftermarket Contract"] : []);
    const docs = args.isFinance ? [...dmvDocs, ...cashDocs, ...financeDocs] : [...dmvDocs, ...cashDocs];
    return JSON.stringify({ documents: docs });
  },
});

// Simulate electronic signature
export const simulateSignatureTool = createTool({
  description: "Simulate applying an electronic signature to documents.",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    customerName: z.string().describe("Customer name for signature."),
    documentType: z.string().describe("Type of document (e.g., DMV, Buyers Order, Finance, Aftermarket)."),
  }),
  handler: async (ctx, args): Promise<string> => {
    return `Electronic signature for ${args.customerName} applied to ${args.documentType} for deal ${args.dealNumber}.`;
  },
});