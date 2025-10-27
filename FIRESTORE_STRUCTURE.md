# School Portal - Firestore Database Structure

This document outlines the complete Firestore database structure for the School Portal application.

## Collections Overview

### 1. Users Collection (`users`)
Stores all user information including students, teachers, parents, and admins.

```javascript
{
  uid: string,           // Firebase Auth UID
  email: string,         // User email
  name: string,          // Full name
  role: string,          // 'admin', 'teacher', 'parent', 'student'
  phone: string,         // Phone number
  address: string,       // Address
  createdAt: timestamp,  // Account creation date
  
  // Student specific fields
  rollNumber: string,    // Student roll number
  classId: string,      // Reference to class
  parentId: string,     // Reference to parent user
  
  // Teacher specific fields
  subjects: array,      // Array of subject IDs
  classes: array,       // Array of class IDs
  
  // Parent specific fields
  children: array,      // Array of student IDs
}
```

### 2. Classes Collection (`classes`)
Stores class/section information.

```javascript
{
  name: string,         // Class name (e.g., "Grade 10")
  grade: string,         // Grade level
  section: string,      // Section (e.g., "A", "B")
  capacity: number,     // Maximum students
  teacherId: string,    // Class teacher UID
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. Subjects Collection (`subjects`)
Stores subject information and teacher assignments.

```javascript
{
  name: string,         // Subject name
  code: string,         // Subject code (e.g., "MATH101")
  classId: string,     // Reference to class
  teacherId: string,   // Assigned teacher UID
  teacherName: string, // Teacher name (denormalized)
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4. Attendance Collection (`attendance`)
Stores daily attendance records.

```javascript
{
  studentId: string,    // Student UID
  studentName: string,  // Student name (denormalized)
  classId: string,      // Class reference
  className: string,    // Class name (denormalized)
  teacherId: string,    // Teacher UID
  teacherName: string,  // Teacher name (denormalized)
  date: string,         // Date in YYYY-MM-DD format
  status: string,       // 'present' or 'absent'
  time: string,         // Time when marked
  remarks: string,      // Optional remarks
  createdAt: timestamp
}
```

### 5. Grades Collection (`grades`)
Stores student grades and exam results.

```javascript
{
  studentId: string,    // Student UID
  subjectId: string,    // Subject reference
  subjectName: string,  // Subject name (denormalized)
  examType: string,     // 'quiz', 'assignment', 'midterm', 'final', 'project'
  marks: number,        // Obtained marks
  maxMarks: number,    // Maximum marks
  percentage: number,   // Calculated percentage
  grade: string,        // Letter grade (A+, A, B, C, D)
  remarks: string,      // Teacher remarks
  teacherId: string,    // Teacher UID
  teacherName: string,  // Teacher name (denormalized)
  createdAt: timestamp
}
```

### 6. Study Materials Collection (`studyMaterials`)
Stores uploaded study materials and homework.

```javascript
{
  title: string,        // Material title
  description: string,  // Description
  subjectId: string,   // Subject reference
  subjectName: string,  // Subject name (denormalized)
  materialType: string, // 'homework', 'notes', 'assignment', 'exam'
  fileUrl: string,     // Firebase Storage URL
  fileName: string,    // Original file name
  teacherId: string,   // Teacher UID
  teacherName: string, // Teacher name (denormalized)
  createdAt: timestamp
}
```

### 7. Messages Collection (`messages`)
Stores communication between teachers and parents.

```javascript
{
  teacherId: string,    // Teacher UID
  teacherName: string,  // Teacher name (denormalized)
  parentId: string,     // Parent UID
  parentName: string,   // Parent name (denormalized)
  subject: string,      // Message subject
  message: string,      // Message content
  priority: string,    // 'normal', 'medium', 'high'
  status: string,      // 'sent', 'delivered', 'read'
  read: boolean,       // Read status
  createdAt: timestamp
}
```

### 8. Announcements Collection (`announcements`)
Stores school announcements and notices.

```javascript
{
  title: string,        // Announcement title
  content: string,      // Announcement content
  priority: string,     // 'normal', 'medium', 'high'
  targetAudience: string, // 'all', 'students', 'parents', 'teachers'
  fileUrl: string,     // Optional attachment URL
  fileName: string,    // Optional attachment name
  createdBy: string,   // Creator UID (usually admin)
  createdAt: timestamp
}
```

## Indexes Required

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

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin can read/write all users
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Teachers can read students in their classes
    match /users/{userId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher' &&
        resource.data.role == 'student';
    }
    
    // Parents can read their children's data
    match /users/{userId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'parent' &&
        resource.data.parentId == request.auth.uid;
    }
    
    // Classes - Admin and teachers can read/write
    match /classes/{classId} {
      allow read, write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'teacher']);
    }
    
    // Subjects - Admin and teachers can read/write
    match /subjects/{subjectId} {
      allow read, write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'teacher']);
    }
    
    // Attendance - Teachers can write, all authenticated users can read
    match /attendance/{attendanceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'teacher'];
    }
    
    // Grades - Teachers can write, students and parents can read
    match /grades/{gradeId} {
      allow read: if request.auth != null && 
        (resource.data.studentId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'teacher', 'parent']);
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'teacher'];
    }
    
    // Study Materials - Teachers can write, students can read
    match /studyMaterials/{materialId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'teacher'];
    }
    
    // Messages - Teachers and parents can read/write
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        (resource.data.teacherId == request.auth.uid || 
         resource.data.parentId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Announcements - Admin can write, all authenticated users can read
    match /announcements/{announcementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Sample Data

### Sample Users
```javascript
// Admin User
{
  uid: "admin123",
  email: "admin@school.com",
  name: "School Administrator",
  role: "admin",
  phone: "+1234567890",
  address: "123 School St",
  createdAt: "2024-01-01T00:00:00Z"
}

// Teacher User
{
  uid: "teacher123",
  email: "teacher@school.com",
  name: "John Smith",
  role: "teacher",
  phone: "+1234567891",
  address: "456 Teacher Ave",
  createdAt: "2024-01-01T00:00:00Z"
}

// Student User
{
  uid: "student123",
  email: "student@school.com",
  name: "Jane Doe",
  role: "student",
  phone: "+1234567892",
  address: "789 Student Rd",
  rollNumber: "S001",
  classId: "class123",
  parentId: "parent123",
  createdAt: "2024-01-01T00:00:00Z"
}

// Parent User
{
  uid: "parent123",
  email: "parent@school.com",
  name: "Bob Doe",
  role: "parent",
  phone: "+1234567893",
  address: "789 Student Rd",
  createdAt: "2024-01-01T00:00:00Z"
}
```

### Sample Class
```javascript
{
  name: "Grade 10",
  grade: "10",
  section: "A",
  capacity: 30,
  teacherId: "teacher123",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

### Sample Subject
```javascript
{
  name: "Mathematics",
  code: "MATH101",
  classId: "class123",
  teacherId: "teacher123",
  teacherName: "John Smith",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

## Best Practices

1. **Denormalization**: Store frequently accessed data like names and IDs to reduce reads
2. **Indexing**: Create composite indexes for efficient queries
3. **Security**: Implement proper security rules for data access
4. **Data Validation**: Validate data on both client and server side
5. **Backup**: Regular backups of critical data
6. **Monitoring**: Monitor database usage and performance
7. **Scalability**: Design for future growth and scaling

## Migration Scripts

For initial setup, you can use the following scripts to create sample data:

```javascript
// Initialize sample data
const initializeSampleData = async () => {
  // Create sample classes
  await addDoc(collection(db, 'classes'), {
    name: 'Grade 10',
    grade: '10',
    section: 'A',
    capacity: 30,
    teacherId: 'teacher123',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Create sample subjects
  await addDoc(collection(db, 'subjects'), {
    name: 'Mathematics',
    code: 'MATH101',
    classId: 'class123',
    teacherId: 'teacher123',
    teacherName: 'John Smith',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Add more sample data as needed
};
```

This database structure provides a solid foundation for the School Portal application with proper security, scalability, and performance considerations.
