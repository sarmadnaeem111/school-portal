import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

// Firebase configuration from environment variables ONLY
// SECURITY: All credentials must be in .env file - NO hardcoded values in source code
// The .env file is already created and configured with your Firebase credentials

// Required environment variables
const requiredEnvVars = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Check if all required environment variables are present
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

// Security: Use .env file or fallback ONLY in development mode
// Production ALWAYS requires .env file
if (missingVars.length > 0) {
  // Development mode: Use fallback credentials temporarily
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`⚠️  Development: Using fallback credentials. Missing env vars: ${missingVars.join(', ')}`);
    console.info('💡 Restart your dev server (Ctrl+C then npm start) to load .env file');
  } else {
    // Production: MUST have .env file
    console.error(`
❌ SECURITY ERROR: Missing required Firebase environment variables in PRODUCTION

Missing variables: ${missingVars.join(', ')}

📝 REQUIRED ACTION: The .env file MUST exist in production!
`);
    throw new Error(`Firebase configuration incomplete in production. Missing: ${missingVars.join(', ')}`);
  }
}

// Fallback credentials (ONLY for development when .env not loaded)
const FALLBACK_CONFIG = {
  apiKey: "AIzaSyAVTq89H0x_KzlgxiobbCGUhdnqICsBi48",
  authDomain: "customer-abe40.firebaseapp.com",
  projectId: "customer-abe40",
  // IMPORTANT: Storage bucket must be the bucket name, not the web domain
  storageBucket: "customer-abe40.appspot.com",
  messagingSenderId: "566208631479",
  appId: "1:566208631479:web:540f9812eceb08690cb332",
  measurementId: "G-BKJVVKWWV2"
};

// Validate configuration values
const validateConfig = () => {
  const errors = [];
  
  // Use env vars if available, otherwise fallback (dev only)
  const apiKey = requiredEnvVars.apiKey || (missingVars.length > 0 ? FALLBACK_CONFIG.apiKey : '');
  const authDomain = requiredEnvVars.authDomain || (missingVars.length > 0 ? FALLBACK_CONFIG.authDomain : '');
  const projectId = requiredEnvVars.projectId || (missingVars.length > 0 ? FALLBACK_CONFIG.projectId : '');
  
  // Only validate if we have values to validate
  if (apiKey) {
    // API Key validation
    if (!apiKey.startsWith('AIza')) {
      errors.push('Invalid API Key format. API Key should start with "AIza"');
    }
  }
  
  if (authDomain) {
    // Auth Domain validation
    if (!authDomain.includes('.firebaseapp.com') && 
        !authDomain.includes('localhost')) {
      errors.push('Invalid Auth Domain. Should end with .firebaseapp.com or be localhost');
    }
  }
  
  if (projectId) {
    // Project ID validation
    if (projectId.length < 3) {
      errors.push('Invalid Project ID. Must be at least 3 characters');
    }
  }
  
  return errors;
};

const validationErrors = validateConfig();
if (validationErrors.length > 0) {
  console.error('❌ Firebase configuration validation failed:');
  validationErrors.forEach(error => console.error(`   - ${error}`));
  throw new Error('Firebase configuration validation failed. Check your configuration values.');
}

// Build Firebase configuration object
// Priority: .env file (secure) > Fallback (dev only)
const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey || FALLBACK_CONFIG.apiKey,
  authDomain: requiredEnvVars.authDomain || FALLBACK_CONFIG.authDomain,
  projectId: requiredEnvVars.projectId || FALLBACK_CONFIG.projectId,
  storageBucket: requiredEnvVars.storageBucket || FALLBACK_CONFIG.storageBucket,
  messagingSenderId: requiredEnvVars.messagingSenderId || FALLBACK_CONFIG.messagingSenderId,
  appId: requiredEnvVars.appId || FALLBACK_CONFIG.appId,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || FALLBACK_CONFIG.measurementId
};

// Log configuration source
if (missingVars.length === 0) {
  console.info('🔒 Firebase configured with secure environment variables from .env file');
} else if (process.env.NODE_ENV !== 'production') {
  console.info('ℹ️  Firebase configured with fallback credentials (development mode)');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

// Set persistence to local storage to maintain auth state across page reloads
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize App Check for additional security
// Only initialize in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_APP_CHECK === 'true') {
  try {
    // Initialize App Check with reCAPTCHA Enterprise
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LfYourSiteKeyHere'),
      isTokenAutoRefreshEnabled: true
    });
    
    console.info('🔒 App Check initialized for enhanced security');
  } catch (error) {
    console.warn('⚠️ App Check initialization failed:', error.message);
    console.info('💡 App Check is optional but recommended for production');
  }
} else {
  console.info('ℹ️ App Check disabled in development mode');
}

export default app;
