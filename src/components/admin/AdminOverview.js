import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AdminOverview = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalClasses: 0,
    attendanceToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get user counts by role
      const usersRef = collection(db, 'users');
      const studentsQuery = query(usersRef, where('role', '==', 'student'));
      const teachersQuery = query(usersRef, where('role', '==', 'teacher'));
      const parentsQuery = query(usersRef, where('role', '==', 'parent'));

      const [studentsSnapshot, teachersSnapshot, parentsSnapshot] = await Promise.all([
        getDocs(studentsQuery),
        getDocs(teachersQuery),
        getDocs(parentsQuery)
      ]);

      // Get classes count
      const classesRef = collection(db, 'classes');
      const classesSnapshot = await getDocs(classesRef);

      // Get today's attendance (simplified - you might want to implement proper date filtering)
      const attendanceRef = collection(db, 'attendance');
      const attendanceSnapshot = await getDocs(attendanceRef);

      setStats({
        totalStudents: studentsSnapshot.size,
        totalTeachers: teachersSnapshot.size,
        totalParents: parentsSnapshot.size,
        totalClasses: classesSnapshot.size,
        attendanceToday: attendanceSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center animate-fadeInUp">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
          <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
          <h5 className="text-muted">Loading dashboard data...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <div className="mb-4">
        <h2 className="mb-1" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          <i className="fas fa-tachometer-alt me-3"></i>
          Admin Dashboard Overview
        </h2>
        <p className="text-muted mb-0">Welcome to your school management control center</p>
      </div>
      
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center card-enhanced" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
          }}>
            <Card.Body className="p-4">
              <div className="mb-3">
                <i className="fas fa-user-graduate fa-3x" style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '50%', 
                  padding: '20px',
                  backdropFilter: 'blur(10px)'
                }}></i>
              </div>
              <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '700' }}>{stats.totalStudents}</h2>
              <p className="mb-0" style={{ fontSize: '1.1rem', opacity: '0.9' }}>Total Students</p>
              <Badge bg="light" text="dark" className="mt-2 badge-enhanced">
                <i className="fas fa-arrow-up me-1"></i>
                Active
              </Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center card-enhanced" style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            border: 'none',
            boxShadow: '0 8px 25px rgba(240, 147, 251, 0.3)'
          }}>
            <Card.Body className="p-4">
              <div className="mb-3">
                <i className="fas fa-chalkboard-teacher fa-3x" style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '50%', 
                  padding: '20px',
                  backdropFilter: 'blur(10px)'
                }}></i>
              </div>
              <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '700' }}>{stats.totalTeachers}</h2>
              <p className="mb-0" style={{ fontSize: '1.1rem', opacity: '0.9' }}>Total Teachers</p>
              <Badge bg="light" text="dark" className="mt-2 badge-enhanced">
                <i className="fas fa-users me-1"></i>
                Faculty
              </Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center card-enhanced" style={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            border: 'none',
            boxShadow: '0 8px 25px rgba(79, 172, 254, 0.3)'
          }}>
            <Card.Body className="p-4">
              <div className="mb-3">
                <i className="fas fa-users fa-3x" style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '50%', 
                  padding: '20px',
                  backdropFilter: 'blur(10px)'
                }}></i>
              </div>
              <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '700' }}>{stats.totalParents}</h2>
              <p className="mb-0" style={{ fontSize: '1.1rem', opacity: '0.9' }}>Total Parents</p>
              <Badge bg="light" text="dark" className="mt-2 badge-enhanced">
                <i className="fas fa-heart me-1"></i>
                Connected
              </Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center card-enhanced" style={{ 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            border: 'none',
            boxShadow: '0 8px 25px rgba(67, 233, 123, 0.3)'
          }}>
            <Card.Body className="p-4">
              <div className="mb-3">
                <i className="fas fa-school fa-3x" style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '50%', 
                  padding: '20px',
                  backdropFilter: 'blur(10px)'
                }}></i>
              </div>
              <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '700' }}>{stats.totalClasses}</h2>
              <p className="mb-0" style={{ fontSize: '1.1rem', opacity: '0.9' }}>Total Classes</p>
              <Badge bg="light" text="dark" className="mt-2 badge-enhanced">
                <i className="fas fa-graduation-cap me-1"></i>
                Active
              </Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="card-enhanced">
            <Card.Header style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none'
            }}>
              <h5 className="mb-0">
                <i className="fas fa-chart-line me-2"></i>
                Recent Activity
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="text-center py-4">
                <i className="fas fa-clock fa-3x text-muted mb-3"></i>
                <h6 className="text-muted">No recent activity to display</h6>
                <p className="text-muted small">Activity will appear here as users interact with the system</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="card-enhanced">
            <Card.Header style={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none'
            }}>
              <h5 className="mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-grid gap-3">
                <Button 
                  variant="primary btn-enhanced" 
                  className="d-flex align-items-center justify-content-center"
                  onClick={() => navigate('/admin/users#add-student')}
                >
                  <i className="fas fa-user-plus me-2"></i>
                  Add New Student
                </Button>
                <Button 
                  variant="success btn-enhanced" 
                  className="d-flex align-items-center justify-content-center"
                  onClick={() => navigate('/admin/users#add-teacher')}
                >
                  <i className="fas fa-chalkboard-teacher me-2"></i>
                  Add New Teacher
                </Button>
                <Button 
                  variant="info btn-enhanced" 
                  className="d-flex align-items-center justify-content-center"
                  onClick={() => navigate('/admin/classes#new-class')}
                >
                  <i className="fas fa-school me-2"></i>
                  Create Class
                </Button>
                <Button 
                  variant="warning btn-enhanced" 
                  className="d-flex align-items-center justify-content-center"
                  onClick={() => navigate('/admin/announcements#compose')}
                >
                  <i className="fas fa-bullhorn me-2"></i>
                  Send Announcement
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminOverview;
