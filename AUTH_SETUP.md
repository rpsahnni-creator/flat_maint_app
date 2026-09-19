# Green Valley - Society Manager Login Setup Guide

## Authentication Features

The app now includes a complete authentication system with:
- ✅ Gmail OAuth login
- ✅ Email OTP verification 
- ✅ Session persistence
- ✅ Secure logout

## Supabase Configuration

### Step 1: Enable Google OAuth

1. Go to your **Supabase Project Dashboard**
2. Navigate to **Authentication** → **Providers**
3. Click on **Google** and enable it
4. Add your OAuth 2.0 credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Navigate to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Add authorized redirect URIs:
     ```
     https://[your-supabase-project].supabase.co/auth/v1/callback
     ```
   - Copy **Client ID** and **Client Secret**
5. Paste them in Supabase Google provider settings
6. Save

### Step 2: Enable Email OTP

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Email** provider and ensure it's enabled
3. Configure email settings:
   - Go to **Authentication** → **Email Templates**
   - Customize the OTP email template if needed
   - Default template works fine

### Step 3: Environment Variables

Your `.env` file should have:
```
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
```

These are already set up in the project.

### Step 4: OAuth Redirect URL

For development:
```
http://localhost:5173/auth/callback
```

For production:
```
https://yourdomain.com/auth/callback
```

## How to Use

### For Users

1. **Gmail Login:**
   - Click "Sign in with Google"
   - Authorize the app with your Google account
   - You'll be automatically logged in

2. **Email OTP Login:**
   - Click "Sign in with Email & OTP"
   - Enter your email address
   - Click "Send OTP"
   - Check your email for the verification code
   - Click the link in the email or enter the code manually
   - You'll be logged in

### For Developers

The authentication is managed through:

**AuthContext** (`src/context/AuthContext.tsx`):
- `useAuth()` hook for accessing auth state
- `signInWithGoogle()` - OAuth login
- `signInWithOTP()` - Send OTP
- `verifyOTP()` - Verify OTP token
- `signOut()` - Logout

**Login Page** (`src/pages/Login.tsx`):
- Beautiful UI with both auth methods
- Error handling
- Loading states
- OTP delivery confirmation

## Testing Locally

1. Make sure the dev server is running:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:5173`

3. Try both login methods:
   - **Gmail**: Quick OAuth flow
   - **Email OTP**: Check console/spam for OTP email (Supabase sends real emails)

## Troubleshooting

### Google OAuth not working
- ✅ Check if Google provider is enabled in Supabase
- ✅ Verify OAuth credentials are correct
- ✅ Ensure redirect URL matches exactly
- ✅ Check browser console for errors

### OTP email not received
- ✅ Check spam/junk folder
- ✅ Verify email provider is enabled in Supabase
- ✅ Wait a few seconds, emails can be slow
- ✅ Check email configuration in Supabase

### Session not persisting
- ✅ Browser localStorage is enabled
- ✅ Supabase session persistence is configured (already done)
- ✅ Check browser's Storage/Cookies in DevTools

## Security Notes

- ✅ Sessions are stored in browser localStorage (auto-refresh enabled)
- ✅ OTP tokens expire after 10 minutes
- ✅ All auth requests go through Supabase secure endpoints
- ✅ No sensitive data stored client-side

## Next Steps

1. Set up Google OAuth in Supabase (see Step 1 above)
2. Test Gmail login at `http://localhost:5173`
3. Deploy with your production URLs
4. Users can now securely log in!
