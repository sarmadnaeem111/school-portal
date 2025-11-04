import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Form, Button, Badge, Alert, Modal } from 'react-bootstrap';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const TeacherAttendance = () => {
  const { currentUser } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [teacherAttendance, setTeacherAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [manualTime, setManualTime] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editingTimeType, setEditingTimeType] = useState(''); // 'arrival' or 'departure'
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [useTimePicker, setUseTimePicker] = useState(true);
  const [timePickerValue, setTimePickerValue] = useState('');

  // Helper function to convert 24-hour time to 12-hour format
  const formatTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper function to convert 12-hour time to 24-hour format
  const formatTo24Hour = (time12) => {
    if (!time12) return '';
    const [time, ampm] = time12.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (ampm === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (ampm === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  // Helper function to convert 24-hour time picker value to 12-hour format
  const convertTimePickerTo12Hour = (time24) => {
    if (!time24) return '';
    return formatTo12Hour(time24);
  };

  // Helper function to handle time picker change
  const handleTimePickerChange = (time24) => {
    setTimePickerValue(time24);
    const time12 = convertTimePickerTo12Hour(time24);
    setManualTime(time12);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (teachers.length > 0) {
      fetchTeacherAttendance();
    }
  }, [selectedDate, teachers]);

  const fetchTeachers = async () => {
    try {
      const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const teachersSnapshot = await getDocs(teachersQuery);
      const teachersList = teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(teachersList);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setMessage('Error fetching teachers');
      setMessageType('danger');
    }
  };

  const fetchTeacherAttendance = async () => {
    try {
      setLoading(true);
      const attendanceQuery = query(
        collection(db, 'teacherAttendance'),
        where('date', '==', selectedDate)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceList = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort by arrival time on the client side to avoid index requirements
      attendanceList.sort((a, b) => {
        if (!a.arrivalTime && !b.arrivalTime) return 0;
        if (!a.arrivalTime) return 1;
        if (!b.arrivalTime) return -1;
        return a.arrivalTime.localeCompare(b.arrivalTime);
      });
      
      setTeacherAttendance(attendanceList);
    } catch (error) {
      console.error('Error fetching teacher attendance:', error);
      setMessage('Error fetching teacher attendance');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const openTimeModal = (teacherId, action) => {
    setEditingTeacher({ id: teacherId, action });
    setManualTime('');
    setEditingTimeType('');
    setShowTimeModal(true);
  };

  const openEditTimeModal = (teacherId, timeType, currentTime) => {
    setEditingTeacher({ id: teacherId, action: 'edit' });
    setEditingTimeType(timeType);
    const time12 = currentTime ? formatTo12Hour(currentTime) : '';
    setManualTime(time12);
    setTimePickerValue(currentTime || '');
    setUseTimePicker(true);
    setShowTimeModal(true);
  };

  const openStatusModal = (teacherId, currentStatus) => {
    setEditingTeacher({ id: teacherId, action: 'status' });
    // Default to 'present' when no existing status
    setSelectedStatus(currentStatus || 'present');
    setShowStatusModal(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedStatus) {
      setMessage('Please select a status');
      setMessageType('warning');
      return;
    }

    try {
      const teacher = teachers.find(t => t.id === editingTeacher.id);
      if (!teacher) {
        setMessage('Teacher not found');
        setMessageType('danger');
        return;
      }

      const today = selectedDate;
      const existingRecord = teacherAttendance.find(record => 
        record.teacherId === editingTeacher.id && record.date === today
      );

      if (!existingRecord) {
        // Create new record if none exists
        const attendanceData = {
          teacherId: editingTeacher.id,
          teacherName: teacher.name,
          date: today,
          status: selectedStatus,
          markedBy: currentUser.uid,
          markedAt: new Date()
        };

        await addDoc(collection(db, 'teacherAttendance'), attendanceData);
        setMessage(`${teacher.name} status set to ${selectedStatus}`);
      } else {
        // Update existing record
        const updateData = {
          status: selectedStatus,
          markedBy: currentUser.uid,
          markedAt: new Date()
        };

        // If changing to absent, clear arrival and departure times
        if (selectedStatus === 'absent') {
          updateData.arrivalTime = null;
          updateData.departureTime = null;
        }

        await updateDoc(doc(db, 'teacherAttendance', existingRecord.id), updateData);
        setMessage(`${teacher.name} status updated to ${selectedStatus}`);
      }

      setMessageType('success');
      setShowStatusModal(false);
      fetchTeacherAttendance();
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage('Error updating status');
      setMessageType('danger');
    }
  };

  const handleTimeSubmit = async () => {
    if (!manualTime) {
      setMessage('Please enter a time');
      setMessageType('warning');
      return;
    }

    // Convert 12-hour time to 24-hour format for storage
    const time24 = formatTo24Hour(manualTime);
    if (!time24) {
      setMessage('Please enter a valid time format (e.g., 9:30 AM, 2:15 PM)');
      setMessageType('warning');
      return;
    }

    try {
      const teacher = teachers.find(t => t.id === editingTeacher.id);
      if (!teacher) {
        setMessage('Teacher not found');
        setMessageType('danger');
        return;
      }

      const today = selectedDate;
      const existingRecord = teacherAttendance.find(record => 
        record.teacherId === editingTeacher.id && record.date === today
      );

      // Handle editing existing times
      if (editingTeacher.action === 'edit') {
        if (!existingRecord) {
          setMessage('No attendance record found to edit');
          setMessageType('warning');
          setShowTimeModal(false);
          return;
        }

        const updateData = {
          markedBy: currentUser.uid,
          markedAt: new Date()
        };

        if (editingTimeType === 'arrival') {
          updateData.arrivalTime = time24;
          updateData.status = 'present';
        } else if (editingTimeType === 'departure') {
          updateData.departureTime = time24;
        }

        await updateDoc(doc(db, 'teacherAttendance', existingRecord.id), updateData);

        setMessage(`${teacher.name} ${editingTimeType} time updated to ${manualTime}`);
        setMessageType('success');
      }
      // Handle new arrival marking
      else if (editingTeacher.action === 'arrival') {
        if (existingRecord && existingRecord.arrivalTime) {
          setMessage(`${teacher.name} has already marked arrival today`);
          setMessageType('warning');
          setShowTimeModal(false);
          return;
        }

        const attendanceData = {
          teacherId: editingTeacher.id,
          teacherName: teacher.name,
          date: today,
          arrivalTime: time24,
          status: 'present',
          markedBy: currentUser.uid,
          markedAt: new Date()
        };

        if (existingRecord) {
          await updateDoc(doc(db, 'teacherAttendance', existingRecord.id), {
            arrivalTime: time24,
            status: 'present',
            markedBy: currentUser.uid,
            markedAt: new Date()
          });
        } else {
          await addDoc(collection(db, 'teacherAttendance'), attendanceData);
        }

        setMessage(`${teacher.name} arrival marked at ${manualTime}`);
        setMessageType('success');
      } 
      // Handle new departure marking
      else if (editingTeacher.action === 'departure') {
        if (!existingRecord || !existingRecord.arrivalTime) {
          setMessage(`${teacher.name} must mark arrival before departure`);
          setMessageType('warning');
          setShowTimeModal(false);
          return;
        }

        if (existingRecord.departureTime) {
          setMessage(`${teacher.name} has already marked departure today`);
          setMessageType('warning');
          setShowTimeModal(false);
          return;
        }

        await updateDoc(doc(db, 'teacherAttendance', existingRecord.id), {
          departureTime: time24,
          markedBy: currentUser.uid,
          markedAt: new Date()
        });

        setMessage(`${teacher.name} departure marked at ${manualTime}`);
        setMessageType('success');
      }

      setShowTimeModal(false);
      fetchTeacherAttendance();
    } catch (error) {
      console.error('Error marking attendance:', error);
      setMessage('Error marking attendance');
      setMessageType('danger');
    }
  };

  const markAttendance = async (teacherId, action) => {
    // For backward compatibility, still allow quick marking with current time
    const currentTime24 = new Date().toLocaleTimeString('en-US', { hour12: false });
    const currentTime12 = formatTo12Hour(currentTime24);
    setManualTime(currentTime12);
    setTimePickerValue(currentTime24);
    setUseTimePicker(true);
    openTimeModal(teacherId, action);
  };

  const getAttendanceStats = () => {
    const totalTeachers = teachers.length;
    const presentTeachers = teacherAttendance.filter(record => record.status === 'present').length;
    const absentTeachers = totalTeachers - presentTeachers;
    const attendancePercentage = totalTeachers > 0 ? (presentTeachers / totalTeachers) * 100 : 0;

    return {
      totalTeachers,
      presentTeachers,
      absentTeachers,
      attendancePercentage
    };
  };

  const getTeacherAttendanceStatus = (teacherId) => {
    const record = teacherAttendance.find(record => record.teacherId === teacherId);
    if (!record) return { status: 'present', arrivalTime: null, departureTime: null };
    return {
      status: record.status,
      arrivalTime: record.arrivalTime,
      departureTime: record.departureTime
    };
  };

  const stats = getAttendanceStats();

  return (
    <div>
      <h2 className="mb-4">Teacher Attendance</h2>
      
      {message && (
        <Alert variant={messageType} onClose={() => setMessage('')} dismissible>
          {message}
        </Alert>
      )}

      <Row className="mb-4">
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
          <Button variant="primary" onClick={fetchTeacherAttendance}>
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-primary">
                <i className="fas fa-chalkboard-teacher fa-2x"></i>
              </Card.Title>
              <Card.Text>
                <h3>{stats.totalTeachers}</h3>
                <p className="text-muted">Total Teachers</p>
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
                <h3>{stats.presentTeachers}</h3>
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
                <h3>{stats.absentTeachers}</h3>
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
          <h5>Teacher Attendance Management - {selectedDate}</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Teacher Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Arrival Time</th>
                  <th>Departure Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => {
                  const attendance = getTeacherAttendanceStatus(teacher.id);
                  return (
                    <tr key={teacher.id}>
                      <td>{teacher.name}</td>
                      <td>{teacher.email}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg={attendance.status === 'present' ? 'success' : 'danger'}>
                            {attendance.status}
                          </Badge>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => openStatusModal(teacher.id, attendance.status)}
                            title="Edit status"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </div>
                      </td>
                      <td>
                        {attendance.arrivalTime ? (
                          <div className="d-flex align-items-center gap-2">
                            <span>{formatTo12Hour(attendance.arrivalTime)}</span>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => openEditTimeModal(teacher.id, 'arrival', attendance.arrivalTime)}
                              title="Edit arrival time"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {attendance.departureTime ? (
                          <div className="d-flex align-items-center gap-2">
                            <span>{formatTo12Hour(attendance.departureTime)}</span>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => openEditTimeModal(teacher.id, 'departure', attendance.departureTime)}
                              title="Edit departure time"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          {!attendance.arrivalTime && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => markAttendance(teacher.id, 'arrival')}
                            >
                              <i className="fas fa-sign-in-alt me-1"></i>
                              Mark Arrival
                            </Button>
                          )}
                          {attendance.arrivalTime && !attendance.departureTime && (
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => markAttendance(teacher.id, 'departure')}
                            >
                              <i className="fas fa-sign-out-alt me-1"></i>
                              Mark Departure
                            </Button>
                          )}
                          {attendance.arrivalTime && attendance.departureTime && (
                            <span className="text-muted">Complete</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Time Input Modal */}
      <Modal show={showTimeModal} onHide={() => setShowTimeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingTeacher?.action === 'edit' 
              ? `Edit ${editingTimeType === 'arrival' ? 'Arrival' : 'Departure'} Time`
              : editingTeacher?.action === 'arrival' 
                ? 'Mark Arrival' 
                : 'Mark Departure'
            }
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                {editingTeacher?.action === 'edit' 
                  ? `${editingTimeType === 'arrival' ? 'Arrival' : 'Departure'} Time`
                  : editingTeacher?.action === 'arrival' 
                    ? 'Arrival Time' 
                    : 'Departure Time'
                }
              </Form.Label>
              
              {/* Time Input Method Toggle */}
              <div className="mb-3">
                <Form.Check
                  type="radio"
                  label="Use Time Picker"
                  name="timeInputMethod"
                  id="timePicker"
                  checked={useTimePicker}
                  onChange={() => setUseTimePicker(true)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  label="Manual Entry"
                  name="timeInputMethod"
                  id="manualEntry"
                  checked={!useTimePicker}
                  onChange={() => setUseTimePicker(false)}
                />
              </div>

              {/* Time Picker */}
              {useTimePicker && (
                <Form.Control
                  type="time"
                  value={timePickerValue}
                  onChange={(e) => handleTimePickerChange(e.target.value)}
                  className="mb-2"
                />
              )}

              {/* Manual Text Input */}
              {!useTimePicker && (
                <Form.Control
                  type="text"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  placeholder="9:30 AM, 2:15 PM"
                />
              )}

              <Form.Text className="text-muted">
                {useTimePicker 
                  ? "Select time using the time picker (24-hour format will be converted to 12-hour)"
                  : "Enter time in 12-hour format (e.g., 9:30 AM, 2:15 PM)"
                }
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTimeModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleTimeSubmit}>
            {editingTeacher?.action === 'edit' 
              ? `Update ${editingTimeType === 'arrival' ? 'Arrival' : 'Departure'}`
              : editingTeacher?.action === 'arrival' 
                ? 'Mark Arrival' 
                : 'Mark Departure'
            }
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Status Edit Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Attendance Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Attendance Status</Form.Label>
              <Form.Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">Select Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Changing to "Absent" will clear arrival and departure times.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleStatusSubmit}>
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TeacherAttendance;
