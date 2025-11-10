# ⚠️ CRITICAL: Deploy Firestore Rules Now

## Problem

If you're seeing 403 errors for calendar and email, your Firestore security rules are likely blocking writes. The default rules deny all access.

## Quick Fix

Deploy the security rules from `firestore.rules` to your Firebase project.

### Step 1: Copy Rules to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Open `firestore.rules` in your project
5. Copy the entire contents
6. Paste into the Firebase Console rules editor
7. Click **Publish**

### Step 2: Verify Rules

After publishing, your rules should look like this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // ... other collections
  }
}
```

### Step 3: Test

1. Sign out of your app
2. Sign in again with Google
3. Check the browser console for "Successfully stored Google tokens..."
4. Calendar and email should now work!

## Why This Matters

The `users/{userId}` collection stores Google OAuth tokens. Without proper rules:
- Users can't write their tokens to Firestore
- API routes can't read tokens
- Calendar and email features fail with 403 errors

## Alternative: Firebase CLI

If you prefer using the CLI:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

## Verify Deployment

After deploying, check:
1. Firebase Console → Firestore → Rules tab shows your new rules
2. Browser console shows "Successfully stored Google tokens" on sign-in
3. Calendar and email APIs return 200 instead of 403





