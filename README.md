# Hero Hub - Business Command Center

A persistent dashboard application for always-on display that aggregates calendar, email, client data, and business metrics with AI-powered query capabilities.

## Features

### 🎯 Core Features

- **3-Column Dashboard Layout**
  - Left Sidebar (20%): The Now Panel - Current time, upcoming meetings, email status, AI query
  - Center Panel (55%): The Workspace - Tabbed views for Calendar, Email, Clients, Financial, and Marketing
  - Right Sidebar (25%): The Awareness Panel - Quick stats, priorities, and activity feed

- **Google Workspace Integration**
  - Google Calendar with real-time event updates
  - Gmail inbox with unread counts and email preview
  - OAuth 2.0 authentication with automatic token refresh

- **Client Management**
  - CRUD operations for clients
  - Status tracking (lead, active, closed)
  - Project and interaction history

- **Financial Dashboard**
  - Revenue tracking (daily, weekly, monthly)
  - Transaction history
  - Pipeline value monitoring
  - Visual charts and analytics

- **Marketing Metrics**
  - Campaign performance tracking
  - Traffic source analysis
  - Conversion rate monitoring
  - Multi-platform support (Google Ads, Meta, LinkedIn)

- **AI Assistant**
  - Natural language query interface
  - Search across emails, calendar, clients, and financial data
  - Contextual suggestions

- **Auto-Refresh**
  - Calendar: Every 5 minutes
  - Email: Every 2 minutes
  - Real-time updates using React Query

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Charts**: Recharts
- **Date Utilities**: date-fns
- **Icons**: Lucide React

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- A Firebase project (for authentication and database)

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Google provider
4. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Deploy security rules (see `FIRESTORE_SETUP.md`)
5. Get your Firebase configuration:
   - Go to Project Settings → Your apps
   - Add a web app if you haven't already
   - Copy the Firebase configuration values

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your key...\n-----END PRIVATE KEY-----\n"

# Optional: AI Assistant (for advanced queries)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

To get Firebase Admin credentials:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Copy the values from the JSON file to your `.env.local`

### 4. Deploy Firestore Security Rules

See `FIRESTORE_SETUP.md` for detailed instructions on deploying security rules.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) in your browser.

### 6. Sign In

1. Click "Sign in with Google"
2. Grant permissions for Calendar and Gmail access
3. Google OAuth tokens will be automatically stored in Firestore
4. You'll be redirected to the dashboard

## Project Structure

```
hero-hub/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── calendar/events/        # Calendar API routes
│   │   │   ├── gmail/                  # Gmail API routes
│   │   │   ├── clients/                # Client CRUD routes (Firestore)
│   │   │   ├── finances/               # Financial data routes (Firestore)
│   │   │   ├── marketing/              # Marketing metrics routes (Firestore)
│   │   │   └── ai/query/               # AI query processing
│   │   ├── auth/signin/                # Sign-in page (Firebase Auth)
│   │   ├── dashboard/                  # Main dashboard page
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Home (redirects to dashboard)
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── LeftSidebar.tsx         # The Now Panel
│   │   │   ├── CenterPanel.tsx         # The Workspace
│   │   │   ├── RightSidebar.tsx        # The Awareness Panel
│   │   │   └── views/
│   │   │       ├── CalendarView.tsx
│   │   │       ├── EmailView.tsx
│   │   │       ├── ClientsView.tsx
│   │   │       ├── FinancialView.tsx
│   │   │       └── MarketingView.tsx
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx        # Firebase Auth provider
│   │   │   └── QueryProvider.tsx       # React Query provider
│   │   └── ui/                         # Reusable UI components
│   ├── lib/
│   │   ├── firebase.ts                 # Firebase client config
│   │   ├── firebase-admin.ts           # Firebase Admin SDK
│   │   ├── firebase-auth.ts            # Firebase Auth utilities
│   │   ├── auth-helpers.ts             # Server-side auth helpers
│   │   ├── google-tokens.ts           # Google OAuth token management
│   │   ├── api-helpers.ts             # Client-side API helpers
│   │   ├── google-apis.ts              # Google API clients
│   │   ├── store.ts                    # Zustand store
│   │   └── hooks/
│   │       └── use-toast.ts            # Toast notifications hook
│   └── types/
│       └── index.ts                    # TypeScript type definitions
├── public/
├── .env.local                          # Environment variables (create this)
├── package.json
└── README.md
```

## Development Phases

### ✅ Phase 1: Foundation (Completed)
- Next.js project setup with TypeScript & Tailwind
- Layout structure (3-column responsive grid)
- Firebase Auth implementation
- Firestore database integration
- Basic calendar integration
- Basic email integration

### ✅ Phase 2: Core Features (Completed)
- Full calendar view with event details
- Email list view with preview pane
- Database setup for client data
- Client CRUD operations
- Task list functionality

### ✅ Phase 3: Intelligence Layer (Completed)
- AI query interface
- Search across emails and calendar
- Client data search
- Basic natural language processing

### ✅ Phase 4: Dashboard & Metrics (Completed)
- Financial dashboard UI
- Marketing metrics dashboard
- Quick stats widgets
- Activity feed
- Charts and visualizations

### ✅ Phase 5: Polish & Enhancement (Completed)
- Auto-refresh optimization
- Dark mode default
- Loading skeletons
- Error handling
- Toast notifications

## Key Features by Panel

### Left Sidebar - "The Now Panel"
- Real-time clock and date
- Next 3 upcoming meetings with countdown timers
- One-click to join video meetings
- Unread email count with account details
- AI-powered search interface

### Center Panel - "The Workspace"
- **Calendar View**: Week view with color-coded events
- **Email View**: Unified inbox with preview pane
- **Client Dashboard**: Grid view with status indicators
- **Financial Overview**: Revenue charts and transaction history
- **Marketing Metrics**: Campaign performance and traffic analysis

### Right Sidebar - "The Awareness Panel"
- Quick stats cards (revenue, pipeline, clients, marketing spend)
- Drag-and-drop priority task list
- Real-time activity feed
- Recent notifications

## Customization

### Adding New Views

1. Create a new view component in `src/components/dashboard/views/`
2. Add the view to `CenterPanel.tsx`
3. Create corresponding API route in `src/app/api/`

### Styling

The application uses dark mode by default. To customize colors:
- Edit `src/app/globals.css` for theme colors
- Modify Tailwind classes in components

### Data Sources

All data is stored in Firestore:
- Clients, transactions, and marketing campaigns are stored in Firestore collections
- Google Calendar and Gmail data are fetched using stored OAuth tokens
- To add sample data, create documents in Firestore or use a migration script

To integrate with external APIs:
1. Update API routes in `src/app/api/` to fetch from external services
2. Store API credentials securely in environment variables
3. Integrate with third-party APIs (Google Analytics, Meta Ads, etc.)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Update `NEXTAUTH_URL` to your production URL
5. Update Google OAuth redirect URIs

### Self-Hosted

```bash
npm run build
npm start
```

Ensure all environment variables are set on your server.

## Performance Optimization

- Server Components for initial data load
- Client-side React Query for auto-refresh
- Optimistic updates for better UX
- Efficient re-rendering with React.memo
- Code splitting with Next.js App Router

## Security Considerations

- Firebase ID tokens are verified on every API request
- Firestore security rules enforce user data isolation
- Google OAuth tokens are stored securely in Firestore
- API routes are protected with Firebase Admin authentication
- Input sanitization for AI queries
- Rate limiting recommendations for production
- CORS configuration for API routes

## Future Enhancements

- [ ] Mobile companion app
- [ ] Voice commands for AI queries
- [ ] Slack/Teams integration
- [ ] CRM integrations (HubSpot, Salesforce)
- [ ] Advanced analytics and reporting
- [ ] Email composition from dashboard
- [ ] Calendar event creation
- [ ] Desktop/push notifications
- [ ] Multi-user support for teams
- [ ] Export/import data functionality

## Troubleshooting

### Authentication Issues
- Verify Firebase configuration in `.env.local`
- Check that Firebase Auth is enabled in Firebase Console
- Ensure Google sign-in provider is enabled
- Verify Firestore security rules are deployed

### API Errors
- Check API routes are accessible
- Verify Firebase ID tokens are being sent in Authorization headers
- Check that Google OAuth tokens are stored in Firestore
- Review browser console for error messages

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors with `npm run lint`
- Clear `.next` folder and rebuild

## Contributing

This is a demonstration project. Feel free to fork and customize for your needs.

## License

MIT License - feel free to use this project as a template for your own dashboard application.

## Support

For issues and questions, please refer to the documentation or create an issue in the repository.

---

Built with ❤️ using Next.js 14, TypeScript, and Tailwind CSS
