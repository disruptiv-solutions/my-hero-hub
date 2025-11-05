# Google OAuth Verification Guide

## Overview

To allow users (not just you) to grant access to their Google Calendar and Gmail data, you need to verify your app with Google. Currently, your app is likely in "Testing" mode, which only allows you to access Google services.

## Current Status

- **Testing Mode**: Only you (and up to 100 test users) can use the app
- **Production Mode**: Anyone can use the app after verification

## Step 1: Configure OAuth Consent Screen

### 1.1 Go to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (or the linked Google Cloud project)
3. Navigate to **APIs & Services** → **OAuth consent screen**

### 1.2 User Type Selection

- **Internal** (if you have Google Workspace): Only for your organization
- **External** (recommended): For general public use

Click **Create** or **Edit** if already created.

### 1.3 App Information

Fill in the required fields:

- **App name**: "Hero Hub" (or your preferred name)
- **User support email**: Your email address
- **App logo** (optional): Upload a logo (120x120px minimum)
- **Application home page**: Your app's URL (e.g., `https://your-app.vercel.app`)
- **Application privacy policy link**: **REQUIRED** - Create a privacy policy page
- **Application terms of service link**: **REQUIRED** - Create a terms of service page
- **Authorized domains**: Add your domain (e.g., `your-app.vercel.app`, `vercel.app`)

### 1.4 Scopes

Add the following scopes:

1. `https://www.googleapis.com/auth/calendar.readonly`
   - **Purpose**: Read calendar events
   - **Why needed**: Display upcoming meetings and events

2. `https://www.googleapis.com/auth/gmail.readonly`
   - **Purpose**: Read Gmail messages
   - **Why needed**: Display emails and unread counts

3. `https://www.googleapis.com/auth/userinfo.email`
   - **Purpose**: See user's email address
   - **Why needed**: Identify which account is being used

4. `https://www.googleapis.com/auth/userinfo.profile`
   - **Purpose**: See basic profile information
   - **Why needed**: Display user name and profile picture

**Note**: Google will review these scopes. Make sure you have a clear justification for each.

### 1.5 Test Users (Development Phase)

While in testing mode, add test users:
- Go to **Test users** section
- Click **Add Users**
- Add email addresses of people who should have access during testing (max 100)

### 1.6 Save and Continue

Click **Save and Continue** through all steps.

## Step 2: Create Required Legal Pages

### 2.1 Privacy Policy

Create a privacy policy page that explains:
- What data you collect (email, calendar events, Gmail messages)
- How you use the data (display in dashboard)
- Where data is stored (Firestore)
- How users can revoke access
- Contact information

**Example**: `https://your-app.vercel.app/privacy`

### 2.2 Terms of Service

Create a terms of service page that explains:
- How the service works
- User responsibilities
- Service limitations
- Contact information

**Example**: `https://your-app.vercel.app/terms`

## Step 3: Submit for Verification

### 3.1 Prerequisites Checklist

Before submitting, ensure:
- [ ] OAuth consent screen is fully configured
- [ ] Privacy policy is published and accessible
- [ ] Terms of service is published and accessible
- [ ] App is functional and tested
- [ ] All required scopes are added
- [ ] App icon/logo is uploaded (recommended)
- [ ] Support email is set and monitored

### 3.2 Video Demonstration

Google may require a video showing:
- How users sign in
- How the app requests permissions
- What the app does with the data
- How users can revoke access

**Recommended**: Record a 2-3 minute video demonstrating:
1. Sign-in flow
2. Permission request screen
3. Dashboard showing calendar and email
4. Settings/profile page
5. How to disconnect account

### 3.3 Submit for Verification

1. Go to **OAuth consent screen** in Google Cloud Console
2. Click **PUBLISH APP** (or **Submit for verification** if it's your first time)
3. Fill out the verification form:
   - **App purpose**: Explain what Hero Hub does
   - **Scopes justification**: Explain why each scope is needed
   - **Video link** (if required): Upload to YouTube (unlisted) and share link
   - **Additional information**: Any other relevant details

### 3.4 Verification Timeline

- **Review time**: 4-6 weeks (can be longer)
- **Status updates**: You'll receive email notifications
- **Feedback**: Google may request changes or clarification

## Step 4: Important Notes

### Sensitive Scopes

The following scopes are considered "Sensitive" and require verification:
- `gmail.readonly` - Access to Gmail
- `calendar.readonly` - Access to Calendar

These require:
- Security assessment (if handling sensitive data)
- Detailed justification
- Privacy policy
- Terms of service

### Restricted Scopes

Some scopes are "Restricted" and have additional requirements:
- Usually not needed for Hero Hub
- Require security review
- May require business verification

### Domain Verification

If using a custom domain:
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Verify ownership of your domain
3. Add domain to OAuth consent screen

## Step 5: Testing Before Verification

### 5.1 Test Users

While waiting for verification:
- Add test users in OAuth consent screen
- They can use the app without verification
- Maximum 100 test users

### 5.2 Unverified App Warning

Users will see:
> "This app isn't verified by Google"

This is normal during development. Users can click "Advanced" → "Go to [Your App] (unsafe)" to proceed.

## Step 6: After Verification

Once approved:
- Remove test users (or keep them)
- App will be available to all users
- Users won't see unverified warnings
- Your app appears as "Verified" in consent screen

## Quick Reference

### Required URLs
- **Privacy Policy**: `https://your-app.vercel.app/privacy`
- **Terms of Service**: `https://your-app.vercel.app/terms`
- **Home Page**: `https://your-app.vercel.app`

### Required Scopes
```
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

### Contact
- **Support Email**: Your email (must be monitored)
- **Developer Contact**: Your email

## Common Issues

### "App not verified" warning
- **Solution**: Add test users OR complete verification

### Verification rejected
- **Solution**: Address Google's feedback, resubmit

### Scopes not approved
- **Solution**: Provide better justification, explain use case clearly

### Privacy policy required
- **Solution**: Create and publish a privacy policy page

## Resources

- [Google OAuth Verification FAQ](https://support.google.com/cloud/answer/9110914)
- [OAuth Consent Screen Guide](https://developers.google.com/identity/protocols/oauth2/web-server)
- [App Verification Best Practices](https://support.google.com/cloud/answer/9110914)

## Next Steps

1. ✅ Configure OAuth consent screen
2. ✅ Create privacy policy page
3. ✅ Create terms of service page
4. ✅ Add test users (for immediate testing)
5. ✅ Submit for verification (for public access)
6. ⏳ Wait for Google's review
7. ✅ Publish app after approval

