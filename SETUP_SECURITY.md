# Security Setup Instructions

Follow these steps to secure your School Portal application.

## ⚠️ Important: You must complete these steps before deploying

### Step 1: Create `.env` File (Optional for Development, Required for Production)

**Note**: The app will work without a `.env` file in development (it uses fallback credentials), but for production, you should create one for better security.

1. Create a new file named `.env` in the root directory (same level as `package.json`)

2. Add your Firebase credentials:

```env
# Firebase Configuration
# Get these from Firebase Console > Project Settings > Your apps > Config

REACT_APP_FIREBASE_API_KEY=AIzaSyAVTq89H0x_KzlgxiobbCGUhdnqICsBi48
REACT_APP_FIREBASE_AUTH_DOMAIN=customer-abe40.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=customer-abe40
REACT_APP_FIREBASE_STORAGE_BUCKET=customer-abe40.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=566208631479
REACT_APP_FIREBASE_APP_ID=1:566208631479:web:540f9812eceb08690cb332
REACT_APP_FIREBASE_MEASUREMENT_ID=G-BKJVVKWWV2

# Cloudinary Configuration (Optional - only if using Cloudinary for file uploads)
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=school_portal
```

3. **Restart your development server** after creating the `.env` file:

```bash
npm start
```

### Step 2: Deploy Firestore Security Rules

The security rules are documented in `FIRESTORE_STRUCTURE.md`. You must deploy them to Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (customer-abe40)
3. Go to **Firestore Database** > **Rules** tab
4. Copy the security rules from `FIRESTORE_STRUCTURE.md` (lines 173-252)
5. Paste into the rules editor
6. Click **Publish**

The security rules prevent unauthorized access to your database.

### Step 3: Configure Firebase Storage Security Rules

1. In Firebase Console, go to **Storage** > **Rules**
2. Add these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }
  }
}
```

3. Click **Publish**

### Step 4: Enable App Check (Recommended)

App Check adds an additional layer of security:

1. In Firebase Console, go to **App Check**
2. Click **Get Started**
3. For web apps, select **reCAPTCHA Enterprise**
4. Follow the setup wizard
5. Register your app domain

### Step 5: Test the Security Features

After setup, test that everything works:

1. **Try to register with a weak password** - Should show validation errors
2. **Try to login 6+ times with wrong password** - Should show rate limit after 5 attempts
3. **Login successfully** - Should work normally
4. **Wait 30 minutes without activity** - Should auto-logout

### Step 6: Deploy to Production

When deploying to production:

1. **Use environment variables** on your hosting platform
2. **Ensure HTTPS is enforced**
3. **Enable Firebase App Check**
4. **Monitor for suspicious activity**

### Common Issues

#### "Missing required environment variables" error
- Make sure you created the `.env` file in the root directory
- Restart your development server after creating `.env`
- Check that all REACT_APP_ variables are set

#### "Permission denied" errors
- Make sure Firestore security rules are deployed
- Check that your user has the correct role in the database
- Verify the security rules match the current database structure

#### Rate limiting too strict
- Default is 5 login attempts per 15 minutes
- Adjust in `src/contexts/AuthContext.js` line 121
- Change `5` to your desired number

#### Password too strict
- Default requirements: 8+ chars, uppercase, lowercase, number, special char
- Adjust in `src/utils/validation.js` function `validatePassword`

### Security Notes

✅ **DO**:
- Keep your `.env` file secret
- Deploy Firestore security rules
- Use strong passwords
- Monitor for suspicious activity
- Keep dependencies updated

❌ **DON'T**:
- Commit `.env` to version control (already in `.gitignore`)
- Share Firebase credentials publicly
- Disable security rules for debugging
- Use weak passwords
- Ignore security warnings

### Need Help?

- Check `SECURITY.md` for detailed security documentation
- Review `FIRESTORE_STRUCTURE.md` for database structure
- Contact the development team for support

---

**After completing these steps, your application will be significantly more secure!**

