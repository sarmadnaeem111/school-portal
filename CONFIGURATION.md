# Configuration Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id

# App Configuration
REACT_APP_APP_NAME=School Portal
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development
```

## Firebase Setup Steps

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Follow the setup wizard

2. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
   - Save changes

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location

4. **Set up Firebase Storage**
   - Go to Storage
   - Click "Get started"
   - Choose "Start in test mode"
   - Select a location

5. **Get Firebase Configuration**
   - Go to Project Settings > General
   - Scroll down to "Your apps"
   - Click "Add app" > Web
   - Copy the configuration object

6. **Update Firebase Config**
   - Open `src/firebase/config.js`
   - Replace the placeholder values with your Firebase config

## Security Rules Setup

1. **Firestore Security Rules**
   - Go to Firestore Database > Rules
   - Copy the rules from `FIRESTORE_STRUCTURE.md`
   - Paste and publish

2. **Storage Security Rules**
   - Go to Storage > Rules
   - Add the following rules:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## Firestore Indexes

Create the following composite indexes in Firestore:

1. **attendance**: `studentId` + `date` (descending)
2. **attendance**: `classId` + `date` (descending)
3. **attendance**: `teacherId` + `date` (descending)
4. **grades**: `studentId` + `createdAt` (descending)
5. **grades**: `subjectId` + `createdAt` (descending)
6. **grades**: `teacherId` + `createdAt` (descending)
7. **messages**: `parentId` + `createdAt` (descending)
8. **messages**: `teacherId` + `createdAt` (descending)
9. **studyMaterials**: `subjectId` + `createdAt` (descending)
10. **studyMaterials**: `teacherId` + `createdAt` (descending)
11. **announcements**: `targetAudience` + `createdAt` (descending)

## Sample Data

Run the setup script to create sample data:

```bash
node setup-sample-data.js
```

This will create:
- Sample admin user (admin@school.com / admin123)
- Sample teacher user (teacher@school.com / teacher123)
- Sample parent user (parent@school.com / parent123)
- Sample student user (student@school.com / student123)
- Sample class and subject
- Sample announcement

## Testing

1. **Start the development server**
   ```bash
   npm start
   ```

2. **Test login with sample credentials**
   - Admin: admin@school.com / admin123
   - Teacher: teacher@school.com / teacher123
   - Parent: parent@school.com / parent123
   - Student: student@school.com / student123

3. **Test features**
   - Admin: Create users, classes, subjects
   - Teacher: Mark attendance, upload grades
   - Parent: View child's progress
   - Student: View grades and materials

## Troubleshooting

### Common Issues

1. **Firebase Configuration Error**
   - Check if all Firebase config values are correct
   - Ensure Firebase project is active

2. **Authentication Issues**
   - Verify Email/Password provider is enabled
   - Check if user exists in Firebase Auth

3. **Firestore Permission Denied**
   - Review security rules
   - Check if user is authenticated

4. **File Upload Issues**
   - Verify Storage rules
   - Check file size limits

### Debug Mode

Enable debug mode by adding to `.env.local`:
```bash
REACT_APP_DEBUG=true
```

This will show additional console logs for debugging.
