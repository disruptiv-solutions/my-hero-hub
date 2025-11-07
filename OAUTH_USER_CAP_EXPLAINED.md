# OAuth User Cap Explained

## Your Current Status ✅

- **Publishing status**: In production ✅
- **User type**: External ✅
- **OAuth user cap**: 0 users / 100 user cap

## What This Means

### The 100 User Cap

The 100-user cap applies to apps requesting **sensitive or restricted scopes** that haven't been verified yet. Your app uses:

- ✅ `gmail.readonly` - **Sensitive scope**
- ✅ `calendar.readonly` - **Sensitive scope**

These scopes require verification, so Google limits you to 100 users until you're verified.

### Current Usage: 0/100

- **0 users** means no users have granted permissions yet (or count hasn't updated)
- **100 user cap** is your limit before verification
- After verification, this cap is removed (for approved scopes)

---

## How It Works

### Before Verification

**What happens**:
- Users see "This app isn't verified" warning
- Users can click "Advanced" → "Go to Hero Hub (unsafe)" to proceed
- First 100 users can grant permissions
- After 100 users, new users cannot grant permissions until you verify

**User Experience**:
```
⚠️ This app isn't verified by Google
   [Advanced] [Go to Hero Hub (unsafe)]
```

### After Verification

**What happens**:
- Warning disappears
- Unlimited users can grant permissions
- App shows as "Verified" in consent screen
- User cap still displays but doesn't apply

---

## Options for You

### Option 1: Use Test Users (Immediate Solution) ✅

**Best for**: Testing with specific users now

**Steps**:
1. Go to OAuth consent screen
2. Scroll to "Test users" section
3. Click "Add Users"
4. Add up to 100 email addresses
5. These users can use the app without seeing the warning

**Advantages**:
- ✅ Immediate access
- ✅ No verification needed
- ✅ Users don't see "unverified" warning
- ✅ Perfect for beta testing

**Limitations**:
- Only the users you add can use the app
- Maximum 100 test users
- Not suitable for public launch

---

### Option 2: Submit for Verification (For Public Launch)

**Best for**: Making the app available to everyone

**Timeline**: 4-6 weeks for review

**Steps**:
1. Complete OAuth consent screen configuration
2. Add all required scopes with justifications
3. Ensure privacy policy and terms are live
4. Submit for verification (see `GOOGLE_OAUTH_VERIFICATION.md`)
5. Wait for Google's review
6. After approval, unlimited users can access

**Advantages**:
- ✅ Unlimited users
- ✅ No "unverified" warning
- ✅ Professional appearance
- ✅ Public launch ready

**Requirements**:
- Privacy policy (✅ you have this)
- Terms of service (✅ you have this)
- Scope justifications (✅ see `VERIFICATION_PREPARATION.md`)
- Video demonstration (may be required)

---

## Current Recommendation

### For Now (Testing Phase)

1. **Add Test Users**:
   - Go to OAuth consent screen → Test users
   - Add email addresses of people who should test the app
   - They can use it immediately without warnings

2. **Monitor Usage**:
   - Keep track of how many users have granted permissions
   - The counter will update as users sign in

### For Public Launch

1. **Prepare Verification**:
   - Use `VERIFICATION_PREPARATION.md` for scope justifications
   - Ensure privacy/terms pages are live and accessible
   - Prepare video demonstration if needed

2. **Submit Early**:
   - Verification takes 4-6 weeks
   - Submit before you approach the 100-user limit
   - You can continue using test users while waiting

---

## Understanding the Cap

### What Counts Toward the Cap

- ✅ Each user who grants permissions counts as 1
- ✅ Each Google account that signs in counts as 1
- ✅ If a user revokes and re-grants, it still counts as 1

### What Doesn't Count

- ❌ Your own account (as app owner)
- ❌ Test users (they're separate from the cap)
- ❌ Users after verification (cap doesn't apply)

### Tracking Usage

- **Current**: 0/100 means you have full capacity
- **As you gain users**: Counter will increase (e.g., 5/100, 10/100)
- **At 100/100**: New users cannot grant permissions until verified

---

## Best Practices

### 1. Add Test Users Early

If you have specific beta testers:
- Add them as test users now
- They get immediate access
- No verification needed
- Doesn't count toward the 100-user cap

### 2. Monitor User Growth

- Check the cap periodically
- If approaching 50/100, start verification process
- Verification takes time, so plan ahead

### 3. Prepare for Verification

Even if you're not at the limit:
- Complete all verification requirements
- Have scope justifications ready
- Keep privacy/terms pages updated
- Submit when ready (don't wait until you hit the limit)

---

## Quick Actions

### Immediate (No Verification Needed)

1. **Add Test Users**:
   ```
   OAuth Consent Screen → Test users → Add Users
   → Enter email addresses (up to 100)
   ```

2. **Test the App**:
   - Share with test users
   - They can sign in immediately
   - No "unverified" warning for them

### For Public Launch

1. **Complete Verification**:
   - Follow `GOOGLE_OAUTH_VERIFICATION.md`
   - Use `VERIFICATION_PREPARATION.md` for justifications
   - Submit and wait for approval

2. **Remove Cap**:
   - After verification, cap is removed
   - Unlimited users can access
   - No warnings shown

---

## Summary

**Your Status**: ✅ Ready to use with test users  
**Current Cap**: 0/100 (full capacity available)  
**Next Steps**: 
- Add test users for immediate testing
- Prepare verification for public launch
- Monitor usage as you grow

The 100-user cap is a safety measure by Google. You can work within it using test users, or remove it by completing verification when ready for public launch.




