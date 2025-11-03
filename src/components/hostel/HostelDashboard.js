import React, { useEffect, useState } from 'react';
import { Tabs, Tab, Card, Row, Col, Form, Button, Table, Alert, Badge } from 'react-bootstrap';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ModuleSidebar from '../common/ModuleSidebar';

const gradientHeader = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  border: 'none'
};

const HostelDashboard = () => {
  const { logout, userRole } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [residents, setResidents] = useState([]); // allocations
  const [payments, setPayments] = useState([]);

  const [roomForm, setRoomForm] = useState({ number: '', capacity: 2, type: 'standard', status: 'available' });
  const [allocationForm, setAllocationForm] = useState({ studentId: '', roomId: '', status: 'active' });
  const [paymentForm, setPaymentForm] = useState({ studentId: '', amount: '', month: '', status: 'unpaid' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [stuSnap, roomSnap, resSnap, paySnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role','==','student'))),
        getDocs(collection(db, 'hostelRooms')),
        getDocs(collection(db, 'hostelAllocations')),
        getDocs(collection(db, 'hostelPayments'))
      ]);
      setStudents(stuSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setRooms(roomSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setResidents(resSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPayments(paySnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setMessage('Error loading hostel data');
      setMessageType('danger');
    } finally { setLoading(false); }
  };

  const addRoom = async () => {
    if (!roomForm.number) { setMessage('Enter room number'); setMessageType('warning'); return; }
    try {
      await addDoc(collection(db, 'hostelRooms'), {
        ...roomForm,
        capacity: Number(roomForm.capacity) || 0,
        createdAt: serverTimestamp()
      });
      setRoomForm({ number: '', capacity: 2, type: 'standard', status: 'available' });
      setMessage('Room added'); setMessageType('success'); loadAll();
    } catch(e){ setMessage('Failed to add room'); setMessageType('danger'); }
  };

  const addAllocation = async () => {
    if (!allocationForm.studentId || !allocationForm.roomId) { setMessage('Select student and room'); setMessageType('warning'); return; }
    try {
      await addDoc(collection(db, 'hostelAllocations'), { ...allocationForm, createdAt: serverTimestamp() });
      setAllocationForm({ studentId: '', roomId: '', status: 'active' });
      setMessage('Allocation saved'); setMessageType('success'); loadAll();
    } catch(e){ setMessage('Failed to allocate'); setMessageType('danger'); }
  };

  const endAllocation = async (id) => {
    try { await updateDoc(doc(db, 'hostelAllocations', id), { status: 'ended', endedAt: serverTimestamp() }); setResidents(prev => prev.map(r => r.id===id?{...r, status:'ended'}:r)); }
    catch(e){ setMessage('Failed to update'); setMessageType('danger'); }
  };

  const deleteAllocation = async (id) => {
    try { await deleteDoc(doc(db, 'hostelAllocations', id)); setResidents(prev => prev.filter(r => r.id!==id)); }
    catch(e){ setMessage('Failed to delete'); setMessageType('danger'); }
  };

  const addPayment = async () => {
    if (!paymentForm.studentId || !paymentForm.amount || !paymentForm.month) { setMessage('Fill all payment fields'); setMessageType('warning'); return; }
    try {
      await addDoc(collection(db, 'hostelPayments'), { ...paymentForm, amount: Number(paymentForm.amount)||0, createdAt: serverTimestamp() });
      setPaymentForm({ studentId: '', amount: '', month: '', status: 'unpaid' });
      setMessage('Payment recorded'); setMessageType('success'); loadAll();
    } catch(e){ setMessage('Failed to add payment'); setMessageType('danger'); }
  };

  const markPaymentPaid = async (id) => {
    try { await updateDoc(doc(db, 'hostelPayments', id), { status: 'paid', paidAt: serverTimestamp() }); setPayments(prev => prev.map(p => p.id===id?{...p, status:'paid'}:p)); }
    catch(e){ setMessage('Failed to update'); setMessageType('danger'); }
  };

  const handleLogout = async () => { try { await logout(); navigate('/login'); } catch(e){} };

  const getStudentName = (id) => (students.find(s => s.id===id)?.name) || 'N/A';
  const getRoomNumber = (id) => (rooms.find(r => r.id===id)?.number) || 'N/A';

  const isAdminView = userRole === 'admin';

  return (
    <div className="d-flex min-vh-100">
      {!isAdminView && (
        <div className="sidebar-overlay" onClick={() => { const s=document.querySelector('.sidebar-enhanced'); const o=document.querySelector('.sidebar-overlay'); if (s&&o){s.classList.remove('show'); o.classList.remove('show');}}}></div>
      )}
      {!isAdminView && (
      <ModuleSidebar
        title="Hostel"
        onLogout={handleLogout}
        items={[
          { key: 'overview', label: 'Overview', icon: 'fas fa-tachometer-alt', onClick: () => setActiveTab('overview') },
          { key: 'rooms', label: 'Rooms', icon: 'fas fa-door-open', onClick: () => setActiveTab('rooms') },
          { key: 'residents', label: 'Residents', icon: 'fas fa-users', onClick: () => setActiveTab('residents') },
          { key: 'allocations', label: 'Allocations', icon: 'fas fa-user-check', onClick: () => setActiveTab('allocations') },
          { key: 'payments', label: 'Payments', icon: 'fas fa-wallet', onClick: () => setActiveTab('payments') },
          { key: 'reports', label: 'Reports', icon: 'fas fa-chart-line', onClick: () => setActiveTab('reports') }
        ]}
      />)}
      <div className="flex-grow-1 d-flex flex-column container-enhanced">
        <div className="mb-4">
          <h2 className="mb-1" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            <i className="fas fa-hotel me-3"></i>
            Hostel Management
          </h2>
          <p className="text-muted mb-0">Manage hostel rooms, residents, allocations and payments</p>
        </div>

        {message && (
          <Alert variant={messageType} className={`alert-enhanced alert-${messageType}`} onClose={() => setMessage('')} dismissible>
            {message}
          </Alert>
        )}

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')} className="mb-4 nav-tabs-enhanced">
          <Tab eventKey="overview" title="Overview">
            <Row>
              <Col md={4}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Rooms</strong></Card.Header>
                  <Card.Body>
                    <h3 className="mb-0">{rooms.length}</h3>
                    <small className="text-muted">Total rooms</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Active Residents</strong></Card.Header>
                  <Card.Body>
                    <h3 className="mb-0">{residents.filter(r=>r.status==='active').length}</h3>
                    <small className="text-muted">Currently allocated</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Payments</strong></Card.Header>
                  <Card.Body>
                    <h3 className="mb-0">{payments.filter(p=>p.status!=='paid').length}</h3>
                    <small className="text-muted">Pending payments</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="rooms" title="Rooms">
            <Row>
              <Col md={5}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Add Room</strong></Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Room Number</Form.Label>
                        <Form.Control value={roomForm.number} onChange={(e)=>setRoomForm({...roomForm, number: e.target.value})} placeholder="e.g., A-101"/>
                      </Form.Group>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Capacity</Form.Label>
                            <Form.Control type="number" value={roomForm.capacity} onChange={(e)=>setRoomForm({...roomForm, capacity: e.target.value})}/>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Form.Select value={roomForm.type} onChange={(e)=>setRoomForm({...roomForm, type: e.target.value})}>
                              <option value="standard">Standard</option>
                              <option value="deluxe">Deluxe</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select value={roomForm.status} onChange={(e)=>setRoomForm({...roomForm, status: e.target.value})}>
                          <option value="available">Available</option>
                          <option value="maintenance">Maintenance</option>
                        </Form.Select>
                      </Form.Group>
                      <Button variant="success btn-enhanced" onClick={addRoom} disabled={loading}>
                        <i className="fas fa-plus me-2"></i>
                        Add Room
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={7}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Rooms List</strong></Card.Header>
                  <Card.Body>
                    <Table responsive striped bordered hover size="sm" className="table-enhanced">
                      <thead>
                        <tr>
                          <th>Number</th>
                          <th>Capacity</th>
                          <th>Type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.map(r => (
                          <tr key={r.id}>
                            <td>{r.number}</td>
                            <td>{r.capacity}</td>
                            <td>{r.type}</td>
                            <td><Badge bg={r.status==='available'?'success': 'warning'}>{r.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="residents" title="Residents">
            <Card className="card-enhanced">
              <Card.Header style={gradientHeader}><strong>Residents</strong></Card.Header>
              <Card.Body>
                <Table responsive striped bordered hover size="sm" className="table-enhanced">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Room</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residents.map(r => (
                      <tr key={r.id}>
                        <td>{getStudentName(r.studentId)}</td>
                        <td>{getRoomNumber(r.roomId)}</td>
                        <td><Badge bg={r.status==='active'?'success':'secondary'}>{r.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="allocations" title="Allocations">
            <Row>
              <Col md={5}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Allocate Room</strong></Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Student</Form.Label>
                        <Form.Select value={allocationForm.studentId} onChange={(e)=>setAllocationForm({...allocationForm, studentId: e.target.value})}>
                          <option value="">Select student</option>
                          {students.map(s => (<option key={s.id} value={s.id}>{s.name} {s.rollNumber?`(${s.rollNumber})`:''}</option>))}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Room</Form.Label>
                        <Form.Select value={allocationForm.roomId} onChange={(e)=>setAllocationForm({...allocationForm, roomId: e.target.value})}>
                          <option value="">Select room</option>
                          {rooms.map(r => (<option key={r.id} value={r.id}>{r.number}</option>))}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select value={allocationForm.status} onChange={(e)=>setAllocationForm({...allocationForm, status: e.target.value})}>
                          <option value="active">Active</option>
                          <option value="ended">Ended</option>
                        </Form.Select>
                      </Form.Group>
                      <Button variant="success btn-enhanced" onClick={addAllocation} disabled={loading}>
                        <i className="fas fa-plus me-2"></i>
                        Save Allocation
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={7}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Allocations List</strong></Card.Header>
                  <Card.Body>
                    <Table responsive striped bordered hover size="sm" className="table-enhanced">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Room</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {residents.map(r => (
                          <tr key={r.id}>
                            <td>{getStudentName(r.studentId)}</td>
                            <td>{getRoomNumber(r.roomId)}</td>
                            <td><Badge bg={r.status==='active'?'success':'secondary'}>{r.status}</Badge></td>
                            <td className="d-flex gap-2">
                              {r.status==='active' && (
                                <Button size="sm" variant="outline-warning" onClick={()=>endAllocation(r.id)}>
                                  <i className="fas fa-stop"></i>
                                </Button>
                              )}
                              <Button size="sm" variant="outline-danger" onClick={()=>deleteAllocation(r.id)}>
                                <i className="fas fa-trash"></i>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="payments" title="Payments">
            <Row>
              <Col md={5}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Add Payment</strong></Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Student</Form.Label>
                        <Form.Select value={paymentForm.studentId} onChange={(e)=>setPaymentForm({...paymentForm, studentId: e.target.value})}>
                          <option value="">Select student</option>
                          {students.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                        </Form.Select>
                      </Form.Group>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Amount (PKR)</Form.Label>
                            <Form.Control type="number" value={paymentForm.amount} onChange={(e)=>setPaymentForm({...paymentForm, amount: e.target.value})}/>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Month</Form.Label>
                            <Form.Control value={paymentForm.month} onChange={(e)=>setPaymentForm({...paymentForm, month: e.target.value})} placeholder="e.g., 2025-11"/>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select value={paymentForm.status} onChange={(e)=>setPaymentForm({...paymentForm, status: e.target.value})}>
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                        </Form.Select>
                      </Form.Group>
                      <Button variant="success btn-enhanced" onClick={addPayment} disabled={loading}>
                        <i className="fas fa-plus me-2"></i>
                        Save Payment
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={7}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Payments List</strong></Card.Header>
                  <Card.Body>
                    <Table responsive striped bordered hover size="sm" className="table-enhanced">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Amount</th>
                          <th>Month</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(p => (
                          <tr key={p.id}>
                            <td>{getStudentName(p.studentId)}</td>
                            <td>PKR {(Number(p.amount)||0).toLocaleString()}</td>
                            <td>{p.month}</td>
                            <td><Badge bg={p.status==='paid'?'success':'warning'}>{p.status}</Badge></td>
                            <td>
                              {p.status!=='paid' && (
                                <Button size="sm" variant="outline-success" onClick={()=>markPaymentPaid(p.id)}>
                                  <i className="fas fa-check"></i>
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="reports" title="Reports">
            <Card className="card-enhanced">
              <Card.Header style={gradientHeader}><strong>Reports</strong></Card.Header>
              <Card.Body>
                <p className="text-muted mb-0">Summary and export features (coming soon).</p>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default HostelDashboard;
