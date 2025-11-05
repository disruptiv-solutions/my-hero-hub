# Getting Started with Hero Hub

This guide will walk you through setting up Hero Hub on your local machine.

## Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Google provider
4. Enable Firestore Database:
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in production mode"
   - Select a location
5. Get Firebase configuration:
   - Go to Project Settings → Your apps
   - Add a web app if you haven't already
   - Copy the Firebase configuration values
6. Get Firebase Admin credentials:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file (you'll need values from it)
7. Enable Google APIs (Required for Calendar and Gmail):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your Firebase project (or the linked Google Cloud project)
   - Go to **APIs & Services** → **Library**
   - Search for and enable:
     - **Google Calendar API**
     - **Gmail API**
   - Wait 2-5 minutes for APIs to propagate

### Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your key...\n-----END PRIVATE KEY-----\n"
```

**Important**: The `FIREBASE_PRIVATE_KEY` must include the full key with `\n` for line breaks.

### Step 4: Deploy Firestore Security Rules

See `FIRESTORE_SETUP.md` for detailed instructions. You can deploy rules via Firebase Console or Firebase CLI.

### Step 5: Run the Application

```bash
npm run dev
```

Visit http://localhost:3005 and sign in with your Google account!

## First Time Setup

### Granting Permissions

When you first sign in, Google will ask for permissions:

1. **View your email messages and settings** - Required for email features
2. **View and manage your calendars** - Required for calendar features
3. **View your tasks** - Optional, for task integration

Click "Allow" to grant these permissions.

### What You'll See

After signing in, you'll land on the Hero Hub dashboard with:

- **Left Panel**: Your upcoming meetings, email count, and AI search
- **Center Panel**: Tabs to view Calendar, Email, Clients, Financial, and Marketing data
- **Right Panel**: Quick stats, your priority tasks, and activity feed

## Features Guide

### Calendar Integration

- Automatically syncs with your Google Calendar
- Shows upcoming events in the left sidebar
- Full week view in the Calendar tab
- Click-to-join for video meetings
- Updates every 5 minutes

### Email Integration

- Displays unread count in the left sidebar
- Full inbox view in the Email tab
- Email preview pane
- Updates every 2 minutes

### Client Management

- Pre-populated with 3 sample clients
- Add new clients with the "Add Client" button
- Track status: lead, active, or closed
- Filter and search functionality

### Financial Dashboard

- Sample financial data included
- View revenue by day, week, month
- Track pipeline value
- Transaction history

### Marketing Metrics

- Sample campaign data
- View impressions, clicks, conversions
- Traffic source breakdown
- Performance charts

### AI Assistant

- Type queries in the left sidebar search box
- Examples:
  - "Show emails from [name]"
  - "What's my next meeting?"
  - "List active clients"
  - "Revenue this month"

### Priority Tasks

- Add tasks in the right sidebar
- Click circles to mark complete
- Drag to reorder (future feature)
- Delete with trash icon

## Customization

### Adding Your Own Data

The app currently uses mock data for clients, financial, and marketing metrics. To add your own:

1. **Clients**: Use the API at `/api/clients` (POST requests)
2. **Financial**: Modify `src/app/api/finances/route.ts`
3. **Marketing**: Modify `src/app/api/marketing/route.ts`

### Connecting to a Database

For production use, connect to PostgreSQL:

1. Set up a database (recommend Supabase for easy setup)
2. Add `DATABASE_URL` to `.env.local`
3. Update API routes to use the database instead of mock data

### Integrating Real Marketing Data

To connect Google Analytics or Meta Ads:

1. Add their respective API credentials to `.env.local`
2. Install necessary SDKs: `npm install @google-analytics/data` or `facebook-nodejs-business-sdk`
3. Update `src/app/api/marketing/route.ts` with API calls

## Troubleshooting

### "Error: Invalid OAuth credentials"

**Solution**: Double-check your `.env.local` file:
- Ensure no extra spaces in credentials
- Verify redirect URI matches exactly in Google Console
- Make sure you're using the correct Client ID and Secret

### "Failed to fetch calendar events"

**Solution**: 
- Ensure you granted Calendar permissions during sign-in
- Check that Google Calendar API is enabled in Console
- Sign out and sign in again to re-authorize

### "Cannot read property 'email' of undefined"

**Solution**: You need to sign in first
- Navigate to `/auth/signin`
- Complete Google OAuth flow

### Page won't load / shows errors

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
# Restart dev server
npm run dev
```

## Performance Tips

### For Always-On Display

1. Use a dedicated monitor at 1920x1080 or higher
2. Disable screen saver
3. Set monitor to never sleep
4. Use a modern browser (Chrome/Edge recommended)
5. Close other browser tabs to reduce memory usage

### Refresh Intervals

You can customize refresh rates in `src/components/providers/QueryProvider.tsx`:

```typescript
refetchInterval: 2 * 60 * 1000, // 2 minutes (change as needed)
```

## Advanced Configuration

### Multi-Account Support

To connect multiple Google accounts:

1. Sign in with your first account
2. Use Google's account switcher to add more accounts
3. Each account's data will be aggregated in the dashboard

### Custom API Endpoints

Create new API routes in `src/app/api/` following the existing pattern:

```typescript
// src/app/api/custom/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Your logic here
  return NextResponse.json({ data: "Your data" });
}
```

### Keyboard Shortcuts (Future Enhancement)

Plan to add:
- `Ctrl/Cmd + K` - Open AI search
- `Ctrl/Cmd + 1-5` - Switch between tabs
- `N` - Add new task
- `R` - Refresh data

## Next Steps

1. **Customize the dashboard** to match your workflow
2. **Connect to real data sources** for production use
3. **Deploy to Vercel** for remote access
4. **Set up a dedicated display** for always-on monitoring
5. **Explore API routes** to add custom integrations

## Support & Resources

- **Documentation**: See README.md for full details
- **Google OAuth Setup**: https://developers.google.com/identity/protocols/oauth2
- **Next.js Docs**: https://nextjs.org/docs
- **React Query Docs**: https://tanstack.com/query/latest

## Feedback

Have suggestions or found a bug? Feel free to create an issue or submit a pull request!

---

Happy monitoring with Hero Hub! 🚀

