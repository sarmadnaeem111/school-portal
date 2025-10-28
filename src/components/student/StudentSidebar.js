import React, { useState, useEffect } from 'react';
import { Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const StudentSidebar = ({ onClose, handleLogout }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [schoolName, setSchoolName] = useState('Academic Portal');

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

  const handleCloseSidebar = () => {
    const sidebar = document.querySelector('.sidebar-enhanced');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar && overlay) {
      sidebar.classList.remove('show');
      overlay.classList.remove('show');
    }
    if (onClose) onClose();
  };

  const handleLogoutClick = async () => {
    if (handleLogout) {
      await handleLogout();
    } else {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Failed to log out', error);
      }
    }
    handleCloseSidebar();
  };

  return (
    <div className="sidebar-enhanced" style={{ width: '280px', minHeight: '100vh', position: 'relative' }}>
      <button className="sidebar-close-btn" onClick={handleCloseSidebar}>
        <i className="fas fa-times"></i>
      </button>
      <div className="p-4">
        <div className="d-flex align-items-center">
          <div className="me-3">
            <i className="fas fa-user-graduate fa-2x" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}></i>
          </div>
          <div>
            <h5 className="mb-0" style={{ fontWeight: '700', color: 'white' }}>Student Panel</h5>
            <small style={{ color: 'rgba(255,255,255,0.7)' }}>{schoolName}</small>
          </div>
        </div>
      </div>
      <Nav className="flex-column px-3">
        <LinkContainer to="/student/dashboard" onClick={handleCloseSidebar}>
          <Nav.Link className="text-white">
            <i className="fas fa-tachometer-alt me-2"></i>
            Dashboard
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/student/grades" onClick={handleCloseSidebar}>
          <Nav.Link className="text-white">
            <i className="fas fa-graduation-cap me-2"></i>
            My Grades
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/student/attendance" onClick={handleCloseSidebar}>
          <Nav.Link className="text-white">
            <i className="fas fa-calendar-check me-2"></i>
            My Attendance
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/student/timetable" onClick={handleCloseSidebar}>
          <Nav.Link className="text-white">
            <i className="fas fa-table me-2"></i>
            Timetable
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/student/materials" onClick={handleCloseSidebar}>
          <Nav.Link className="text-white">
            <i className="fas fa-book me-2"></i>
            Study Materials
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/student/announcements" onClick={handleCloseSidebar}>
          <Nav.Link className="text-white">
            <i className="fas fa-bullhorn me-2"></i>
            Announcements
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/student/results" onClick={handleCloseSidebar}>
          <Nav.Link className="text-white">
            <i className="fas fa-chart-bar me-2"></i>
            Results
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/student/fee-chalan" onClick={handleCloseSidebar}>
          <Nav.Link className="text-white">
            <i className="fas fa-file-invoice-dollar me-2"></i>
            Fee Chalan
          </Nav.Link>
        </LinkContainer>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '10px', paddingTop: '10px' }}>
          <Nav.Link className="text-white" onClick={handleLogoutClick} style={{ cursor: 'pointer' }}>
            <i className="fas fa-sign-out-alt me-2"></i>
            Logout
          </Nav.Link>
        </div>
      </Nav>
    </div>
  );
};

export default StudentSidebar;
