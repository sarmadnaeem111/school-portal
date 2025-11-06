import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import StudentSidebar from './StudentSidebar';
import StudentOverview from './StudentOverview';
import MyGrades from './MyGrades';
import MyAttendance from './MyAttendance';
import StudyMaterials from './StudyMaterials';
import Announcements from './Announcements';
import StudentResults from './StudentResults';
import StudentFeeChalan from './StudentFeeChalan';
import StudentTimetable from './StudentTimetable';

const StudentDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [schoolName, setSchoolName] = useState('School Portal');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchSchoolProfile = async () => {
      try {
        const profileRef = doc(db, 'schoolProfile', 'main');
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          if (data.schoolName) {
            setSchoolName(data.schoolName);
          }
        }
      } catch (error) {
        console.error('Error fetching school profile:', error);
      }
    };

    fetchSchoolProfile();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    const sidebar = document.querySelector('.sidebar-enhanced');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar && overlay) {
      sidebar.classList.toggle('show');
      overlay.classList.toggle('show');
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    const sidebar = document.querySelector('.sidebar-enhanced');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar && overlay) {
      sidebar.classList.remove('show');
      overlay.classList.remove('show');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="d-flex min-vh-100">
      <div className="sidebar-overlay" onClick={closeSidebar}></div>
      <StudentSidebar handleLogout={handleLogout} />
      <div className="flex-grow-1 d-flex flex-column">
        <Navbar expand="lg" className="navbar-enhanced">
          <Container fluid className="d-flex align-items-center">
       
{/* 
xyz */}

          <Navbar.Toggle aria-controls="basic-navbar-nav" 
              variant="primary" 
              onClick={toggleSidebar}
              title="Open Menu"
/>


            <Navbar.Brand className="d-flex align-items-center flex-grow-1">
              <i className="fas fa-user-graduate me-2" style={{ color: 'var(--secondary-color)' }}></i>
              <span className="d-none d-sm-inline">{schoolName} - Student Dashboard</span>
              <span className="d-sm-none">Student Dashboard</span>
            </Navbar.Brand>
   
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto d-flex align-items-center flex-wrap">
                <div className="d-flex align-items-center me-3 d-none d-sm-flex">
                  <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '35px', height: '35px' }}>
                    <i className="fas fa-user text-white"></i>
                  </div>
                  <span className="text-muted d-none d-md-inline">Welcome, {currentUser?.displayName}</span>
                </div>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        
        <div className="flex-grow-1 container-enhanced">
          <Routes>
            <Route path="/dashboard" element={<StudentOverview />} />
            <Route path="/grades" element={<MyGrades />} />
            <Route path="/attendance" element={<MyAttendance />} />
            <Route path="/materials" element={<StudyMaterials />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/timetable" element={<StudentTimetable />} />
            <Route path="/results" element={<StudentResults />} />
            <Route path="/fee-chalan" element={<StudentFeeChalan />} />
            <Route path="/" element={<StudentOverview />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
