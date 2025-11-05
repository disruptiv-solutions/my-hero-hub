# Firestore Security Rules Setup

## Overview

This document explains how to deploy Firestore security rules for Hero Hub to ensure proper data isolation between users.

## Security Rules

The security rules are defined in `firestore.rules` in the project root. These rules ensure:

1. **User Isolation**: Users can only access their own data
2. **Authentication Required**: All read/write operations require authentication
3. **Data Validation**: Documents must have the correct `userId` field

## Collections Protected

- `users/{userId}` - User metadata and Google OAuth tokens
- `clients/{clientId}` - Client records
- `transactions/{transactionId}` - Financial transactions
- `marketingCampaigns/{campaignId}` - Marketing campaign data

## Deploying Rules

### Option 1: Firebase Console (Recommended for First Time)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your Hero Hub project
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the contents of `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

### Option 2: Firebase CLI

1. Install Firebase CLI if not already installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your project
   - Use existing `firestore.rules` file

4. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Testing Rules

### Using Firebase Console

1. Go to Firestore Database → Rules tab
2. Click **Rules Playground**
3. Test scenarios:
   - Authenticated user accessing their own data (should pass)
   - Authenticated user accessing another user's data (should fail)
   - Unauthenticated user accessing any data (should fail)

### Local Testing

If using Firebase CLI with emulators:

```bash
firebase emulators:start --only firestore
```

Then test rules in the emulator UI at `http://localhost:4000`

## Important Notes

1. **Indexes**: Some queries may require composite indexes. Firebase will prompt you to create them when needed.

2. **User ID Field**: All documents in `clients`, `transactions`, and `marketingCampaigns` must have a `userId` field that matches the Firebase Auth UID.

3. **Token Storage**: The `users/{userId}` collection stores Google OAuth tokens. Ensure these are properly secured and only accessible by the user.

4. **Testing**: Always test rules in development before deploying to production.

## Updating Rules

When you update `firestore.rules`:

1. Test locally or in Firebase Console Rules Playground
2. Deploy using Firebase CLI or Console
3. Verify with test queries

## Troubleshooting

### "Permission denied" errors

- Verify user is authenticated (check Firebase Auth)
- Check that `userId` field matches `request.auth.uid`
- Ensure rules are deployed (check Firebase Console)

### Rules not updating

- Clear browser cache
- Wait a few minutes for propagation
- Verify deployment succeeded in Firebase Console

### Index errors

- Create required indexes in Firebase Console
- Wait for indexes to build (can take a few minutes)

## Production Checklist

Before going to production:

- [ ] Rules tested in development
- [ ] All collections have proper `userId` field
- [ ] Rules deployed successfully
- [ ] Indexes created for all queries
- [ ] Tested with real user accounts
- [ ] Verified data isolation between users

