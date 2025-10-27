// Simple script to add sample attendance records
// Run this in the browser console on your school portal

const addSampleAttendance = async () => {
  console.log('Adding sample attendance records...');
  
  // You need to replace 'YOUR_STUDENT_UID' with the actual student UID
  // You can find this in the browser console when viewing My Attendance
  const studentUid = 'YOUR_STUDENT_UID'; // Replace with actual student UID
  
  const sampleRecords = [
    {
      studentId: studentUid,
      studentName: 'abdullah', // Replace with actual student name
      classId: 'class1',
      className: 'Grade 8A',
      teacherId: 'teacher-uid-1',
      teacherName: 'sarmad naeem',
      date: '2024-01-10',
      status: 'present',
      time: '09:15:30 AM',
      remarks: '',
      createdAt: new Date('2024-01-10')
    },
    {
      studentId: studentUid,
      studentName: 'abdullah',
      classId: 'class1',
      className: 'Grade 8A',
      teacherId: 'teacher-uid-1',
      teacherName: 'sarmad naeem',
      date: '2024-01-11',
      status: 'present',
      time: '09:20:15 AM',
      remarks: '',
      createdAt: new Date('2024-01-11')
    },
    {
      studentId: studentUid,
      studentName: 'abdullah',
      classId: 'class1',
      className: 'Grade 8A',
      teacherId: 'teacher-uid-1',
      teacherName: 'sarmad naeem',
      date: '2024-01-12',
      status: 'absent',
      time: '09:25:45 AM',
      remarks: 'Sick leave',
      createdAt: new Date('2024-01-12')
    },
    {
      studentId: studentUid,
      studentName: 'abdullah',
      classId: 'class1',
      className: 'Grade 8A',
      teacherId: 'teacher-uid-1',
      teacherName: 'sarmad naeem',
      date: '2024-01-15',
      status: 'present',
      time: '09:10:20 AM',
      remarks: '',
      createdAt: new Date('2024-01-15')
    },
    {
      studentId: studentUid,
      studentName: 'abdullah',
      classId: 'class1',
      className: 'Grade 8A',
      teacherId: 'teacher-uid-1',
      teacherName: 'sarmad naeem',
      date: '2024-01-16',
      status: 'present',
      time: '09:18:30 AM',
      remarks: '',
      createdAt: new Date('2024-01-16')
    }
  ];

  try {
    // Import Firebase functions
    const { collection, addDoc } = await import('firebase/firestore');
    const { db } = await import('./src/firebase/config.js');
    
    // Add each record
    for (const record of sampleRecords) {
      await addDoc(collection(db, 'attendance'), record);
      console.log(`Added attendance for ${record.date} - ${record.status}`);
    }
    
    console.log('Sample attendance records added successfully!');
    console.log('Refresh your My Attendance page to see the new records.');
    
  } catch (error) {
    console.error('Error adding sample attendance:', error);
  }
};

// Instructions
console.log(`
=== Add Sample Attendance Records ===

To add sample attendance records:

1. First, get your student UID:
   - Go to My Attendance page
   - Open browser console (F12)
   - Look for the log: "Fetching attendance for student UID: [YOUR_UID]"
   - Copy that UID

2. Update the script:
   - Replace 'YOUR_STUDENT_UID' with your actual UID
   - Replace 'abdullah' with your actual name if different

3. Run the script:
   - Paste this entire script in the browser console
   - Press Enter to run it

4. Refresh the My Attendance page to see the new records

Current script is ready to run with placeholder values.
`);

// Uncomment the line below to run the script
// addSampleAttendance();
