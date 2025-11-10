# OAuth Consent Screen Configuration Guide

## Current Settings Review

Based on your OAuth consent screen, here's what needs to be updated:

## ✅ What's Already Set

- **User support email**: `info@disruptiv.solutions` ✅
- **Authorized domain**: `hero-hub-4c4f3.firebaseapp.com` ✅
- **Verification status**: Not required (good for testing!) ✅

## ⚠️ What Needs to be Updated

### 1. App Name

**Current**: `project-586000007031`  
**Should be**: `Hero Hub` or `Hero Hub - Business Command Center`

**Why**: The app name is what users see when granting permissions. A descriptive name builds trust.

---

### 2. App Logo (Optional but Recommended)

**Current**: Not uploaded  
**Recommended**: Upload a 120x120px square logo

**Requirements**:
- Format: JPG, PNG, or BMP
- Size: Maximum 1MB
- Dimensions: 120x120px (square)
- Best results: Square logo with transparent or solid background

**Note**: If you upload a logo, you'll need to submit for verification (unless in testing mode).

**Action**: 
- Create or find a logo for Hero Hub
- Resize to 120x120px
- Upload to the consent screen

---

### 3. Application Home Page

**Current**: Empty  
**Should be**: `https://hero-hub-4c4f3.firebaseapp.com`

**Action**: Fill in: `https://hero-hub-4c4f3.firebaseapp.com`

---

### 4. Application Privacy Policy Link

**Current**: Empty  
**Should be**: `https://hero-hub-4c4f3.firebaseapp.com/privacy`

**Action**: Fill in: `https://hero-hub-4c4f3.firebaseapp.com/privacy`

**Note**: This page is already created at `src/app/privacy/page.tsx`. Make sure it's deployed and accessible.

---

### 5. Application Terms of Service Link

**Current**: Empty  
**Should be**: `https://hero-hub-4c4f3.firebaseapp.com/terms`

**Action**: Fill in: `https://hero-hub-4c4f3.firebaseapp.com/terms`

**Note**: This page is already created at `src/app/terms/page.tsx`. Make sure it's deployed and accessible.

---

## 📋 Complete Configuration Checklist

### Branding Section

- [ ] **App name**: Change from `project-586000007031` to `Hero Hub`
- [ ] **User support email**: `info@disruptiv.solutions` ✅ (already set)
- [ ] **App logo**: Upload 120x120px logo (optional but recommended)

### App Domain Section

- [ ] **Application home page**: `https://hero-hub-4c4f3.firebaseapp.com`
- [ ] **Privacy policy link**: `https://hero-hub-4c4f3.firebaseapp.com/privacy`
- [ ] **Terms of service link**: `https://hero-hub-4c4f3.firebaseapp.com/terms`
- [ ] **Authorized domains**: `hero-hub-4c4f3.firebaseapp.com` ✅ (already set)

### Developer Contact

- [ ] **Email addresses**: `info@disruptiv.solutions` ✅ (already set)

---

## 🚀 Quick Fill-In Guide

Copy and paste these URLs into the OAuth consent screen:

### Application Home Page
```
https://hero-hub-4c4f3.firebaseapp.com
```

### Privacy Policy Link
```
https://hero-hub-4c4f3.firebaseapp.com/privacy
```

### Terms of Service Link
```
https://hero-hub-4c4f3.firebaseapp.com/terms
```

---

## ✅ After Configuration

Once you've filled in all the fields:

1. **Click "Save and Continue"** at the bottom
2. **Go to Scopes section** - Add the required scopes (see `GOOGLE_OAUTH_VERIFICATION.md`)
3. **Add Test Users** (if needed) - Up to 100 users can use the app without verification
4. **Review** - Make sure all URLs are accessible and working

---

## 🔍 Verify URLs Are Accessible

Before submitting, test that these URLs work:

1. **Homepage**: 
   - Visit: `https://hero-hub-4c4f3.firebaseapp.com`
   - Should redirect to sign-in page

2. **Privacy Policy**:
   - Visit: `https://hero-hub-4c4f3.firebaseapp.com/privacy`
   - Should show the privacy policy page (no login required)

3. **Terms of Service**:
   - Visit: `https://hero-hub-4c4f3.firebaseapp.com/terms`
   - Should show the terms page (no login required)

**Important**: These pages must be publicly accessible (no authentication required) for Google to verify them.

---

## 📝 Next Steps

1. ✅ Update app name to "Hero Hub"
2. ✅ Fill in application home page URL
3. ✅ Fill in privacy policy URL
4. ✅ Fill in terms of service URL
5. ✅ (Optional) Upload app logo
6. ✅ Save and continue to Scopes section
7. ✅ Add required scopes (see next section)

---

## 🔗 Related Documentation

- **Full Verification Guide**: See `GOOGLE_OAUTH_VERIFICATION.md`
- **Scope Justifications**: See `VERIFICATION_PREPARATION.md`
- **Setup Checklist**: See `OAUTH_SETUP_CHECKLIST.md`






