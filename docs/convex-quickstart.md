# Convex Tutorial: Chat App Quickstart

## Prerequisites
- Node.js 18+ 
- Git

## Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/get-convex/convex-tutorial.git
cd convex-tutorial
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Backend Setup

### Create Mutation Function (`convex/chat.ts`)
```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: {
    user: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      user: args.user,
      body: args.body,
    });
  },
});
```

### Create Query Function (`convex/chat.ts`)
```typescript
import { query } from "./_generated/server";

export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").order("desc").take(50);
    return messages.reverse();
  },
});
```

## Frontend Integration (`src/App.tsx`)

### Connect Mutation
```typescript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const sendMessage = useMutation(api.chat.sendMessage);
```

### Connect Query
```typescript
import { useQuery } from "convex/react";

const messages = useQuery(api.chat.getMessages);
```

## Key Concepts
- Mutations update the database transactionally
- Queries read data and support real-time updates
- Convex provides automatic frontend-backend synchronization

## Development Tools
- [Convex Dashboard](https://dashboard.convex.dev)
- Logs screen for backend debugging