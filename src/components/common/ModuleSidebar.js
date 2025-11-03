import React, { useEffect, useState } from 'react';
import { Nav, Button } from 'react-bootstrap';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ModuleSidebar = ({ title = 'Module', items = [], onLogout, onClose }) => {
  const [schoolName, setSchoolName] = useState('School Portal');

  useEffect(() => {
    const fetchSchoolProfile = async () => {
      try {
        const profileRef = doc(db, 'schoolProfile', 'main');
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          if (data.schoolName) setSchoolName(data.schoolName);
        }
      } catch (e) {
        // ignore
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

  return (
    <div className="sidebar-enhanced" style={{ width: '280px', minHeight: '100vh', position: 'relative' }}>
      <button className="sidebar-close-btn" onClick={handleCloseSidebar}>
        <i className="fas fa-times"></i>
      </button>
      <div className="p-4">
        <div className="d-flex align-items-center">
          <div className="me-3">
            <i className="fas fa-layer-group fa-2x" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}></i>
          </div>
          <div>
            <h5 className="mb-0" style={{ fontWeight: '700', color: 'white' }}>{title}</h5>
            <small style={{ color: 'rgba(255,255,255,0.7)' }}>{schoolName}</small>
          </div>
        </div>
      </div>
      <Nav className="flex-column px-3">
        {items.map((it) => (
          <Nav.Link key={it.key} className="text-white" onClick={() => { it.onClick(); handleCloseSidebar(); }} style={{ cursor: 'pointer' }}>
            <i className={`${it.icon} me-2`}></i>
            {it.label}
          </Nav.Link>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '10px', paddingTop: '10px' }}>
          <Nav.Link className="text-white" onClick={() => { if (onLogout) onLogout(); handleCloseSidebar(); }} style={{ cursor: 'pointer' }}>
            <i className="fas fa-sign-out-alt me-2"></i>
            Logout
          </Nav.Link>
        </div>
      </Nav>
    </div>
  );
};

export default ModuleSidebar;


