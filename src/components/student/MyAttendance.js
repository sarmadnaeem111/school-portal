import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Badge, Button, Form } from 'react-bootstrap';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const MyAttendance = () => {
  const { currentUser } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'week', 'month', 'year'

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      console.log('Fetching attendance for student UID:', currentUser.uid);
      const attendanceQuery = query(collection(db, 'attendance'), where('studentId', '==', currentUser.uid));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceList = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('Found attendance records:', attendanceList);
      setAttendance(attendanceList.sort((a, b) => new Date(b.date) - new Date(a.date)));

      // Calculate attendance stats
      const totalDays = attendanceList.length;
      const presentDays = attendanceList.filter(record => record.status === 'present').length;
      const absentDays = totalDays - presentDays;
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      setAttendanceStats({
        totalDays,
        presentDays,
        absentDays,
        attendancePercentage
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFilteredAttendance = () => {
    if (dateFilter === 'all') return attendance;
    
    const now = new Date();
    let cutoffDate;
    
    switch (dateFilter) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return attendance;
    }
    
    return attendance.filter(record => new Date(record.date) >= cutoffDate);
  };

  const filteredAttendance = getFilteredAttendance();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Attendance</h2>
        <div className="d-flex gap-2">
          <Form.Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </Form.Select>
          <Button variant="outline-primary" onClick={fetchAttendance}>
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </Button>
        </div>
      </div>
      
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-primary">
                <i className="fas fa-calendar-alt fa-2x"></i>
              </Card.Title>
              <Card.Text>
                <h3>{attendanceStats.totalDays}</h3>
                <div className="text-muted">Total Days</div>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-success">
                <i className="fas fa-check-circle fa-2x"></i>
              </Card.Title>
              <Card.Text>
                <h3>{attendanceStats.presentDays}</h3>
                <div className="text-muted">Present Days</div>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-danger">
                <i className="fas fa-times-circle fa-2x"></i>
              </Card.Title>
              <Card.Text>
                <h3>{attendanceStats.absentDays}</h3>
                <div className="text-muted">Absent Days</div>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-info">
                <i className="fas fa-percentage fa-2x"></i>
              </Card.Title>
              <Card.Text>
                <h3>{attendanceStats.attendancePercentage ? attendanceStats.attendancePercentage.toFixed(1) : '0.0'}%</h3>
                <div className="text-muted">Attendance Rate</div>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h5>Attendance Records ({filteredAttendance.length} records found)</h5>
        </Card.Header>
        <Card.Body>
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No Attendance Records Found</h5>
              <p className="text-muted">
                Your attendance records will appear here once your teachers mark attendance for your classes.
              </p>
              <Button variant="outline-primary" onClick={fetchAttendance}>
                <i className="fas fa-sync-alt me-2"></i>
                Refresh Records
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Class</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Teacher</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map(record => (
                    <tr key={record.id}>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.className}</td>
                      <td>
                        <Badge bg={record.status === 'present' ? 'success' : 'danger'}>
                          {record.status}
                        </Badge>
                      </td>
                      <td>{record.time}</td>
                      <td>{record.teacherName}</td>
                      <td>{record.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default MyAttendance;
