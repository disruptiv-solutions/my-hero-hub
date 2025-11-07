# OAuth Setup Checklist for Hero Hub

## Current Status ✅

You already have:
- ✅ OAuth 2.0 Client ID and Secret
- ✅ Authorized JavaScript origins configured
- ✅ Authorized redirect URIs configured

## What You Still Need ⚠️

### 1. OAuth Consent Screen Configuration

**Location**: Google Cloud Console → APIs & Services → OAuth consent screen

**Required Steps**:

1. **User Type**:
   - Choose "External" (for public access)
   - Or "Internal" (if you have Google Workspace)

2. **App Information** (Required):
   - App name: "Hero Hub"
   - User support email: Your email
   - Developer contact email: Your email
   - App logo (optional but recommended): 120x120px image

3. **App Domain** (Required):
   - Application home page: `https://hero-hub-4c4f3.firebaseapp.com`
   - **Privacy Policy URL**: `https://hero-hub-4c4f3.firebaseapp.com/privacy` ✅ (Created)
   - **Terms of Service URL**: `https://hero-hub-4c4f3.firebaseapp.com/terms` ✅ (Created)
   - Authorized domains: `firebaseapp.com` (already added via your OAuth client)

4. **Scopes** (Required - Add these):
   ```
   https://www.googleapis.com/auth/calendar.readonly
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```

   **Justification for each scope**:
   - **calendar.readonly**: "Display user's upcoming calendar events and meetings in the dashboard"
   - **gmail.readonly**: "Display user's Gmail inbox and unread email counts in the dashboard"
   - **userinfo.email**: "Identify which Google account the user is signed in with"
   - **userinfo.profile**: "Display user's name and profile picture in the dashboard"

5. **Test Users** (For immediate testing):
   - Add email addresses of users who should have access during testing
   - Maximum 100 test users
   - Test users can use the app without verification

### 2. Update Your OAuth Client (If Needed)

Your current setup looks good, but verify:

- **Authorized JavaScript origins** should include:
  - `http://localhost` ✅ (you have this)
  - `http://localhost:5000` ✅ (you have this)
  - `https://hero-hub-4c4f3.firebaseapp.com` ✅ (you have this)
  - Add your production domain if different (e.g., `https://your-custom-domain.com`)

- **Authorized redirect URIs** should include:
  - `https://hero-hub-4c4f3.firebaseapp.com/__/auth/handler` ✅ (you have this)
  - Firebase Auth automatically handles this, so you're good

### 3. Firebase Configuration

Make sure your Firebase project is using the correct OAuth client:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `hero-hub-4c4f3`
3. Go to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Verify the **Web client ID** matches: `586000007031-f6cgnudusrih2dlou22kigksqs1pkmp7.apps.googleusercontent.com`
6. If it doesn't match, update it

### 4. Verification Submission (For Public Access)

Once OAuth consent screen is configured:

1. **Prepare Documentation**:
   - ✅ Privacy Policy: Already created at `/privacy`
   - ✅ Terms of Service: Already created at `/terms`
   - ⚠️ Update contact info in both pages

2. **Record Video** (May be required):
   - 2-3 minute demo showing:
     - Sign-in flow
     - Permission request
     - Dashboard showing calendar/email
     - How to revoke access

3. **Submit for Verification**:
   - Go to OAuth consent screen
   - Click "PUBLISH APP" or "Submit for verification"
   - Fill out verification form with:
     - App purpose
     - Scope justifications
     - Video link (if required)
     - Additional information

## Quick Actions

### Immediate Testing (No Verification Needed)

1. Go to OAuth consent screen
2. Add test users (up to 100)
3. Test users can use the app immediately

### For Public Access

1. Complete OAuth consent screen configuration
2. Update contact info in privacy/terms pages
3. Submit for verification
4. Wait 4-6 weeks for approval

## Common Questions

**Q: Can I use the app myself without verification?**
A: Yes! As the app owner, you can always use it. You can also add up to 100 test users.

**Q: Do I need to verify if I only want a few users?**
A: No, you can add up to 100 test users without verification.

**Q: What happens if I don't verify?**
A: Users will see "This app isn't verified" warning, but they can click "Advanced" → "Go to [Your App] (unsafe)" to proceed.

**Q: How long does verification take?**
A: Typically 4-6 weeks, but can be longer depending on Google's review queue.

## Next Steps

1. ✅ Check OAuth consent screen configuration
2. ✅ Add required scopes
3. ✅ Add test users (for immediate testing)
4. ⚠️ Update contact info in privacy/terms pages
5. ⚠️ Submit for verification (for public access)




