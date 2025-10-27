# School Portal Web Application

A comprehensive school management system built with React.js and Firebase, featuring role-based access for administrators, teachers, parents, and students.

## 🚀 Features

### 👑 Admin Module
- **Dashboard**: Overview with summary cards showing total students, teachers, parents, classes, and attendance statistics
- **User Management**: Add, update, and remove teachers, parents, and students
- **Class Management**: Create class sections, subjects, and assign teachers
- **Attendance Reports**: View detailed attendance reports and statistics
- **Announcements**: Upload school notices and announcements with file attachments

### 👩‍🏫 Teacher Module
- **Dashboard**: Overview of assigned classes and subjects
- **Class Management**: View assigned classes and subjects
- **Attendance**: Mark daily attendance for students
- **Grade Management**: Upload grades and exam results
- **Study Materials**: Upload homework, notes, and assignments
- **Parent Communication**: Send messages to parents

### 👨‍👩‍👧 Parent Module
- **Dashboard**: Overview of child's performance and attendance
- **Child Progress**: Detailed view of grades and academic performance
- **Attendance**: Monitor child's attendance records
- **Communication**: Receive and send messages to teachers
- **Announcements**: View school announcements and events

### 🎓 Student Module
- **Dashboard**: Personal overview with grades and attendance
- **My Grades**: View all grades and exam results
- **My Attendance**: Check personal attendance records
- **Study Materials**: Download homework and study materials
- **Announcements**: View school announcements and events

## 🛠️ Technology Stack

- **Frontend**: React.js 19.2.0 with functional components and hooks
- **Routing**: React Router v6 with protected routes
- **UI Framework**: Bootstrap 5 with React Bootstrap components
- **Backend**: Firebase
  - **Authentication**: Firebase Auth (Email/Password)
  - **Database**: Firestore
  - **Storage**: Firebase Storage for file uploads
- **Icons**: Font Awesome
- **State Management**: React Context API

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd school-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Set up Firebase Storage
   - Copy your Firebase configuration to `src/firebase/config.js`

4. **Configure Firebase**
   Update `src/firebase/config.js` with your Firebase configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

5. **Set up Firestore Security Rules**
   Copy the security rules from `FIRESTORE_STRUCTURE.md` to your Firebase console

6. **Create Firestore Indexes**
   Create the composite indexes listed in `FIRESTORE_STRUCTURE.md`

7. **Start the development server**
   ```bash
   npm start
   ```

## 🔐 User Roles and Access

### Admin
- Full access to all modules
- Can manage users, classes, and subjects
- Can view all reports and statistics
- Can create announcements

### Teacher
- Access to assigned classes and subjects
- Can mark attendance and upload grades
- Can upload study materials
- Can communicate with parents

### Parent
- Access to child's information only
- Can view child's grades and attendance
- Can communicate with teachers
- Can view announcements

### Student
- Access to personal information only
- Can view own grades and attendance
- Can download study materials
- Can view announcements

## 📁 Project Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminDashboard.js
│   │   ├── AdminSidebar.js
│   │   ├── AdminOverview.js
│   │   ├── UserManagement.js
│   │   ├── ClassManagement.js
│   │   ├── AttendanceReports.js
│   │   └── Announcements.js
│   ├── teacher/
│   │   ├── TeacherDashboard.js
│   │   ├── TeacherSidebar.js
│   │   ├── TeacherOverview.js
│   │   ├── ClassAttendance.js
│   │   ├── GradeManagement.js
│   │   ├── StudyMaterials.js
│   │   └── ParentMessages.js
│   ├── parent/
│   │   ├── ParentDashboard.js
│   │   ├── ParentSidebar.js
│   │   ├── ParentOverview.js
│   │   ├── ChildProgress.js
│   │   ├── AttendanceView.js
│   │   ├── Messages.js
│   │   └── Announcements.js
│   ├── student/
│   │   ├── StudentDashboard.js
│   │   ├── StudentSidebar.js
│   │   ├── StudentOverview.js
│   │   ├── MyGrades.js
│   │   ├── MyAttendance.js
│   │   ├── StudyMaterials.js
│   │   └── Announcements.js
│   ├── Login.js
│   └── ProtectedRoute.js
├── contexts/
│   └── AuthContext.js
├── firebase/
│   └── config.js
├── App.js
└── index.js
```

## 🗄️ Database Structure

The application uses Firestore with the following main collections:

- **users**: User profiles (students, teachers, parents, admins)
- **classes**: Class/section information
- **subjects**: Subject information and teacher assignments
- **attendance**: Daily attendance records
- **grades**: Student grades and exam results
- **studyMaterials**: Uploaded study materials and homework
- **messages**: Communication between teachers and parents
- **announcements**: School announcements and notices

For detailed database structure, see `FIRESTORE_STRUCTURE.md`.

## 🔒 Security Features

- **Role-based Access Control**: Different access levels for each user type
- **Protected Routes**: Authentication required for all dashboard access
- **Firestore Security Rules**: Server-side validation and access control
- **Data Validation**: Client and server-side validation
- **Secure File Uploads**: Firebase Storage with proper access controls

## 🚀 Deployment

### Firebase Hosting
1. Install Firebase CLI
   ```bash
   npm install -g firebase-tools
   ```

2. Build the project
   ```bash
   npm run build
   ```

3. Initialize Firebase hosting
   ```bash
   firebase init hosting
   ```

4. Deploy
   ```bash
   firebase deploy
   ```

### Other Hosting Platforms
The built React app can be deployed to any static hosting service:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🎨 UI/UX Features

- **Modern Design**: Clean and intuitive interface
- **Bootstrap Components**: Consistent styling and components
- **Responsive Layout**: Works on all device sizes
- **Interactive Elements**: Smooth transitions and animations
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 🔧 Customization

### Adding New Features
1. Create new components in the appropriate module folder
2. Add routes to the main App.js
3. Update the sidebar navigation
4. Add necessary Firestore collections and security rules

### Styling
- Modify Bootstrap variables in `src/index.css`
- Add custom CSS classes as needed
- Use React Bootstrap components for consistency

## 📊 Performance Optimization

- **Code Splitting**: Lazy loading of components
- **Firestore Indexes**: Optimized database queries
- **Image Optimization**: Compressed images and lazy loading
- **Caching**: Firebase caching for better performance

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Configuration Error**
   - Ensure Firebase config is correct
   - Check Firebase project settings

2. **Authentication Issues**
   - Verify Firebase Auth is enabled
   - Check user permissions

3. **Firestore Permission Denied**
   - Review security rules
   - Check user authentication status

4. **File Upload Issues**
   - Verify Firebase Storage rules
   - Check file size limits

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- **Mobile App**: React Native version
- **Advanced Analytics**: Detailed reporting and analytics
- **Video Conferencing**: Integrated video calls
- **AI Features**: Automated grading and insights
- **Multi-language Support**: Internationalization
- **Advanced Notifications**: Push notifications and email alerts

## 📚 Documentation

- [Firestore Structure](FIRESTORE_STRUCTURE.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

**Built with ❤️ for modern education management**