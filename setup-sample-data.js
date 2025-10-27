// Firebase Setup Script
// Run this script to initialize sample data in your Firestore database

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// Replace with your Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize sample data
const initializeSampleData = async () => {
  try {
    console.log('Starting sample data initialization...');

    // Create sample admin user
    const adminUser = await createUserWithEmailAndPassword(auth, 'admin@school.com', 'admin123');
    await updateProfile(adminUser.user, { displayName: 'School Administrator' });
    
    await addDoc(collection(db, 'users'), {
      uid: adminUser.user.uid,
      email: 'admin@school.com',
      name: 'School Administrator',
      role: 'admin',
      phone: '+1234567890',
      address: '123 School St',
      createdAt: new Date()
    });

    // Create sample teacher user
    const teacherUser = await createUserWithEmailAndPassword(auth, 'teacher@school.com', 'teacher123');
    await updateProfile(teacherUser.user, { displayName: 'John Smith' });
    
    await addDoc(collection(db, 'users'), {
      uid: teacherUser.user.uid,
      email: 'teacher@school.com',
      name: 'John Smith',
      role: 'teacher',
      phone: '+1234567891',
      address: '456 Teacher Ave',
      createdAt: new Date()
    });

    // Create sample parent user
    const parentUser = await createUserWithEmailAndPassword(auth, 'parent@school.com', 'parent123');
    await updateProfile(parentUser.user, { displayName: 'Bob Doe' });
    
    await addDoc(collection(db, 'users'), {
      uid: parentUser.user.uid,
      email: 'parent@school.com',
      name: 'Bob Doe',
      role: 'parent',
      phone: '+1234567893',
      address: '789 Student Rd',
      createdAt: new Date()
    });

    // Create sample student user
    const studentUser = await createUserWithEmailAndPassword(auth, 'student@school.com', 'student123');
    await updateProfile(studentUser.user, { displayName: 'Jane Doe' });
    
    await addDoc(collection(db, 'users'), {
      uid: studentUser.user.uid,
      email: 'student@school.com',
      name: 'Jane Doe',
      role: 'student',
      phone: '+1234567892',
      address: '789 Student Rd',
      rollNumber: 'S001',
      classId: 'class123',
      parentId: parentUser.user.uid,
      createdAt: new Date()
    });

    // Create sample class
    const classDoc = await addDoc(collection(db, 'classes'), {
      name: 'Grade 10',
      grade: '10',
      section: 'A',
      capacity: 30,
      teacherId: teacherUser.user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create sample subject
    await addDoc(collection(db, 'subjects'), {
      name: 'Mathematics',
      code: 'MATH101',
      classId: classDoc.id,
      teacherId: teacherUser.user.uid,
      teacherName: 'John Smith',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create sample announcement
    await addDoc(collection(db, 'announcements'), {
      title: 'Welcome to School Portal',
      content: 'Welcome to our new school portal system. This system will help manage all school activities efficiently.',
      priority: 'normal',
      targetAudience: 'all',
      createdBy: 'admin',
      createdAt: new Date()
    });

    console.log('Sample data initialization completed successfully!');
    console.log('Default login credentials:');
    console.log('Admin: admin@school.com / admin123');
    console.log('Teacher: teacher@school.com / teacher123');
    console.log('Parent: parent@school.com / parent123');
    console.log('Student: student@school.com / student123');

  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};

// Run the initialization
initializeSampleData();
