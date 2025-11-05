# Google OAuth Verification Preparation

## ✅ Checklist - What You Have

- [x] Privacy Policy URL: `https://hero-hub-4c4f3.firebaseapp.com/privacy`
- [x] Terms of Service URL: `https://hero-hub-4c4f3.firebaseapp.com/terms`
- [x] Application Homepage: `https://hero-hub-4c4f3.firebaseapp.com`
- [ ] Scope Justifications (see below)
- [ ] Test Account (see below)

## 📋 Required Items for Verification

### 1. Privacy Policy URL ✅

**Status**: Created at `/privacy`

**URL**: `https://hero-hub-4c4f3.firebaseapp.com/privacy`

**Action Required**: 
- Update contact information in `src/app/privacy/page.tsx`
- Replace `[Your Support Email]` with your actual email
- Replace `[Your Website URL]` with your actual website URL
- Ensure the page is publicly accessible (no authentication required)

### 2. Terms of Service URL ✅

**Status**: Created at `/terms`

**URL**: `https://hero-hub-4c4f3.firebaseapp.com/terms`

**Action Required**:
- Update contact information in `src/app/terms/page.tsx`
- Replace `[Your Support Email]` with your actual email
- Replace `[Your Website URL]` with your actual website URL
- Ensure the page is publicly accessible (no authentication required)

### 3. Application Homepage ✅

**Status**: Your app is deployed

**URL**: `https://hero-hub-4c4f3.firebaseapp.com`

**Action Required**: 
- Ensure the homepage is functional and accessible
- Test that users can navigate to sign-in from the homepage

### 4. Scope Justifications ⚠️

**Critical**: You must provide clear, detailed justifications for each scope. Use these templates when submitting:

---

## 📝 Scope Justifications Template

### Scope 1: `https://www.googleapis.com/auth/calendar.readonly`

**Purpose**: Read-only access to user's Google Calendar

**Justification**:
```
Hero Hub is a business command center dashboard that aggregates calendar 
information to help users manage their schedule. We need read-only access 
to Google Calendar to:

1. Display upcoming meetings and events in the dashboard's "Now Panel"
2. Show calendar events in the weekly calendar view
3. Provide time-based context for the user's current and upcoming activities
4. Enable users to see their schedule at a glance without leaving the dashboard

We use this scope to:
- Fetch calendar events for the next 7 days
- Display event summaries, times, and meeting links
- Show upcoming meetings in the left sidebar
- Calculate time until next meeting

We do NOT:
- Create, modify, or delete calendar events
- Access calendars the user hasn't explicitly shared
- Store calendar event content (only display in real-time)

Data is accessed in real-time through Google Calendar API and displayed 
only to the authenticated user. We do not store calendar event content 
on our servers.
```

**User Benefit**: Users can see their upcoming meetings and events integrated into their business dashboard without switching between multiple applications.

---

### Scope 2: `https://www.googleapis.com/auth/gmail.readonly`

**Purpose**: Read-only access to user's Gmail messages

**Justification**:
```
Hero Hub displays email information to help users stay on top of their 
communications. We need read-only access to Gmail to:

1. Display unread email count in the dashboard's "Now Panel"
2. Show email list in the email view
3. Provide email previews and snippets
4. Help users quickly identify important communications

We use this scope to:
- Fetch unread email count
- Retrieve email messages from the inbox
- Display email metadata (sender, subject, date, snippet)
- Show email previews when selected

We do NOT:
- Send, modify, or delete emails
- Access emails outside the user's inbox
- Store email content permanently (only cache for display)
- Access attachments or full email bodies without user interaction

Data is accessed in real-time through Gmail API. Email content is only 
displayed to the authenticated user and is not shared with third parties.
```

**User Benefit**: Users can see their email status and recent messages in their dashboard, helping them stay organized and responsive without constantly checking Gmail.

---

### Scope 3: `https://www.googleapis.com/auth/userinfo.email`

**Purpose**: Access to user's email address

**Justification**:
```
We need to identify which Google account the user has signed in with to:

1. Associate dashboard data with the correct user account
2. Display which email account is connected in the profile settings
3. Support multiple email account management (users can add multiple accounts)
4. Ensure proper data isolation between different user accounts

We use this scope to:
- Identify the authenticated user
- Display account information in the profile page
- Link calendar and email data to the correct user account
- Support the multi-account feature where users can connect multiple Gmail accounts

This is essential for proper user identification and data security.
```

**User Benefit**: Users can see which account they're signed in with and manage multiple email accounts from one dashboard.

---

### Scope 4: `https://www.googleapis.com/auth/userinfo.profile`

**Purpose**: Access to user's basic profile information

**Justification**:
```
We need basic profile information to personalize the user experience:

1. Display user's name in the dashboard header
2. Show user's profile picture for visual identification
3. Personalize the dashboard experience
4. Display user information in the profile settings page

We use this scope to:
- Display user's name and profile picture in the dashboard
- Show user information in the profile page
- Personalize the application interface

This is a standard scope for user identification and personalization.
```

**User Benefit**: Users see their name and profile picture in the dashboard, making the experience more personalized and familiar.

---

## 🧪 Test Account Information

### Option 1: Provide Test Account to Google

If Google requests a test account, create one and provide:

**Test Account Details**:
```
Email: [Create a test Gmail account]
Password: [Share password with Google]
```

**Instructions for Google**:
```
1. Go to https://hero-hub-4c4f3.firebaseapp.com
2. Click "Sign in with Google"
3. Use the test account credentials provided above
4. Grant permissions for Calendar and Gmail when prompted
5. You will be redirected to the dashboard where you can see:
   - Calendar events in the left sidebar
   - Email unread count
   - Full calendar view and email view in the center panel
```

### Option 2: Video Demonstration

Instead of a test account, you can provide a video demonstration:

**Video Requirements**:
- 2-3 minutes long
- Show complete user flow
- Upload to YouTube (unlisted) and share link

**Video Content**:
1. Navigate to the application homepage
2. Click "Sign in with Google"
3. Show the OAuth consent screen with requested permissions
4. Grant permissions
5. Show dashboard with calendar events and email
6. Navigate to profile page showing connected accounts
7. Show how to disconnect accounts (if applicable)

**Recommended Video Script**:
```
1. "This is Hero Hub, a business command center dashboard"
2. "Users sign in with their Google account"
3. "The app requests permission to read calendar and email"
4. "After granting permissions, users see their calendar and email in the dashboard"
5. "The app only reads data to display it - it doesn't modify or share it"
6. "Users can manage multiple email accounts from their profile"
7. "All data access is read-only and respects user privacy"
```

---

## 📝 Verification Submission Form Template

When submitting for verification, use this information:

### App Information
- **App Name**: Hero Hub
- **Purpose**: Business command center dashboard that aggregates calendar, email, and business data
- **Homepage**: `https://hero-hub-4c4f3.firebaseapp.com`
- **Privacy Policy**: `https://hero-hub-4c4f3.firebaseapp.com/privacy`
- **Terms of Service**: `https://hero-hub-4c4f3.firebaseapp.com/terms`

### Scope Justifications
Copy the scope justifications from above into the form.

### Additional Information
```
Hero Hub is a read-only dashboard application that helps users manage their 
business activities by displaying:
- Calendar events and meetings
- Email inbox and unread counts
- Client information
- Financial metrics
- Marketing campaign data

All Google API access is read-only. We do not modify, delete, or share user 
data. Data is displayed in real-time and is only accessible to the authenticated 
user. Users can revoke access at any time through their Google Account settings 
or by disconnecting accounts in the Hero Hub profile page.
```

### Test Account (if required)
Provide the test account details or video link as described above.

---

## ✅ Pre-Submission Checklist

Before submitting for verification:

- [ ] Privacy Policy page is live and accessible
- [ ] Terms of Service page is live and accessible
- [ ] Contact information updated in both pages
- [ ] Homepage is functional
- [ ] OAuth consent screen is configured with all scopes
- [ ] Scope justifications are prepared
- [ ] Test account created (if required) OR video demonstration recorded
- [ ] All required URLs are publicly accessible (no authentication required)
- [ ] App is tested and working correctly

---

## 🚀 Submission Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `hero-hub-4c4f3`
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Click **PUBLISH APP** or **Submit for verification**
5. Fill out the verification form using the information above
6. Submit and wait for review (4-6 weeks typically)

---

## 📞 Support

If you need help during the verification process:
- [Google OAuth Support](https://support.google.com/cloud/contact/oauth_verification)
- [OAuth Verification FAQ](https://support.google.com/cloud/answer/9110914)


