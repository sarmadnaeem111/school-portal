import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Form, Badge } from 'react-bootstrap';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const AttendanceView = () => {
  const { currentUser } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendancePercentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildAttendance();
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const childrenQuery = query(collection(db, 'users'), where('parentId', '==', currentUser.uid));
      const childrenSnapshot = await getDocs(childrenQuery);
      const childrenList = childrenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChildren(childrenList);
      
      if (childrenList.length > 0) {
        setSelectedChild(childrenList[0].id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildAttendance = async () => {
    try {
      const attendanceQuery = query(collection(db, 'attendance'), where('studentId', '==', selectedChild));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceList = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const selectedChildData = children.find(child => child.id === selectedChild);

  return (
    <div>
      <h2 className="mb-4">Attendance Records</h2>
      
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Select Child</Form.Label>
            <Form.Select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {selectedChildData && (
        <>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title className="text-primary">
                    <i className="fas fa-calendar-alt fa-2x"></i>
                  </Card.Title>
                  <Card.Text>
                    <h3>{attendanceStats.totalDays || 0}</h3>
                    <p className="text-muted">Total Days</p>
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
                    <h3>{attendanceStats.presentDays || 0}</h3>
                    <p className="text-muted">Present Days</p>
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
                    <h3>{attendanceStats.absentDays || 0}</h3>
                    <p className="text-muted">Absent Days</p>
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
                    <p className="text-muted">Attendance Rate</p>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card>
            <Card.Header>
              <h5>Attendance Details - {selectedChildData.name}</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
              <Table striped bordered hover className="table-enhanced">
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
                  {attendance.map(record => (
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
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default AttendanceView;
