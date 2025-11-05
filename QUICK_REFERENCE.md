# Hero Hub - Quick Reference

## 🚀 Quick Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3005
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Check for code issues

# Installation
npm install          # Install all dependencies
```

## 📁 Project Structure Quick Map

```
hero-hub/
├── src/app/
│   ├── api/                    # API endpoints
│   │   ├── auth/              # Authentication
│   │   ├── calendar/          # Calendar data
│   │   ├── gmail/             # Email data
│   │   ├── clients/           # Client CRUD
│   │   ├── finances/          # Financial data
│   │   ├── marketing/         # Marketing metrics
│   │   └── ai/                # AI queries
│   ├── dashboard/             # Main dashboard page
│   └── auth/signin/           # Sign-in page
├── src/components/
│   ├── dashboard/             # Dashboard components
│   │   ├── LeftSidebar.tsx   # Now Panel
│   │   ├── CenterPanel.tsx   # Workspace
│   │   ├── RightSidebar.tsx  # Awareness Panel
│   │   └── views/            # Tab content
│   ├── providers/            # React providers
│   └── ui/                   # Reusable components
├── src/lib/                  # Utilities
└── src/types/                # TypeScript types
```

## 🔧 Environment Variables

```env
# Required - Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Required - Firebase Admin SDK
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Optional
ANTHROPIC_API_KEY=           # For advanced AI queries
```

## 🎯 Common Tasks

### Add New API Route

1. Create file: `src/app/api/your-route/route.ts`
2. Template:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const user = await getFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Your logic here - use user.uid for user-specific data
  return NextResponse.json({ data: "response" });
}
```

### Add New Dashboard View

1. Create: `src/components/dashboard/views/YourView.tsx`
2. Add to `CenterPanel.tsx`:
```typescript
import YourView from "./views/YourView";

// In TabsList:
<TabsTrigger value="yourview">Your View</TabsTrigger>

// In content area:
<TabsContent value="yourview">
  <YourView />
</TabsContent>
```

### Use React Query for Data Fetching

```typescript
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/api-helpers";

const { data, isLoading, error } = useQuery({
  queryKey: ["unique-key"],
  queryFn: async () => {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/your-endpoint", { headers });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  },
  refetchInterval: 5 * 60 * 1000, // 5 minutes
});
```

### Add Global State with Zustand

In `src/lib/store.ts`:
```typescript
interface AppState {
  yourData: any[];
  setYourData: (data: any[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  yourData: [],
  setYourData: (data) => set({ yourData: data }),
}));
```

Use in component:
```typescript
const { yourData, setYourData } = useAppStore();
```

### Show Toast Notification

```typescript
import { toast } from "@/lib/hooks/use-toast";

toast({
  title: "Success!",
  description: "Your action was completed.",
});
```

## 🔍 Debugging Tips

### View API Responses
```typescript
// In browser console
fetch('/api/calendar/events')
  .then(r => r.json())
  .then(console.log);
```

### Check Authentication
```typescript
// In any component
import { useAuth } from "@/components/providers/AuthProvider";

const { user, loading } = useAuth();
console.log("User:", user);
console.log("Loading:", loading);
```

### Debug React Query
```typescript
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();
console.log("All queries:", queryClient.getQueryCache().getAll());
```

## 📊 Data Structures

### Calendar Event
```typescript
{
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  hangoutLink?: string;
  attendees?: Array<{ email: string }>;
}
```

### Email
```typescript
{
  id: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  isUnread: boolean;
  isStarred: boolean;
}
```

### Client
```typescript
{
  id: string;
  name: string;
  email: string;
  status: "lead" | "active" | "closed";
  value?: number;
  lastContact?: string;
}
```

## 🎨 Styling Quick Tips

### Color Palette
```css
/* Background */
bg-gray-900        /* Dark background */
bg-gray-800        /* Cards */
bg-gray-700        /* Hover states */

/* Text */
text-white         /* Primary text */
text-gray-400      /* Secondary text */
text-gray-500      /* Muted text */

/* Accent Colors */
text-blue-400      /* Links, primary actions */
text-green-400     /* Success, positive */
text-yellow-400    /* Warning, attention */
text-red-400       /* Errors, negative */
```

### Common Classes
```css
/* Layout */
flex items-center justify-between
grid grid-cols-3 gap-4

/* Spacing */
p-4 m-2 space-y-4 gap-6

/* Interactive */
hover:bg-gray-700 transition-colors
cursor-pointer

/* Responsive */
md:grid-cols-2 lg:grid-cols-3
```

## 🔐 Google OAuth Scopes

```typescript
// Current scopes in use (configured in firebase-auth.ts):
"https://www.googleapis.com/auth/calendar.readonly"
"https://www.googleapis.com/auth/gmail.readonly"
"https://www.googleapis.com/auth/tasks.readonly"

// To add more scopes:
// Edit: src/lib/firebase-auth.ts
// Google tokens are automatically stored in Firestore
```

## 📡 API Endpoints

```
GET  /api/calendar/events       # Calendar events
GET  /api/gmail/messages        # Email messages
GET  /api/gmail/unread          # Unread count
GET  /api/clients               # List clients
POST /api/clients               # Create client
PUT  /api/clients               # Update client
DELETE /api/clients?id=         # Delete client
GET  /api/finances              # Financial metrics
GET  /api/marketing             # Marketing data
POST /api/ai/query              # AI search
```

## 🚨 Common Errors & Solutions

### "Firebase: Error (auth/config-not-found)"
✅ Check all NEXT_PUBLIC_FIREBASE_* variables are set
✅ Restart dev server after adding environment variables

### "Failed to fetch"
✅ Ensure dev server is running
✅ Check browser console for CORS errors
✅ Verify API route exists
✅ Check that Firebase ID token is included in Authorization header

### "Unauthorized"
✅ Sign in first via `/auth/signin`
✅ Check Firebase Auth is working
✅ Verify token is being sent in request headers
✅ Refresh the page

### Build errors
```bash
# Clear and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## 📱 Refresh Intervals

| Feature | Interval | Configurable In |
|---------|----------|----------------|
| Calendar | 5 minutes | `LeftSidebar.tsx`, `CalendarView.tsx` |
| Email | 2 minutes | `LeftSidebar.tsx`, `EmailView.tsx` |
| Clients | 5 minutes | `ClientsView.tsx` |
| Finances | 5 minutes | `FinancialView.tsx`, `RightSidebar.tsx` |
| Marketing | 5 minutes | `MarketingView.tsx` |

To change:
```typescript
refetchInterval: 2 * 60 * 1000, // milliseconds
```

## 🎯 Best Practices

### API Routes
- ✅ Always check authentication
- ✅ Handle errors gracefully
- ✅ Return consistent JSON structure
- ✅ Use try-catch blocks

### Components
- ✅ Use TypeScript for type safety
- ✅ Extract reusable logic to hooks
- ✅ Keep components focused and small
- ✅ Use React Query for server state

### Performance
- ✅ Use React.memo for expensive components
- ✅ Implement proper loading states
- ✅ Optimize images (next/image)
- ✅ Lazy load heavy components

## 📚 Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [Google API Docs](https://developers.google.com/apis-explorer)

## 🆘 Getting Help

1. Check browser console for errors
2. Review API response in Network tab
3. Check server logs: `npm run dev`
4. Search issues in repository
5. Review documentation files

## 📝 Quick Notes

- Port: `3001` (to avoid conflicts)
- Dark mode: Default and always on
- TypeScript: Strict mode enabled
- Auto-save: React Query handles caching
- Session: Expires after token expiration (auto-refreshes)

---

**Pro Tip**: Bookmark this page for quick reference while developing! 🔖

