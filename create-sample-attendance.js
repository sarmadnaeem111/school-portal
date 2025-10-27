const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase configuration
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

const createSampleAttendance = async () => {
  console.log('Creating sample attendance records...');
  
  try {
    // You'll need to replace these with actual student UIDs from your database
    const sampleStudents = [
      { uid: 'student-uid-1', name: 'John Doe', classId: 'class-1', className: 'Grade 8A' },
      { uid: 'student-uid-2', name: 'Jane Smith', classId: 'class-1', className: 'Grade 8A' },
      { uid: 'student-uid-3', name: 'Mike Johnson', classId: 'class-1', className: 'Grade 8A' }
    ];

    const teachers = [
      { uid: 'teacher-uid-1', name: 'Mr. Smith' },
      { uid: 'teacher-uid-2', name: 'Ms. Johnson' }
    ];

    // Create attendance records for the past 30 days
    const today = new Date();
    const attendanceRecords = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const dateString = date.toISOString().split('T')[0];
      
      for (const student of sampleStudents) {
        // Randomly assign present/absent (80% present rate)
        const isPresent = Math.random() > 0.2;
        const status = isPresent ? 'present' : 'absent';
        
        // Random teacher
        const teacher = teachers[Math.floor(Math.random() * teachers.length)];
        
        attendanceRecords.push({
          studentId: student.uid,
          studentName: student.name,
          classId: student.classId,
          className: student.className,
          teacherId: teacher.uid,
          teacherName: teacher.name,
          date: dateString,
          status: status,
          time: `${Math.floor(Math.random() * 3) + 8}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} AM`,
          remarks: status === 'absent' ? 'Sick leave' : '',
          createdAt: new Date()
        });
      }
    }

    // Add attendance records to Firestore
    for (const record of attendanceRecords) {
      await addDoc(collection(db, 'attendance'), record);
      console.log(`Added attendance for ${record.studentName} on ${record.date} - ${record.status}`);
    }

    console.log(`Successfully created ${attendanceRecords.length} attendance records!`);
    console.log('Sample attendance records created for testing.');
    
  } catch (error) {
    console.error('Error creating sample attendance:', error);
  }
};

// Instructions for the user
console.log(`
=== Sample Attendance Records Creator ===

This script will create sample attendance records for testing.

IMPORTANT: Before running this script, you need to:

1. Get actual student UIDs from your Firestore database
2. Update the sampleStudents array with real student UIDs
3. Update the teachers array with real teacher UIDs

To get student UIDs:
1. Go to your Firestore console
2. Open the 'users' collection
3. Find students and copy their document IDs (which are their UIDs)
4. Replace the sample UIDs in this script

To run this script:
node create-sample-attendance.js

The script will create 30 days of sample attendance data.
`);

// Uncomment the line below to run the script
// createSampleAttendance();
