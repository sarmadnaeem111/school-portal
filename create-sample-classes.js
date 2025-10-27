// Script to create sample classes for testing
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAVTq89H0x_KzlgxiobbCGUhdnqICsBi48",
  authDomain: "customer-abe40.firebaseapp.com",
  projectId: "customer-abe40",
  storageBucket: "customer-abe40.firebasestorage.app",
  messagingSenderId: "566208631479",
  appId: "1:566208631479:web:540f9812eceb08690cb332",
  measurementId: "G-BKJVVKWWV2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sampleClasses = [
  {
    name: "Grade 10",
    grade: "10",
    section: "A",
    capacity: 30,
    teacherId: "",
    createdAt: new Date()
  },
  {
    name: "Grade 10",
    grade: "10", 
    section: "B",
    capacity: 30,
    teacherId: "",
    createdAt: new Date()
  },
  {
    name: "Grade 9",
    grade: "9",
    section: "A", 
    capacity: 30,
    teacherId: "",
    createdAt: new Date()
  },
  {
    name: "Grade 9",
    grade: "9",
    section: "B",
    capacity: 30,
    teacherId: "",
    createdAt: new Date()
  },
  {
    name: "Grade 8",
    grade: "8",
    section: "A",
    capacity: 30,
    teacherId: "",
    createdAt: new Date()
  },
  {
    name: "Grade 8", 
    grade: "8",
    section: "B",
    capacity: 30,
    teacherId: "",
    createdAt: new Date()
  }
];

async function createSampleClasses() {
  try {
    console.log('Creating sample classes...');
    
    for (const classData of sampleClasses) {
      const docRef = await addDoc(collection(db, 'classes'), classData);
      console.log(`Created class: ${classData.name} - ${classData.section} with ID: ${docRef.id}`);
    }
    
    console.log('Sample classes created successfully!');
    console.log('You can now use these classes when creating student accounts.');
    
  } catch (error) {
    console.error('Error creating sample classes:', error);
  }
}

createSampleClasses();
