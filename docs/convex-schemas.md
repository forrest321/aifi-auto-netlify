# Convex Database Schemas

## Overview
Schemas in Convex define:
- Tables in a project
- Document types within those tables

### Key Benefits
- Ensures document type correctness
- Provides end-to-end type safety with TypeScript
- Recommended after initial prototyping

## Schema Definition Example
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    body: v.string(),
    user: v.id("users"),
  }),
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),
});
```

## Validator Types
- `v.string()`: String values
- `v.number()`: Numeric values
- `v.boolean()`: Boolean values
- `v.optional()`: Optional fields
- `v.union()`: Multiple possible types
- `v.literal()`: Constant values
- `v.record()`: Arbitrary key-value mappings
- `v.any()`: Any value type

## Schema Validation
- Automatically validated during deployment
- Checks existing and new documents
- Can be disabled with `schemaValidation: false`

## TypeScript Integration
- Generates type-safe database interactions
- Provides `Doc<TableName>` type for documents
- Enhances `query` and `mutation` type safety

## Best Practices
- Start without a schema for rapid prototyping
- Add schema once data model stabilizes
- Use TypeScript for maximum type safety