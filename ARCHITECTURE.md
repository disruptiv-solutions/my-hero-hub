# Hero Hub - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          HERO HUB DASHBOARD                              │
│                      (Next.js 14 + TypeScript)                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────────┐ ┌──────────┐ ┌──────────────────┐
        │   LEFT SIDEBAR   │ │  CENTER  │ │  RIGHT SIDEBAR   │
        │  "Now Panel"     │ │  PANEL   │ │ "Awareness Panel"│
        │     (20%)        │ │  (55%)   │ │      (25%)       │
        └──────────────────┘ └──────────┘ └──────────────────┘
```

## Component Hierarchy

```
App (layout.tsx)
│
├── SessionProvider (NextAuth)
│   └── QueryProvider (React Query)
│       └── Dashboard Page
│           │
│           ├── Header
│           │   ├── Logo
│           │   └── User Profile
│           │
│           ├── LeftSidebar
│           │   ├── Clock Widget
│           │   ├── Meetings Widget
│           │   ├── Email Status Widget
│           │   └── AI Search Input
│           │
│           ├── CenterPanel
│           │   └── Tabs
│           │       ├── CalendarView
│           │       ├── EmailView
│           │       ├── ClientsView
│           │       ├── FinancialView
│           │       └── MarketingView
│           │
│           └── RightSidebar
│               ├── Quick Stats (4 cards)
│               ├── Task List
│               └── Activity Feed
│
└── Toaster (Global notifications)
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    React Components                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │ LeftSidebar  │  │ CenterPanel  │  │ RightSidebar │     │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │   │
│  │          │                 │                  │             │   │
│  │          └─────────────────┼──────────────────┘             │   │
│  │                            │                                │   │
│  │                    ┌───────▼────────┐                       │   │
│  │                    │  React Query   │                       │   │
│  │                    │  Cache Layer   │                       │   │
│  │                    └───────┬────────┘                       │   │
│  └────────────────────────────┼───────────────────────────────┘   │
└────────────────────────────────┼───────────────────────────────────┘
                                 │ fetch()
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS SERVER (App Router)                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                      API Routes                                │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │ │
│  │  │   Auth   │ │ Calendar │ │  Gmail   │ │ Clients  │  ...   │ │
│  │  └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘        │ │
│  │        │             │            │            │              │ │
│  │        │    ┌────────▼────────────▼────────────▼───┐         │ │
│  │        │    │   Authentication Check (NextAuth)   │         │ │
│  │        │    └────────┬─────────────────────────────┘         │ │
│  └────────┼─────────────┼──────────────────────────────────────┘ │
└───────────┼─────────────┼────────────────────────────────────────┘
            │             │
            ▼             ▼
  ┌──────────────┐  ┌──────────────────┐
  │   NextAuth   │  │   Google APIs    │
  │    OAuth     │  │  Calendar, Gmail │
  └──────────────┘  └──────────────────┘
            │             │
            └──────┬──────┘
                   ▼
         ┌──────────────────┐
         │  Google Services  │
         │  (Cloud Platform) │
         └──────────────────┘
```

## Request Flow

```
1. User Opens Dashboard
   │
   ├─> Check Authentication (NextAuth)
   │   ├─> Not Authenticated → Redirect to /auth/signin
   │   └─> Authenticated → Load Dashboard
   │
2. Dashboard Mounts
   │
   ├─> React Query initiates data fetching
   │   │
   │   ├─> /api/calendar/events
   │   │   └─> Google Calendar API → Events
   │   │
   │   ├─> /api/gmail/messages
   │   │   └─> Gmail API → Inbox
   │   │
   │   ├─> /api/gmail/unread
   │   │   └─> Gmail API → Count
   │   │
   │   ├─> /api/clients
   │   │   └─> Mock Database → Clients
   │   │
   │   ├─> /api/finances
   │   │   └─> Mock Database → Metrics
   │   │
   │   └─> /api/marketing
   │       └─> Mock Database → Campaigns
   │
3. Data Cached
   │
   └─> Components Render with Data
   
4. Auto-Refresh Cycle (2-5 minutes)
   │
   └─> React Query re-fetches → Update Cache → Re-render
```

## Authentication Flow

```
┌──────────────┐
│     User     │
└──────┬───────┘
       │ Clicks "Sign in with Google"
       ▼
┌─────────────────────────────┐
│  /auth/signin               │
│  Sign-in Page               │
└──────┬──────────────────────┘
       │ Redirects to NextAuth
       ▼
┌─────────────────────────────┐
│  /api/auth/signin/google    │
│  NextAuth Handler           │
└──────┬──────────────────────┘
       │ Redirects to Google
       ▼
┌─────────────────────────────┐
│  Google OAuth Server        │
│  (accounts.google.com)      │
└──────┬──────────────────────┘
       │ User grants permissions
       ▼
┌─────────────────────────────┐
│  /api/auth/callback/google  │
│  NextAuth Callback          │
├─────────────────────────────┤
│  - Receives auth code       │
│  - Exchanges for tokens     │
│  - Creates session          │
│  - Stores refresh token     │
└──────┬──────────────────────┘
       │ Redirects to dashboard
       ▼
┌─────────────────────────────┐
│  /dashboard                 │
│  Authenticated Dashboard    │
└─────────────────────────────┘
```

## State Management

```
┌────────────────────────────────────────────────────────────┐
│                     STATE LAYERS                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────┐          │
│  │         React Query (Server State)          │          │
│  │  - Calendar events                          │          │
│  │  - Emails                                   │          │
│  │  - Clients                                  │          │
│  │  - Financial data                           │          │
│  │  - Marketing metrics                        │          │
│  │  - Auto-refresh intervals                   │          │
│  │  - Cache management                         │          │
│  └────────────────────────────────────────────┘          │
│                       │                                    │
│  ┌────────────────────────────────────────────┐          │
│  │          Zustand (Client State)             │          │
│  │  - Tasks list                               │          │
│  │  - Activity feed                            │          │
│  │  - Selected calendar IDs                    │          │
│  │  - UI preferences                           │          │
│  └────────────────────────────────────────────┘          │
│                       │                                    │
│  ┌────────────────────────────────────────────┐          │
│  │      NextAuth (Auth Session State)          │          │
│  │  - User profile                             │          │
│  │  - Access token                             │          │
│  │  - Refresh token                            │          │
│  │  - Session expiry                           │          │
│  └────────────────────────────────────────────┘          │
│                       │                                    │
│  ┌────────────────────────────────────────────┐          │
│  │        React (Local Component State)        │          │
│  │  - Form inputs                              │          │
│  │  - Modal visibility                         │          │
│  │  - Loading states                           │          │
│  │  - Selected items                           │          │
│  └────────────────────────────────────────────┘          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## API Route Structure

```
src/app/api/
│
├── auth/
│   └── [...nextauth]/
│       └── route.ts              # NextAuth configuration
│                                 # - Google OAuth provider
│                                 # - Token refresh logic
│                                 # - Session callbacks
│
├── calendar/
│   └── events/
│       └── route.ts              # GET /api/calendar/events
│                                 # - Fetch from Google Calendar API
│                                 # - Merge multiple calendars
│                                 # - Sort by date
│
├── gmail/
│   ├── messages/
│   │   └── route.ts              # GET /api/gmail/messages
│   │                             # - Fetch inbox messages
│   │                             # - Parse email headers
│   │                             # - Format response
│   │
│   └── unread/
│       └── route.ts              # GET /api/gmail/unread
│                                 # - Get unread count
│                                 # - Return account info
│
├── clients/
│   └── route.ts                  # GET    /api/clients (list)
│                                 # POST   /api/clients (create)
│                                 # PUT    /api/clients (update)
│                                 # DELETE /api/clients (delete)
│
├── finances/
│   └── route.ts                  # GET /api/finances
│                                 # - Calculate metrics
│                                 # - Return transactions
│
├── marketing/
│   └── route.ts                  # GET /api/marketing
│                                 # - Aggregate campaigns
│                                 # - Calculate totals
│
└── ai/
    └── query/
        └── route.ts              # POST /api/ai/query
                                  # - Process natural language
                                  # - Return suggestions
```

## Database Schema (Future - Currently Mock Data)

```sql
┌─────────────────────────────────────────────┐
│              CLIENTS TABLE                  │
├─────────────────────────────────────────────┤
│ id            UUID PRIMARY KEY              │
│ user_id       TEXT NOT NULL                 │
│ name          TEXT NOT NULL                 │
│ email         TEXT NOT NULL                 │
│ phone         TEXT                          │
│ status        ENUM(lead, active, closed)    │
│ value         DECIMAL(10,2)                 │
│ last_contact  TIMESTAMP                     │
│ created_date  TIMESTAMP DEFAULT NOW()       │
│ notes         TEXT                          │
│ project_count INTEGER DEFAULT 0             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│            TRANSACTIONS TABLE                │
├─────────────────────────────────────────────┤
│ id           UUID PRIMARY KEY               │
│ user_id      TEXT NOT NULL                  │
│ client_id    UUID REFERENCES clients(id)    │
│ amount       DECIMAL(10,2) NOT NULL         │
│ date         TIMESTAMP NOT NULL             │
│ type         ENUM(income, expense)          │
│ status       ENUM(pending, completed, ...)  │
│ description  TEXT NOT NULL                  │
│ category     TEXT                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        MARKETING_CAMPAIGNS TABLE             │
├─────────────────────────────────────────────┤
│ id           UUID PRIMARY KEY               │
│ user_id      TEXT NOT NULL                  │
│ name         TEXT NOT NULL                  │
│ platform     TEXT NOT NULL                  │
│ status       ENUM(active, paused, ...)      │
│ spend        DECIMAL(10,2)                  │
│ impressions  INTEGER                        │
│ clicks       INTEGER                        │
│ conversions  INTEGER                        │
│ start_date   TIMESTAMP                      │
│ end_date     TIMESTAMP                      │
└─────────────────────────────────────────────┘
```

## Technology Stack Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  - React Components                                         │
│  - Tailwind CSS                                             │
│  - Radix UI (primitives)                                    │
│  - Lucide Icons                                             │
│  - Recharts (visualization)                                 │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                        LOGIC LAYER                           │
│  - React Hooks (custom)                                     │
│  - React Query (data fetching)                              │
│  - Zustand (state management)                               │
│  - date-fns (utilities)                                     │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  - Next.js 14 (App Router)                                  │
│  - TypeScript                                               │
│  - NextAuth.js                                              │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  - Google Calendar API                                      │
│  - Gmail API                                                │
│  - Mock Database (in-memory)                                │
│  - [Future: PostgreSQL/Supabase]                           │
└─────────────────────────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────┐
│                    USER REQUEST                      │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │  HTTPS Only      │
            │  (Production)    │
            └────────┬─────────┘
                      │
                      ▼
            ┌──────────────────┐
            │  NextAuth Check  │
            │  - Session valid?│
            │  - Token fresh?  │
            └────────┬─────────┘
                      │
             ┌────────┴────────┐
             │ NO              │ YES
             ▼                 ▼
    ┌─────────────┐   ┌─────────────┐
    │ 401 Error   │   │ Proceed     │
    │ Unauthorized│   │ to API      │
    └─────────────┘   └──────┬──────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │ Token Validation │
                   │ - Not expired?   │
                   │ - Refresh if old │
                   └────────┬─────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Google API Call  │
                   │ with OAuth token │
                   └────────┬─────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Return Data      │
                   │ (sanitized)      │
                   └──────────────────┘
```

## Deployment Architecture

```
┌───────────────────────────────────────────────────────┐
│                    VERCEL CLOUD                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │              Edge Network (CDN)                  │ │
│  │  - Static assets                                 │ │
│  │  - Next.js pages                                 │ │
│  └────────────────┬────────────────────────────────┘ │
│                   │                                   │
│  ┌────────────────▼────────────────────────────────┐ │
│  │           Serverless Functions                   │ │
│  │  - API routes                                    │ │
│  │  - Auto-scaling                                  │ │
│  │  - Environment variables                         │ │
│  └────────────────┬────────────────────────────────┘ │
└───────────────────┼───────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  Google  │ │ Database │ │   CDN    │
  │   APIs   │ │(Optional)│ │  Assets  │
  └──────────┘ └──────────┘ └──────────┘
```

## Performance Optimization Strategy

```
1. Initial Load
   ├─> Server-Side Rendering (SSR)
   ├─> Code Splitting
   └─> Critical CSS Inline

2. Data Fetching
   ├─> React Query Caching
   ├─> Stale-While-Revalidate
   └─> Parallel Requests

3. Re-renders
   ├─> React.memo
   ├─> useMemo/useCallback
   └─> Component Composition

4. Assets
   ├─> Image Optimization
   ├─> Font Optimization
   └─> Tree Shaking

5. Runtime
   ├─> Virtual Scrolling (if needed)
   ├─> Debounced Inputs
   └─> Lazy Loading
```

---

This architecture is designed for:
✅ Scalability
✅ Maintainability
✅ Performance
✅ Security
✅ Developer Experience

For implementation details, see the source code and QUICK_REFERENCE.md


