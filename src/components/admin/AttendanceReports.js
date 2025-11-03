import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Form, Button } from 'react-bootstrap';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AttendanceReports = () => {
  const [attendance, setAttendance] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const classesSnapshot = await getDocs(collection(db, 'classes'));
      setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      // Query by class only to avoid requiring a composite index; filter date in-memory
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('classId', '==', selectedClass)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const list = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendance(list.filter(r => r.date === selectedDate));
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = () => {
    const totalStudents = attendance.length;
    const presentStudents = attendance.filter(record => record.status === 'present').length;
    const absentStudents = totalStudents - presentStudents;
    const attendancePercentage = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0;

    return {
      totalStudents,
      presentStudents,
      absentStudents,
      attendancePercentage
    };
  };

  const stats = getAttendanceStats();

  return (
    <div>
      <h2 className="mb-4">Attendance Reports</h2>
      
      <Row className="mb-4">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Select Class</Form.Label>
            <Form.Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Choose a class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.section}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Select Date</Form.Label>
            <Form.Control
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={4} className="d-flex align-items-end">
          <Button variant="primary" onClick={fetchAttendance}>
            Refresh Report
          </Button>
        </Col>
      </Row>

      {selectedClass && (
        <>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title className="text-primary">
                    <i className="fas fa-users fa-2x"></i>
                  </Card.Title>
                  <Card.Text>
                    <h3>{stats.totalStudents}</h3>
                    <p className="text-muted">Total Students</p>
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
                    <h3>{stats.presentStudents}</h3>
                    <p className="text-muted">Present</p>
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
                    <h3>{stats.absentStudents}</h3>
                    <p className="text-muted">Absent</p>
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
                    <h3>{stats.attendancePercentage.toFixed(1)}%</h3>
                    <p className="text-muted">Attendance Rate</p>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card>
            <Card.Header>
              <h5>Attendance Details</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center">Loading...</div>
              ) : (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Roll Number</th>
                      <th>Status</th>
                      <th>Time</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(record => (
                      <tr key={record.id}>
                        <td>{record.studentName}</td>
                        <td>{record.rollNumber}</td>
                        <td>
                          <span className={`badge ${record.status === 'present' ? 'bg-success' : 'bg-danger'}`}>
                            {record.status}
                          </span>
                        </td>
                        <td>{record.time}</td>
                        <td>{record.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default AttendanceReports;
