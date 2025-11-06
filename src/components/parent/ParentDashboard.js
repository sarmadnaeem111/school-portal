import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ParentSidebar from './ParentSidebar';
import ParentOverview from './ParentOverview';
import ChildProgress from './ChildProgress';
import AttendanceView from './AttendanceView';
import Messages from './Messages';
import Announcements from './Announcements';
import ParentResults from './ParentResults';
import ParentFeeChalan from './ParentFeeChalan';
import ParentTimetable from './ParentTimetable';

const ParentDashboard = () => {
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
      <ParentSidebar handleLogout={handleLogout} />
      <div className="flex-grow-1 d-flex flex-column">
        <Navbar expand="lg" className="navbar-enhanced">
          <Container fluid className="d-flex align-items-center">
       

<Navbar.Toggle aria-controls="basic-navbar-nav" 
              variant="primary" 
              onClick={toggleSidebar}
              title="Open Menu"
/>




            <Navbar.Brand className="d-flex align-items-center flex-grow-1">
              <i className="fas fa-users me-2" style={{ color: 'var(--secondary-color)' }}></i>
              <span className="d-none d-sm-inline">{schoolName} - Parent Dashboard</span>
              <span className="d-sm-none">Parent Dashboard</span>
            </Navbar.Brand>
         
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto d-flex align-items-center flex-wrap">
                <div className="d-flex align-items-center me-3 d-none d-sm-flex">
                  <div className="bg-info rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '35px', height: '35px' }}>
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
            <Route path="/dashboard" element={<ParentOverview />} />
            <Route path="/progress" element={<ChildProgress />} />
            <Route path="/attendance" element={<AttendanceView />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/timetable" element={<ParentTimetable />} />
            <Route path="/results" element={<ParentResults />} />
            <Route path="/fee-chalan" element={<ParentFeeChalan />} />
            <Route path="/" element={<ParentOverview />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
