import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getSecureErrorMessage, rateLimiter, generateRateLimitKey, startSessionTimer, clearSessionTimer } from '../utils/security';
import { validateUserData, sanitizeInput } from '../utils/validation';
import { signOut as authSignOut } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to get parent UID from email
  const getParentUidFromEmail = async (parentEmail) => {
    if (!parentEmail) return null;
    
    try {
      const usersQuery = query(collection(db, 'users'), where('email', '==', parentEmail), where('role', '==', 'parent'));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        throw new Error(`Parent with email ${parentEmail} not found`);
      }
      
      const parentDoc = usersSnapshot.docs[0];
      return parentDoc.id; // This is the UID
    } catch (error) {
      console.error('Error finding parent:', error);
      throw error;
    }
  };

  // Sign up function
  const signup = async (email, password, userData) => {
    try {
      // Rate limiting
      const rateKey = generateRateLimitKey('signup', email);
      if (!rateLimiter.isAllowed(rateKey, 3, 10 * 60 * 1000)) {
        throw new Error('Too many signup attempts. Please try again later.');
      }

      // Validate user data
      const sanitizedData = {
        ...userData,
        name: sanitizeInput(userData.name),
        email: email.trim().toLowerCase(),
        phone: userData.phone ? sanitizeInput(userData.phone) : '',
        address: userData.address ? sanitizeInput(userData.address) : '',
        rollNumber: userData.rollNumber ? sanitizeInput(userData.rollNumber) : ''
      };

      const validation = validateUserData(sanitizedData, userData.role);
      if (!validation.valid) {
        const errorMsg = Object.values(validation.errors).join(', ');
        throw new Error(errorMsg);
      }

      const result = await createUserWithEmailAndPassword(auth, sanitizedData.email, password);
      
      // Update user profile
      await updateProfile(result.user, {
        displayName: sanitizedData.name
      });

      // Keep parent email as provided (do not resolve to UID)
      let processedUserData = { ...sanitizedData };

      // Save user data to Firestore
      const userDocData = {
        uid: result.user.uid,
        email: sanitizedData.email,
        name: sanitizedData.name,
        role: sanitizedData.role,
        gender: processedUserData.gender || '',
        phone: processedUserData.phone || '',
        address: processedUserData.address || '',
        ...processedUserData,
        createdAt: new Date()
      };
      
      await setDoc(doc(db, 'users', result.user.uid), userDocData);

      // Reset rate limit on success
      rateLimiter.reset(rateKey);

      // Return result with user data for image upload
      return { ...result, userData: userDocData };
    } catch (error) {
      throw new Error(getSecureErrorMessage(error));
    }
  };

  // Sign in function
  const signin = async (email, password) => {
    try {
      // Rate limiting
      const sanitizedEmail = email.trim().toLowerCase();
      const rateKey = generateRateLimitKey('signin', sanitizedEmail);
      
      if (!rateLimiter.isAllowed(rateKey, 5, 15 * 60 * 1000)) {
        throw new Error('Too many login attempts. Please try again in 15 minutes.');
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
        throw new Error('Please enter a valid email address.');
      }

      const result = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
      
      // Reset rate limit on success
      rateLimiter.reset(rateKey);
      
      return result;
    } catch (error) {
      throw new Error(getSecureErrorMessage(error));
    }
  };

  // Sign out function
  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
    } catch (error) {
      throw error;
    }
  };

  // Get user role from Firestore with retry mechanism
  const getUserRole = async (uid, retryCount = 0) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        return role;
      }
      
      // Retry once if document not found (might be a timing issue)
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return getUserRole(uid, 1);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user role');
      return null;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const role = await getUserRole(user.uid);
          
          if (role) {
            setUserRole(role);
            // Start session timer on successful login
            startSessionTimer(async () => {
              try {
                await authSignOut(auth);
              } catch (error) {
                console.error('Session timeout logout failed');
              }
            });
          } else {
            setUserRole(null);
          }
        } catch (error) {
          setUserRole(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        // Clear session timer on logout
        clearSessionTimer();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    signup,
    signin,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
