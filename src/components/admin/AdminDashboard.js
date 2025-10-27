import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import AdminSidebar from './AdminSidebar';
import AdminOverview from './AdminOverview';
import UserManagement from './UserManagement';
import ClassManagement from './ClassManagement';
import AttendanceReports from './AttendanceReports';
import TeacherAttendance from './TeacherAttendance';
import Announcements from './Announcements';
import CharacterCertificate from './CharacterCertificate';
import SchoolLeavingCertificate from './SchoolLeavingCertificate';
import AdminResults from './AdminResults';
import SchoolProfile from './SchoolProfile';
import FeeChalan from './FeeChalan';

const AdminDashboard = () => {
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
    // Add/remove show class to sidebar
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
      <AdminSidebar handleLogout={handleLogout} />
      <div className="flex-grow-1 d-flex flex-column">
        <Navbar expand="lg" className="navbar-enhanced">
          <Container fluid className="d-flex align-items-center">
            <Button 
              variant="primary" 
              className="me-3 menu-toggle-btn"
              onClick={toggleSidebar}
              title="Open Menu"
            >
              <i className="fas fa-bars"></i>
            </Button>
            <Navbar.Brand className="d-flex align-items-center flex-grow-1">
              <i className="fas fa-graduation-cap me-2" style={{ color: 'var(--secondary-color)' }}></i>
              <span className="d-none d-sm-inline">{schoolName} - Admin Dashboard</span>
              <span className="d-sm-none">Admin Dashboard</span>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto d-flex align-items-center flex-wrap">
                <div className="d-flex align-items-center me-3 d-none d-sm-flex">
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '35px', height: '35px' }}>
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
            <Route path="/dashboard" element={<AdminOverview />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/classes" element={<ClassManagement />} />
            <Route path="/attendance" element={<AttendanceReports />} />
            <Route path="/teacher-attendance" element={<TeacherAttendance />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/character-certificate" element={<CharacterCertificate />} />
            <Route path="/school-leaving-certificate" element={<SchoolLeavingCertificate />} />
            <Route path="/results" element={<AdminResults />} />
            <Route path="/school-profile" element={<SchoolProfile />} />
            <Route path="/fee-chalan" element={<FeeChalan />} />
            <Route path="/" element={<AdminOverview />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
