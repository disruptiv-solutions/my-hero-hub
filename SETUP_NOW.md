# Quick Setup Guide

## Get Your Firebase Credentials

1. Go to: https://console.firebase.google.com/
2. Select your Hero Hub project
3. Click the gear icon âš™ï¸ â†’ Project settings
4. Scroll to 'Your apps' â†’ Web icon </> (if not already created)
5. Copy the config values

## Create .env.local File

Create a file named .env.local in the project root with:

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your key...\n-----END PRIVATE KEY-----\n"

## Enable Firestore

1. In Firebase Console â†’ Firestore Database
2. Click 'Create database'
3. Choose 'Start in production mode'
4. Select location â†’ Enable

## Test It!

npm run dev
# Navigate to http://localhost:3005/auth/signin
# Click 'Sign in with Google'
