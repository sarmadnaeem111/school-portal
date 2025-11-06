import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, ProgressBar, Form, Button } from 'react-bootstrap';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const MyAttendance = () => {
  const { currentUser } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendancePercentage: 0,
    totalWorkingHours: 0,
    averageWorkingHours: 0
  });

  useEffect(() => {
    fetchTeacherAttendance();
  }, [selectedMonth, selectedYear]);

  const fetchTeacherAttendance = async () => {
    try {
      setLoading(true);
      
      // Get teacher attendance records for the selected month/year
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      
      const attendanceQuery = query(
        collection(db, 'teacherAttendance'),
        where('teacherId', '==', currentUser.uid)
      );
      
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const allRecords = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort by date on the client side to avoid index requirements
      allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Filter records for the selected month/year
      const filteredRecords = allRecords.filter(record => {
        if (!record.date) return false;
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });
      
      console.log('Fetched attendance records:', {
        totalRecords: allRecords.length,
        filteredRecords: filteredRecords.length,
        selectedMonth,
        selectedYear,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      setAttendanceRecords(filteredRecords || []);
      calculateAttendanceStats(filteredRecords || []);
    } catch (error) {
      console.error('Error fetching teacher attendance:', error);
      setAttendanceRecords([]);
      setAttendanceStats({
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        attendancePercentage: 0,
        totalWorkingHours: 0,
        averageWorkingHours: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendanceStats = (records) => {
    if (!records || !Array.isArray(records)) {
      setAttendanceStats({
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        attendancePercentage: 0,
        totalWorkingHours: 0,
        averageWorkingHours: 0
      });
      return;
    }

    const totalDays = records.length || 0;
    const presentDays = records.filter(record => record && record.status === 'present').length || 0;
    const absentDays = totalDays - presentDays;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Calculate working hours
    let totalWorkingHours = 0;
    let totalWorkingDays = 0;

    records.forEach(record => {
      if (record && record.status === 'present' && record.arrivalTime && record.departureTime) {
        try {
          const arrival = new Date(`2000-01-01 ${record.arrivalTime}`);
          const departure = new Date(`2000-01-01 ${record.departureTime}`);
          const workingHours = (departure - arrival) / (1000 * 60 * 60); // Convert to hours
          if (!isNaN(workingHours) && workingHours > 0) {
            totalWorkingHours += workingHours;
            totalWorkingDays++;
          }
        } catch (error) {
          console.error('Error calculating working hours:', error);
        }
      }
    });

    const averageWorkingHours = totalWorkingDays > 0 ? totalWorkingHours / totalWorkingDays : 0;

    setAttendanceStats({
      totalDays: totalDays || 0,
      presentDays: presentDays || 0,
      absentDays: absentDays || 0,
      attendancePercentage: attendancePercentage || 0,
      totalWorkingHours: totalWorkingHours || 0,
      averageWorkingHours: averageWorkingHours || 0
    });
  };

  const formatTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    return status === 'present' ? 'success' : 'danger';
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 95) return 'success';
    if (percentage >= 85) return 'info';
    if (percentage >= 75) return 'warning';
    return 'danger';
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="mb-4">My Attendance Progress</h2>
      
      {/* Month/Year Selector */}
      <Row className="mb-4">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Select Month</Form.Label>
            <Form.Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Select Year</Form.Label>
            <Form.Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4} className="d-flex align-items-end">
          <Button 
            variant="primary" 
            onClick={fetchTeacherAttendance}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Loading...
              </>
            ) : (
              <>
                <i className="fas fa-sync-alt me-2"></i>
                Refresh
              </>
            )}
          </Button>
        </Col>
      </Row>

      {/* Attendance Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-primary">
                <i className="fas fa-calendar-alt fa-2x"></i>
              </Card.Title>
              <Card.Text>
                <h3>{attendanceStats.totalDays}</h3>
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
                <h3>{attendanceStats.presentDays}</h3>
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
                <h3>{attendanceStats.absentDays}</h3>
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
                <h3>{attendanceStats.attendancePercentage?.toFixed(1) || '0.0'}%</h3>
                <p className="text-muted">Attendance Rate</p>
                <ProgressBar 
                  variant={getAttendanceColor(attendanceStats.attendancePercentage || 0)}
                  now={attendanceStats.attendancePercentage || 0}
                />
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Working Hours Statistics */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Working Hours Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <h4 className="text-primary">
                  {attendanceStats.totalWorkingHours?.toFixed(1) || '0.0'} hours
                </h4>
                <p className="text-muted">Total Working Hours</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Average Daily Hours</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <h4 className="text-success">
                  {attendanceStats.averageWorkingHours?.toFixed(1) || '0.0'} hours
                </h4>
                <p className="text-muted">Per Working Day</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Attendance Records Table */}
      <Card>
        <Card.Header>
          <h5>Attendance Records - {getMonthName(selectedMonth)} {selectedYear}</h5>
        </Card.Header>
        <Card.Body>
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No Attendance Records Found</h5>
              <p className="text-muted">
                Your attendance records for {getMonthName(selectedMonth)} {selectedYear} will appear here.
              </p>
              <Button variant="outline-primary" onClick={fetchTeacherAttendance}>
                <i className="fas fa-sync-alt me-2"></i>
                Check Again
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Arrival Time</th>
                    <th>Departure Time</th>
                    <th>Working Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map(record => {
                  let workingHours = 0;
                  if (record.arrivalTime && record.departureTime) {
                    const arrival = new Date(`2000-01-01 ${record.arrivalTime}`);
                    const departure = new Date(`2000-01-01 ${record.departureTime}`);
                    workingHours = (departure - arrival) / (1000 * 60 * 60);
                  }
                  
                  return (
                    <tr key={record.id}>
                      <td>{formatDate(record.date)}</td>
                      <td>
                        <Badge bg={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </td>
                      <td>{record.arrivalTime ? formatTo12Hour(record.arrivalTime) : '-'}</td>
                      <td>{record.departureTime ? formatTo12Hour(record.departureTime) : '-'}</td>
                      <td>
                        {workingHours > 0 ? `${workingHours?.toFixed(1) || '0.0'} hours` : '-'}
                      </td>
                    </tr>
                  );
                })}
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
