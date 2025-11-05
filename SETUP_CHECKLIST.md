# Hero Hub Setup Checklist

Use this checklist to ensure your Hero Hub installation is complete and ready to use.

## ✅ Pre-Installation

- [ ] Node.js 18 or higher installed
  ```bash
  node --version  # Should show v18.x or higher
  ```
- [ ] npm installed
  ```bash
  npm --version  # Should show 9.x or higher
  ```
- [ ] Git installed (for version control)
- [ ] Code editor ready (VS Code recommended)
- [ ] Modern web browser (Chrome, Edge, Firefox)

## ✅ Project Setup

- [ ] Dependencies installed
  ```bash
  npm install
  ```
- [ ] No installation errors in terminal
- [ ] `node_modules` folder created
- [ ] `package-lock.json` updated

## ✅ Google Cloud Configuration

### Create Project
- [ ] Google Cloud Console account created
- [ ] New project created or existing project selected
- [ ] Project name noted: _______________

### Enable APIs
- [ ] Google Calendar API enabled
- [ ] Gmail API enabled
- [ ] Google Tasks API enabled (optional)

### OAuth Consent Screen
- [ ] OAuth consent screen configured
- [ ] App name set
- [ ] User support email added
- [ ] Developer contact email added
- [ ] Scopes added:
  - [ ] `.../auth/userinfo.email`
  - [ ] `.../auth/userinfo.profile`
  - [ ] `.../auth/calendar.readonly`
  - [ ] `.../auth/gmail.readonly`

### OAuth Credentials
- [ ] OAuth 2.0 Client ID created
- [ ] Application type: Web application
- [ ] Authorized redirect URIs added:
  - [ ] `http://localhost:3001/api/auth/callback/google`
- [ ] Client ID copied
- [ ] Client Secret copied

## ✅ Environment Configuration

- [ ] `.env.local` file created in project root
- [ ] All required variables added:
  ```env
  GOOGLE_CLIENT_ID=your_client_id
  GOOGLE_CLIENT_SECRET=your_client_secret
  NEXTAUTH_SECRET=generated_secret
  NEXTAUTH_URL=http://localhost:3001
  ```
- [ ] `NEXTAUTH_SECRET` generated
  ```bash
  # Windows PowerShell:
  [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
  
  # Mac/Linux:
  openssl rand -base64 32
  ```
- [ ] No spaces or quotes around values
- [ ] File saved

## ✅ First Run

- [ ] Development server started
  ```bash
  npm run dev
  ```
- [ ] No errors in terminal
- [ ] Server running on port 3005
- [ ] Browser opened to `http://localhost:3005`
- [ ] Automatically redirected to `/dashboard`
- [ ] Redirected to sign-in page (expected behavior)

## ✅ Authentication Test

- [ ] "Sign in with Google" button visible
- [ ] Clicked sign-in button
- [ ] Redirected to Google OAuth page
- [ ] Correct Google account selected
- [ ] All permission requests reviewed:
  - [ ] View email messages and settings
  - [ ] View and manage calendars
  - [ ] View tasks (if enabled)
- [ ] Clicked "Allow"
- [ ] Redirected back to Hero Hub
- [ ] Dashboard loaded successfully

## ✅ Dashboard Verification

### Header
- [ ] "Hero Hub" logo visible
- [ ] User name displayed
- [ ] User email displayed
- [ ] Profile picture visible

### Left Sidebar (Now Panel)
- [ ] Current time displayed and updating
- [ ] Current date correct
- [ ] "Upcoming Meetings" section visible
- [ ] Email status widget showing
- [ ] AI search input available

### Center Panel (Workspace)
- [ ] Tab navigation visible with 5 tabs:
  - [ ] Calendar
  - [ ] Email
  - [ ] Clients
  - [ ] Financial
  - [ ] Marketing
- [ ] Calendar view loads by default
- [ ] Can switch between tabs
- [ ] Each tab loads without errors

### Right Sidebar (Awareness Panel)
- [ ] Quick stats cards visible (4 cards)
- [ ] "Today's Priorities" task list shown
- [ ] Can add new tasks
- [ ] "Recent Activity" feed displayed

## ✅ Feature Testing

### Calendar Integration
- [ ] Calendar events loading
- [ ] Week view displaying correctly
- [ ] Today's date highlighted
- [ ] Events showing in left sidebar
- [ ] Countdown timers working
- [ ] Can click events for details
- [ ] Video meeting links present (if applicable)

### Email Integration
- [ ] Unread count showing in left sidebar
- [ ] Email list loading in Email tab
- [ ] Can select emails to preview
- [ ] Email content displaying in preview pane
- [ ] Unread emails highlighted
- [ ] Starred emails showing star icon

### Client Management
- [ ] 3 sample clients visible
- [ ] Can search clients
- [ ] Can filter by status (all, lead, active, closed)
- [ ] Client cards showing all information
- [ ] "Add Client" button present

### Financial Dashboard
- [ ] Revenue metrics displaying
- [ ] Charts rendering correctly
- [ ] Transaction list showing
- [ ] All 4 stat cards visible with values

### Marketing Analytics
- [ ] Campaign data displaying
- [ ] Pie chart visible
- [ ] Bar chart rendering
- [ ] All metrics showing numbers

### AI Search
- [ ] Can type in search box
- [ ] Search button clickable
- [ ] No errors when searching
- [ ] (Response may be basic - that's expected)

### Tasks & Activity
- [ ] Can add new tasks
- [ ] Can mark tasks complete
- [ ] Can delete tasks
- [ ] Activity feed showing 3 items
- [ ] Timestamps display correctly

## ✅ Auto-Refresh Testing

Wait 2-5 minutes and verify:
- [ ] Email count updates (2 min interval)
- [ ] Calendar events refresh (5 min interval)
- [ ] No page reload required
- [ ] No UI flickering during refresh

## ✅ Browser Console Check

Open browser DevTools (F12) and check:
- [ ] No red errors in Console tab
- [ ] No 401 Unauthorized errors
- [ ] No 404 Not Found errors
- [ ] API requests showing in Network tab
- [ ] Responses returning data (not errors)

## ✅ Build Test (Optional but Recommended)

- [ ] Production build succeeds
  ```bash
  npm run build
  ```
- [ ] No TypeScript errors
- [ ] No build errors
- [ ] Build output shows success
- [ ] Can start production server
  ```bash
  npm start
  ```
- [ ] Production version works at `http://localhost:3001`

## 🎯 Optional Enhancements

- [ ] Custom domain configured (for deployment)
- [ ] Database connected (PostgreSQL/Supabase)
- [ ] Real marketing data integrated
- [ ] Real financial data connected
- [ ] Additional Google accounts added
- [ ] Anthropic API key added (for advanced AI)
- [ ] Deployed to Vercel or own server
- [ ] SSL certificate configured
- [ ] Production OAuth credentials created

## 📋 Documentation Review

- [ ] README.md read
- [ ] GETTING_STARTED.md followed
- [ ] QUICK_REFERENCE.md bookmarked
- [ ] DEPLOYMENT.md reviewed (if deploying)
- [ ] PROJECT_SUMMARY.md understood

## 🐛 Troubleshooting Checklist

If something isn't working:

### Authentication Issues
- [ ] `.env.local` file exists and has correct values
- [ ] Google OAuth redirect URI matches exactly
- [ ] All required APIs are enabled in Google Console
- [ ] No extra characters or spaces in credentials
- [ ] Clear browser cookies and try again
- [ ] Try incognito/private browsing mode

### API Errors
- [ ] Server is running (`npm run dev`)
- [ ] No port conflicts (3001 should be free)
- [ ] Check browser console for specific errors
- [ ] Verify internet connection
- [ ] Check Google API quotas not exceeded

### Display Issues
- [ ] Hard refresh the page (Ctrl+Shift+R)
- [ ] Clear browser cache
- [ ] Try different browser
- [ ] Check browser zoom level (should be 100%)
- [ ] Verify screen resolution (1280x720 minimum)

### Build/Start Issues
- [ ] Delete `.next` folder
- [ ] Delete `node_modules` folder
- [ ] Delete `package-lock.json`
- [ ] Run `npm install` again
- [ ] Try `npm run dev` again

## ✨ Success Indicators

You're ready to use Hero Hub when:

✅ Dashboard loads without errors
✅ All three panels visible and populated
✅ Can switch between all five tabs
✅ Calendar shows your actual events
✅ Email shows your actual unread count
✅ No console errors
✅ Auto-refresh works silently
✅ Can add and manage tasks
✅ Profile information displays correctly

## 🎉 You're Done!

If all items above are checked, congratulations! Your Hero Hub is fully operational.

### Next Steps:
1. **Customize**: Add your clients, adjust mock data
2. **Explore**: Try all features and tabs
3. **Optimize**: Adjust refresh intervals if needed
4. **Extend**: Add your own integrations
5. **Deploy**: Follow DEPLOYMENT.md when ready

### Quick Tips:
- Keep the dashboard open on a second monitor
- Bookmark for easy access
- Enable browser notifications (future feature)
- Check activity feed for important updates
- Use AI search to find information quickly

---

**Need Help?**
- Check GETTING_STARTED.md for detailed setup
- Review QUICK_REFERENCE.md for common tasks
- See troubleshooting section in README.md
- Review browser console for error messages

**Enjoy your Hero Hub!** 🚀

