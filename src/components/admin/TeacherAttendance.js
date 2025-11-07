import React, { useState, useEffect, useRef } from 'react';
import { Table, Card, Row, Col, Form, Button, Badge, Alert, Modal } from 'react-bootstrap';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import jsQR from 'jsqr';

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

  // QR scanning state
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrAction, setQrAction] = useState('arrival'); // 'arrival' | 'departure'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Fingerprint scan state (SDK placeholder)
  const [isFingerprintScanning, setIsFingerprintScanning] = useState(false);

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

  // QR: open modal and start scan
  const openQrScan = async (action) => {
    setQrAction(action);
    setShowQrModal(true);
    // Defer starting the camera slightly to allow modal to render
    setTimeout(() => {
      startQrScan();
    }, 100);
  };

  const closeQrScan = () => {
    stopQrScan();
    setShowQrModal(false);
  };

  const startQrScan = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMessage('Camera not supported on this device/browser');
        setMessageType('warning');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.play();
      }
      // Start scanning frames
      scanIntervalRef.current = setInterval(scanFrame, 250);
    } catch (err) {
      console.error('Error starting camera', err);
      setMessage('Unable to access camera');
      setMessageType('danger');
    }
  };

  const stopQrScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const parseQrPayload = (data) => {
    // Accept either a plain teacherId, an email, or a JSON string with { teacherId } or { email }
    try {
      const obj = JSON.parse(data);
      if (obj.teacherId) return { teacherId: String(obj.teacherId) };
      if (obj.email) return { email: String(obj.email) };
    } catch (_) {
      // Not JSON, fall through
    }
    if (data.includes('@')) return { email: data.trim() };
    return { teacherId: data.trim() };
  };

  const scanFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code && code.data) {
      // Found QR
      stopQrScan();
      const payload = parseQrPayload(code.data);
      let teacher = null;
      if (payload.teacherId) {
        teacher = teachers.find(t => t.id === payload.teacherId);
      }
      if (!teacher && payload.email) {
        teacher = teachers.find(t => String(t.email).toLowerCase() === String(payload.email).toLowerCase());
      }
      if (!teacher) {
        setMessage('QR does not match any teacher');
        setMessageType('warning');
        return;
      }
      await markAttendanceInstant(teacher, qrAction);
      setShowQrModal(false);
    }
  };

  const markAttendanceInstant = async (teacher, action) => {
    try {
      const currentTime24 = new Date().toLocaleTimeString('en-US', { hour12: false });
      const today = selectedDate;
      const existingRecord = teacherAttendance.find(record => 
        record.teacherId === teacher.id && record.date === today
      );

      if (action === 'arrival') {
        if (existingRecord && existingRecord.arrivalTime) {
          setMessage(`${teacher.name} has already marked arrival today`);
          setMessageType('warning');
          return;
        }
        if (existingRecord) {
          await updateDoc(doc(db, 'teacherAttendance', existingRecord.id), {
            arrivalTime: currentTime24,
            status: 'present',
            markedBy: currentUser.uid,
            markedAt: new Date()
          });
        } else {
          await addDoc(collection(db, 'teacherAttendance'), {
            teacherId: teacher.id,
            teacherName: teacher.name,
            date: today,
            arrivalTime: currentTime24,
            status: 'present',
            markedBy: currentUser.uid,
            markedAt: new Date()
          });
        }
        setMessage(`${teacher.name} arrival marked via QR`);
        setMessageType('success');
      } else if (action === 'departure') {
        if (!existingRecord || !existingRecord.arrivalTime) {
          setMessage(`${teacher.name} must mark arrival before departure`);
          setMessageType('warning');
          return;
        }
        if (existingRecord.departureTime) {
          setMessage(`${teacher.name} has already marked departure today`);
          setMessageType('warning');
          return;
        }
        await updateDoc(doc(db, 'teacherAttendance', existingRecord.id), {
          departureTime: currentTime24,
          markedBy: currentUser.uid,
          markedAt: new Date()
        });
        setMessage(`${teacher.name} departure marked via QR`);
        setMessageType('success');
      }
      fetchTeacherAttendance();
    } catch (error) {
      console.error('Error marking via QR:', error);
      setMessage('Error marking attendance via QR');
      setMessageType('danger');
    }
  };

  // Fingerprint scan placeholder - integrate with actual SDK as available
  const openFingerprintScan = async (action) => {
    setIsFingerprintScanning(true);
    try {
      const api = window && window.FingerprintDevice;
      if (!api || typeof api.scan !== 'function') {
        setMessage('Fingerprint scanner not detected. Please integrate device SDK at window.FingerprintDevice.scan().');
        setMessageType('warning');
        return;
      }
      // Expected: { teacherId?: string, email?: string }
      const result = await api.scan();
      if (!result) {
        setMessage('Fingerprint scan failed or was cancelled');
        setMessageType('warning');
        return;
      }
      const { teacherId, email } = result;
      let teacher = null;
      if (teacherId) teacher = teachers.find(t => t.id === teacherId);
      if (!teacher && email) teacher = teachers.find(t => String(t.email).toLowerCase() === String(email).toLowerCase());
      if (!teacher) {
        setMessage('Fingerprint does not match any teacher');
        setMessageType('warning');
        return;
      }
      await markAttendanceInstant(teacher, action);
    } catch (err) {
      console.error('Fingerprint scan error', err);
      setMessage('Error during fingerprint scan');
      setMessageType('danger');
    } finally {
      setIsFingerprintScanning(false);
    }
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
    <div className="container-fluid px-2 px-md-3">
      <h2 className="mb-3 mb-md-4 fs-4 fs-md-3">Teacher Attendance</h2>
      
      {message && (
        <Alert variant={messageType} onClose={() => setMessage('')} dismissible>
          {message}
        </Alert>
      )}

      <Row className="mb-4">
        <Col xs={12} md={4} className="mb-3 mb-md-0">
          <Form.Group>
            <Form.Label>Select Date</Form.Label>
            <Form.Control
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col xs={12} md={8}>
          <div className="d-flex align-items-end gap-2 flex-wrap">
            <Button variant="primary" onClick={fetchTeacherAttendance} className="mb-2 mb-md-0">
              <i className="fas fa-sync-alt me-2"></i>
              <span className="d-none d-sm-inline">Refresh</span>
              <span className="d-sm-none">Refresh</span>
            </Button>
            <Button variant="dark" onClick={() => openQrScan('arrival')} className="mb-2 mb-md-0">
              <i className="fas fa-qrcode me-2"></i>
              <span className="d-none d-sm-inline">Scan QR - Arrival</span>
              <span className="d-sm-none">QR Arrival</span>
            </Button>
            <Button variant="secondary" onClick={() => openQrScan('departure')} className="mb-2 mb-md-0">
              <i className="fas fa-qrcode me-2"></i>
              <span className="d-none d-sm-inline">Scan QR - Departure</span>
              <span className="d-sm-none">QR Departure</span>
            </Button>
            <Button variant="outline-dark" onClick={() => openFingerprintScan('arrival')} className="mb-2 mb-md-0">
              <i className="fas fa-fingerprint me-2"></i>
              <span className="d-none d-md-inline">Fingerprint - Arrival</span>
              <span className="d-md-none">FP Arrival</span>
            </Button>
            <Button variant="outline-secondary" onClick={() => openFingerprintScan('departure')} className="mb-2 mb-md-0">
              <i className="fas fa-fingerprint me-2"></i>
              <span className="d-none d-md-inline">Fingerprint - Departure</span>
              <span className="d-md-none">FP Departure</span>
            </Button>
            <Button variant="outline-primary" onClick={() => window.location.assign('/admin/teacher-qr-cards')} className="mb-2 mb-md-0">
              <i className="fas fa-print me-2"></i>
              <span className="d-none d-md-inline">Print Teacher QR Cards</span>
              <span className="d-md-none">Print QR</span>
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col xs={6} sm={6} md={3} className="mb-3 mb-md-0">
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title className="text-primary">
                <i className="fas fa-chalkboard-teacher fa-2x"></i>
              </Card.Title>
              <Card.Text>
                <h3 className="mb-1">{stats.totalTeachers}</h3>
                <p className="text-muted mb-0 small">Total Teachers</p>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} md={3} className="mb-3 mb-md-0">
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title className="text-success">
                <i className="fas fa-check-circle fa-2x"></i>
              </Card.Title>
              <Card.Text>
                <h3 className="mb-1">{stats.presentTeachers}</h3>
                <p className="text-muted mb-0 small">Present</p>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} md={3} className="mb-3 mb-md-0">
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title className="text-danger">
                <i className="fas fa-times-circle fa-2x"></i>
              </Card.Title>
              <Card.Text>
                <h3 className="mb-1">{stats.absentTeachers}</h3>
                <p className="text-muted mb-0 small">Absent</p>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} md={3} className="mb-3 mb-md-0">
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title className="text-info">
                <i className="fas fa-percentage fa-2x"></i>
              </Card.Title>
              <Card.Text>
                <h3 className="mb-1">{stats.attendancePercentage.toFixed(1)}%</h3>
                <p className="text-muted mb-0 small">Attendance Rate</p>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Teacher Attendance Management - {selectedDate}</h5>
        </Card.Header>
        <Card.Body className="p-0 p-md-3">
          {loading ? (
            <div className="text-center p-4">Loading...</div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="d-none d-md-block">
                <div className="table-responsive">
                  <Table striped bordered hover className="mb-0">
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
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="d-md-none">
                {teachers.map(teacher => {
                  const attendance = getTeacherAttendanceStatus(teacher.id);
                  return (
                    <Card key={teacher.id} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1 fw-bold">{teacher.name}</h6>
                            <small className="text-muted d-block">{teacher.email}</small>
                          </div>
                          <Badge bg={attendance.status === 'present' ? 'success' : 'danger'}>
                            {attendance.status}
                          </Badge>
                        </div>
                        
                        <Row className="mt-3">
                          <Col xs={6} className="mb-2">
                            <small className="text-muted d-block">Arrival Time</small>
                            {attendance.arrivalTime ? (
                              <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold">{formatTo12Hour(attendance.arrivalTime)}</span>
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
                              <span className="text-muted">-</span>
                            )}
                          </Col>
                          <Col xs={6} className="mb-2">
                            <small className="text-muted d-block">Departure Time</small>
                            {attendance.departureTime ? (
                              <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold">{formatTo12Hour(attendance.departureTime)}</span>
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
                              <span className="text-muted">-</span>
                            )}
                          </Col>
                        </Row>

                        <div className="d-flex flex-wrap gap-2 mt-3">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => openStatusModal(teacher.id, attendance.status)}
                          >
                            <i className="fas fa-edit me-1"></i>
                            Edit Status
                          </Button>
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
                            <Badge bg="info">Complete</Badge>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Time Input Modal */}
      <Modal show={showTimeModal} onHide={() => setShowTimeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fs-md-5">
            {editingTeacher?.action === 'edit' 
              ? `Edit ${editingTimeType === 'arrival' ? 'Arrival' : 'Departure'} Time`
              : editingTeacher?.action === 'arrival' 
                ? 'Mark Arrival' 
                : 'Mark Departure'
            }
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 p-md-4">
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

              <Form.Text className="text-muted d-block mt-2">
                {useTimePicker 
                  ? "Select time using the time picker (24-hour format will be converted to 12-hour)"
                  : "Enter time in 12-hour format (e.g., 9:30 AM, 2:15 PM)"
                }
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="p-2 p-md-3">
          <Button variant="secondary" onClick={() => setShowTimeModal(false)} size="sm" className="w-50 w-md-auto">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleTimeSubmit} size="sm" className="w-50 w-md-auto">
            {editingTeacher?.action === 'edit' 
              ? `Update ${editingTimeType === 'arrival' ? 'Arrival' : 'Departure'}`
              : editingTeacher?.action === 'arrival' 
                ? 'Mark Arrival' 
                : 'Mark Departure'
            }
          </Button>
        </Modal.Footer>
      </Modal>

      {/* QR Scan Modal */}
      <Modal show={showQrModal} onHide={closeQrScan} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fs-md-5">QR Scan - {qrAction === 'arrival' ? 'Arrival' : 'Departure'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-2 p-md-3">
          <div className="d-flex justify-content-center">
            <video ref={videoRef} style={{ width: '100%', maxWidth: 600, borderRadius: 8 }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          <div className="mt-2 text-muted small text-center">
            Point the camera at a teacher QR that contains teacher ID or email.
          </div>
        </Modal.Body>
        <Modal.Footer className="p-2 p-md-3">
          <Button variant="secondary" onClick={closeQrScan} size="sm" className="w-100 w-md-auto">Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Fingerprint scanning indicator */}
      <Modal show={isFingerprintScanning} onHide={() => setIsFingerprintScanning(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fs-md-5">Scanning Fingerprint…</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 p-md-4">
          <div className="text-center">Please place finger on the scanner.</div>
        </Modal.Body>
      </Modal>

      {/* Status Edit Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fs-md-5">Edit Attendance Status</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 p-md-4">
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
              <Form.Text className="text-muted d-block mt-2">
                Changing to "Absent" will clear arrival and departure times.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="p-2 p-md-3">
          <Button variant="secondary" onClick={() => setShowStatusModal(false)} size="sm" className="w-50 w-md-auto">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleStatusSubmit} size="sm" className="w-50 w-md-auto">
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TeacherAttendance;
