# Enable Google APIs

## Problem

If you're seeing errors like:
- "Google Calendar API has not been used in project... or it is disabled"
- "Gmail API has not been used in project... or it is disabled"

You need to enable these APIs in your Google Cloud project.

## Quick Fix

### Step 1: Enable Google Calendar API

1. Go to: https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=YOUR_PROJECT_ID
2. Or navigate to [Google Cloud Console](https://console.cloud.google.com/)
3. Select your Firebase project (or the Google Cloud project linked to your Firebase project)
4. Go to **APIs & Services** → **Library**
5. Search for "Google Calendar API"
6. Click **Enable**

### Step 2: Enable Gmail API

1. Go to: https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=YOUR_PROJECT_ID
2. Or navigate to [Google Cloud Console](https://console.cloud.google.com/)
3. Select your Firebase project
4. Go to **APIs & Services** → **Library**
5. Search for "Gmail API"
6. Click **Enable**

### Step 3: Wait for Propagation

After enabling:
- Wait 2-5 minutes for the APIs to propagate
- Refresh your app
- Try signing in again

## Finding Your Project ID

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → **Project Settings**
4. Your **Project ID** is shown at the top (e.g., `586000007031`)

## Linking Firebase to Google Cloud

If your Firebase project isn't linked to a Google Cloud project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → **Project Settings** → **General** tab
4. Scroll to "Your project" section
5. If you see "Upgrade to Blaze plan" or similar, you may need to:
   - Link to an existing Google Cloud project, or
   - Create a new Google Cloud project

Note: Firebase projects on the free (Spark) plan are automatically linked to Google Cloud projects.

## Direct Links

Replace `YOUR_PROJECT_ID` with your actual project ID:

- **Calendar API**: https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=YOUR_PROJECT_ID
- **Gmail API**: https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=YOUR_PROJECT_ID

## Verify APIs Are Enabled

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Enabled APIs**
4. You should see:
   - ✅ Google Calendar API
   - ✅ Gmail API

## Common Issues

### "Project not found"
- Make sure you're using the correct Google Cloud project
- Check that your Firebase project is linked to a Google Cloud project

### "Permission denied"
- You need to be a project owner or have "Editor" role
- Ask your project admin to enable the APIs

### APIs enabled but still getting errors
- Wait 5-10 minutes for full propagation
- Clear browser cache
- Sign out and sign in again

## Required APIs

Hero Hub requires these Google APIs:
- ✅ Google Calendar API (for calendar events)
- ✅ Gmail API (for email access)
- ✅ Google Tasks API (optional, for task management)

All are free to enable and use within quota limits.





