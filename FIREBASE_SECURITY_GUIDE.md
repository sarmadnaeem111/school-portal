# Firebase Console Security Setup Guide

This guide will help you secure your Firebase project by implementing additional security measures in the Firebase Console.

## 🔒 Critical Security Steps

### 1. API Key Restrictions ⚠️ CRITICAL

**Why**: Unrestricted API keys can be abused for authentication and database attacks.

**Steps**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `customer-abe40`
3. Navigate to **APIs & Services** → **Credentials**
4. Find your API key: `AIzaSyAVTq89H0x_KzlgxiobbCGUhdnqICsBi48`
5. Click on the API key to edit it
6. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Click **Add an item**
   - Add your domain: `http://localhost:3000`
   - Add your production domain: `https://yourdomain.com`
   - Add: `http://localhost:3000/*`
7. Under **API restrictions**:
   - Select **Restrict key**
   - Enable only these APIs:
     - Firebase Authentication API
     - Cloud Firestore API
     - Firebase Storage API
     - Identity Toolkit API
8. Click **Save**

### 2. Firebase App Check 🔐

**Why**: Prevents bots and unauthorized clients from accessing your backend.

**Steps**:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `customer-abe40`
3. Go to **App Check** in the left menu
4. Click **Register apps**
5. Select your web app
6. Choose **reCAPTCHA Enterprise**
7. Follow the setup wizard
8. Enable App Check for:
   - Cloud Firestore
   - Firebase Storage
   - Firebase Authentication

### 3. Firestore Security Rules ⚠️ CRITICAL

**Why**: Prevents unauthorized access to your database.

**Steps**:
1. Go to **Firestore Database** → **Rules**
2. Copy the rules from `FIRESTORE_STRUCTURE.md` (lines 173-252)
3. Paste into the rules editor
4. Click **Publish**
5. Test the rules using the simulator

**Important Rules**:
```javascript
// Users can only read/write their own data
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Admin can access all
match /users/{userId} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// Teachers can only read students
match /users/{userId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher' &&
    resource.data.role == 'student';
}
```

### 4. Firebase Storage Security Rules ⚠️ CRITICAL

**Why**: Prevents unauthorized file uploads and access.

**Steps**:
1. Go to **Storage** → **Rules**
2. Add these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Only authenticated users can read files
    match /{allPaths=**} {
      allow read: if request.auth != null;
      
      // Only authenticated users can write
      // File size limit: 10MB
      allow write: if request.auth != null 
        && request.resource.size < 10 * 1024 * 1024
        && request.auth.token.role in ['admin', 'teacher'];
    }
    
    // Public announcements folder (read-only for all authenticated users)
    match /announcements/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && request.auth.token.role == 'admin';
    }
    
    // Study materials folder
    match /studyMaterials/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && request.auth.token.role in ['admin', 'teacher'];
    }
  }
}
```

3. Click **Publish**

### 5. Enable Authentication Methods

**Why**: Control which authentication methods are available.

**Steps**:
1. Go to **Authentication** → **Sign-in method**
2. Enable only **Email/Password** (already enabled)
3. Optional: Enable **Google** or **Microsoft** for multi-provider authentication
4. Configure **Authorized domains**:
   - `localhost` (for development)
   - Your production domain
   - Remove any unused domains

### 6. Set Up Authentication Email Templates

**Why**: Secure email templates for password reset, etc.

**Steps**:
1. Go to **Authentication** → **Templates**
2. Customize **Email address verification**:
   - Use your branding
   - Include security warnings
3. Customize **Password reset**:
   - Use your branding
   - Include security warnings

### 7. Configure Project Settings

**Steps**:
1. Go to **Project Settings** → **General**
2. Set **Support email** to your school email
3. Add **Public-facing name** if desired
4. Under **Public settings**:
   - Add authorized domains
   - Configure analytics (optional)

### 8. Enable Cloud Logging and Monitoring

**Why**: Track suspicious activity and monitor usage.

**Steps**:
1. Go to **Firebase Console** → **Project Overview**
2. Enable **Cloud Logging**
3. Set up **Alerts** for:
   - Unusual authentication activity
   - Database read/write spikes
   - Storage usage spikes

### 9. Configure OAuth Consent Screen (if using Google Sign-In)

**Steps**:
1. Go to **Project Settings** → **OAuth consent screen**
2. Configure:
   - App name: Your School Portal
   - User support email: Your email
   - Authorized domains: Your domains
   - Scopes: Only necessary scopes

### 10. Set Up Backup and Recovery

**Steps**:
1. Go to **Firestore Database** → **Backups**
2. Enable **Automatic backups**
3. Set backup schedule:
   - Frequency: Daily
   - Retention: 30 days
4. Enable **Export** to Google Cloud Storage

## 🔍 Security Monitoring

### Enable Security Rules Simulator
1. Go to **Firestore** → **Rules**
2. Use the **Rules Playground** to test:
   - Unauthorized reads
   - Unauthorized writes
   - Role-based access

### Set Up Alerts
1. Go to **Google Cloud Console**
2. Navigate to **Monitoring** → **Alerting**
3. Create alerts for:
   - Unusual authentication activity
   - Failed login attempts
   - Database read/write spikes
   - Storage usage

## 🚨 Security Checklist

Complete these steps to fully secure your Firebase project:

- [ ] Restricted API Key to specific HTTP referrers
- [ ] Restricted API Key to required APIs only
- [ ] Enabled App Check for all services
- [ ] Deployed Firestore security rules from `FIRESTORE_STRUCTURE.md`
- [ ] Deployed Storage security rules (see above)
- [ ] Configured Authorized domains
- [ ] Set up email templates
- [ ] Enabled Cloud Logging
- [ ] Set up monitoring alerts
- [ ] Enabled automatic backups
- [ ] Tested security rules with simulator

## 📊 Security Best Practices

1. **Regular Audits**: Review security rules quarterly
2. **Monitor Usage**: Check for unusual spikes or patterns
3. **Update Dependencies**: Keep Firebase SDK updated
4. **Test Rules**: Use Rules Playground before deploying
5. **Backup Data**: Regular exports to Cloud Storage
6. **Limit Access**: Only grant necessary permissions
7. **Monitor Logs**: Review authentication and access logs
8. **Document Changes**: Keep track of security rule changes

## 🔐 Additional Security Measures

### Environment-Specific Configuration
- Development: Use separate Firebase project or emulators
- Staging: Use production project with test data
- Production: Use restricted API keys and full security measures

### API Key Rotation
- Rotate API keys annually or when compromised
- Update `.env` file with new key
- Test thoroughly after rotation

### Firestore Security Rules Testing
```javascript
// Test Cases:
// 1. Unauthenticated user cannot read/write anything
// 2. User can only access their own data
// 3. Admin can access all data
// 4. Teacher can read students but not write
// 5. Student can read their own grades/attendance
```

## 📚 Resources

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [App Check Documentation](https://firebase.google.com/docs/app-check)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys#securing_an_api_key)
- [Firebase Security Guide](https://firebase.google.com/support/guides/security-best-practices)

## 🆘 If You Suspect a Security Breach

1. **Immediately** rotate API keys
2. Review Firebase logs for unauthorized access
3. Check Firestore/Storage rules for vulnerabilities
4. Review authentication logs
5. Update security rules if needed
6. Notify affected users
7. Document the incident

---

**Remember**: Security is an ongoing process. Review and update these settings regularly.

**Last Updated**: Current Date
**Maintained By**: Development Team

