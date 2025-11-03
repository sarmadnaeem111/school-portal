import React, { useEffect, useState } from 'react';
import { Tabs, Tab, Card, Row, Col, Form, Button, Table, Alert, Badge, Spinner } from 'react-bootstrap';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const gradientHeader = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  border: 'none'
};

const TransportDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [trips, setTrips] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);

  const [vehicleForm, setVehicleForm] = useState({ number: '', model: '', capacity: 40, status: 'active' });
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', licenseNo: '', status: 'active' });
  const [routeForm, setRouteForm] = useState({ title: '', startPoint: '', endPoint: '', stops: '' });
  const [assignmentForm, setAssignmentForm] = useState({ studentId: '', vehicleId: '', driverId: '', routeId: '', status: 'active' });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [vehSnap, driSnap, rouSnap, asgSnap, tripSnap, paySnap, stuSnap] = await Promise.all([
        getDocs(collection(db, 'transportVehicles')),
        getDocs(collection(db, 'transportDrivers')),
        getDocs(collection(db, 'transportRoutes')),
        getDocs(collection(db, 'transportAssignments')),
        getDocs(collection(db, 'transportTrips')),
        getDocs(collection(db, 'transportPayments')),
        getDocs(query(collection(db, 'users'), where('role','==','student')))
      ]);

      setVehicles(vehSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setDrivers(driSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setRoutes(rouSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAssignments(asgSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTrips(tripSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPayments(paySnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStudents(stuSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setMessage('Error loading transport data');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async () => {
    if (!vehicleForm.number) return;
    try {
      await addDoc(collection(db, 'transportVehicles'), {
        ...vehicleForm,
        capacity: Number(vehicleForm.capacity) || 0,
        createdAt: serverTimestamp()
      });
      setVehicleForm({ number: '', model: '', capacity: 40, status: 'active' });
      setMessage('Vehicle added');
      setMessageType('success');
      loadAll();
    } catch (e) {
      setMessage('Failed to add vehicle');
      setMessageType('danger');
    }
  };

  const addDriver = async () => {
    if (!driverForm.name) return;
    try {
      await addDoc(collection(db, 'transportDrivers'), {
        ...driverForm,
        createdAt: serverTimestamp()
      });
      setDriverForm({ name: '', phone: '', licenseNo: '', status: 'active' });
      setMessage('Driver added');
      setMessageType('success');
      loadAll();
    } catch (e) {
      setMessage('Failed to add driver');
      setMessageType('danger');
    }
  };

  const addRoute = async () => {
    if (!routeForm.title) return;
    try {
      const stops = routeForm.stops
        ? routeForm.stops.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      await addDoc(collection(db, 'transportRoutes'), {
        title: routeForm.title,
        startPoint: routeForm.startPoint,
        endPoint: routeForm.endPoint,
        stops,
        createdAt: serverTimestamp()
      });
      setRouteForm({ title: '', startPoint: '', endPoint: '', stops: '' });
      setMessage('Route added');
      setMessageType('success');
      loadAll();
    } catch (e) {
      setMessage('Failed to add route');
      setMessageType('danger');
    }
  };

  const addAssignment = async () => {
    if (!assignmentForm.studentId || !assignmentForm.vehicleId || !assignmentForm.driverId || !assignmentForm.routeId) {
      setMessage('Please select student, vehicle, driver, and route');
      setMessageType('warning');
      return;
    }
    try {
      await addDoc(collection(db, 'transportAssignments'), {
        ...assignmentForm,
        createdAt: serverTimestamp()
      });
      setAssignmentForm({ studentId: '', vehicleId: '', driverId: '', routeId: '', status: 'active' });
      setMessage('Assignment added');
      setMessageType('success');
      loadAll();
    } catch (e) {
      setMessage('Failed to add assignment');
      setMessageType('danger');
    }
  };

  const deleteAssignment = async (id) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'transportAssignments', id));
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      setMessage('Failed to delete assignment');
      setMessageType('danger');
    }
  };

  const lookupName = (id, list, key) => {
    const found = list.find(x => x.id === id);
    if (!found) return 'N/A';
    return key ? (found[key] || 'N/A') : (found.name || found.title || found.number || 'N/A');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      setMessage('Logout failed. Please try again.');
      setMessageType('danger');
    }
  };

  return (
    <div className="animate-fadeInUp">
      <div className="mb-4">
        <Row className="align-items-center">
          <Col>
            <h2 className="mb-1" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              <i className="fas fa-bus me-3"></i>
              Transport Management
            </h2>
            <p className="text-muted mb-0">Manage vehicles, drivers, routes, assignments, trips, and payments</p>
          </Col>
          <Col xs="auto">
            <Button 
              variant="outline-danger btn-enhanced" 
              onClick={handleLogout}
              title="Logout"
            >
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </Button>
          </Col>
        </Row>
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
                <Card.Header style={gradientHeader}><strong>Vehicles</strong></Card.Header>
                <Card.Body>
                  <h3 className="mb-0">{vehicles.length}</h3>
                  <small className="text-muted">Total vehicles</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Drivers</strong></Card.Header>
                <Card.Body>
                  <h3 className="mb-0">{drivers.length}</h3>
                  <small className="text-muted">Total drivers</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Routes</strong></Card.Header>
                <Card.Body>
                  <h3 className="mb-0">{routes.length}</h3>
                  <small className="text-muted">Active routes</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="vehicles" title="Vehicles">
          <Row>
            <Col md={5}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Add Vehicle</strong></Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Vehicle Number</Form.Label>
                      <Form.Control value={vehicleForm.number} onChange={(e)=>setVehicleForm({...vehicleForm, number: e.target.value})} placeholder="e.g., ABC-1234"/>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Model</Form.Label>
                      <Form.Control value={vehicleForm.model} onChange={(e)=>setVehicleForm({...vehicleForm, model: e.target.value})} placeholder="e.g., Toyota Coaster"/>
                    </Form.Group>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Capacity</Form.Label>
                          <Form.Control type="number" value={vehicleForm.capacity} onChange={(e)=>setVehicleForm({...vehicleForm, capacity: e.target.value})}/>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Status</Form.Label>
                          <Form.Select value={vehicleForm.status} onChange={(e)=>setVehicleForm({...vehicleForm, status: e.target.value})}>
                            <option value="active">Active</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="inactive">Inactive</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Button variant="success btn-enhanced" onClick={addVehicle} disabled={loading}>
                      <i className="fas fa-plus me-2"></i>
                      Add Vehicle
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            <Col md={7}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Vehicles List</strong></Card.Header>
                <Card.Body>
                  <Table responsive striped bordered hover size="sm" className="table-enhanced">
                    <thead>
                      <tr>
                        <th>Number</th>
                        <th>Model</th>
                        <th>Capacity</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map(v => (
                        <tr key={v.id}>
                          <td>{v.number}</td>
                          <td>{v.model}</td>
                          <td>{v.capacity}</td>
                          <td><Badge bg={v.status === 'active' ? 'success' : v.status === 'maintenance' ? 'warning' : 'secondary'}>{v.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="drivers" title="Drivers">
          <Row>
            <Col md={5}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Add Driver</strong></Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control value={driverForm.name} onChange={(e)=>setDriverForm({...driverForm, name: e.target.value})} placeholder="Driver name"/>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control value={driverForm.phone} onChange={(e)=>setDriverForm({...driverForm, phone: e.target.value})} placeholder="e.g., +92XXXXXXXX"/>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>License No</Form.Label>
                      <Form.Control value={driverForm.licenseNo} onChange={(e)=>setDriverForm({...driverForm, licenseNo: e.target.value})} placeholder="License number"/>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select value={driverForm.status} onChange={(e)=>setDriverForm({...driverForm, status: e.target.value})}>
                        <option value="active">Active</option>
                        <option value="on_leave">On Leave</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                    <Button variant="success btn-enhanced" onClick={addDriver} disabled={loading}>
                      <i className="fas fa-plus me-2"></i>
                      Add Driver
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            <Col md={7}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Drivers List</strong></Card.Header>
                <Card.Body>
                  <Table responsive striped bordered hover size="sm" className="table-enhanced">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>License</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drivers.map(d => (
                        <tr key={d.id}>
                          <td>{d.name}</td>
                          <td>{d.phone}</td>
                          <td>{d.licenseNo}</td>
                          <td><Badge bg={d.status === 'active' ? 'success' : d.status === 'on_leave' ? 'warning' : 'secondary'}>{d.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="routes" title="Routes">
          <Row>
            <Col md={5}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Add Route</strong></Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Route Title</Form.Label>
                      <Form.Control value={routeForm.title} onChange={(e)=>setRouteForm({...routeForm, title: e.target.value})} placeholder="e.g., North Zone - Morning"/>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Point</Form.Label>
                      <Form.Control value={routeForm.startPoint} onChange={(e)=>setRouteForm({...routeForm, startPoint: e.target.value})} placeholder="e.g., Main Depot"/>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>End Point</Form.Label>
                      <Form.Control value={routeForm.endPoint} onChange={(e)=>setRouteForm({...routeForm, endPoint: e.target.value})} placeholder="e.g., School Gate A"/>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Stops (comma separated)</Form.Label>
                      <Form.Control value={routeForm.stops} onChange={(e)=>setRouteForm({...routeForm, stops: e.target.value})} placeholder="Stop1, Stop2, Stop3"/>
                    </Form.Group>
                    <Button variant="success btn-enhanced" onClick={addRoute} disabled={loading}>
                      <i className="fas fa-plus me-2"></i>
                      Add Route
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            <Col md={7}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Routes List</strong></Card.Header>
                <Card.Body>
                  <Table responsive striped bordered hover size="sm" className="table-enhanced">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Stops</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routes.map(r => (
                        <tr key={r.id}>
                          <td>{r.title}</td>
                          <td>{r.startPoint}</td>
                          <td>{r.endPoint}</td>
                          <td>{Array.isArray(r.stops) ? r.stops.join(', ') : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="assignments" title="Assignments">
          <Row>
            <Col md={5}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Add Assignment</strong></Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Student</Form.Label>
                      <Form.Select value={assignmentForm.studentId} onChange={(e)=>setAssignmentForm({...assignmentForm, studentId: e.target.value})}>
                        <option value="">Select a student</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.name} {s.rollNumber ? `(${s.rollNumber})` : ''}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Vehicle</Form.Label>
                      <Form.Select value={assignmentForm.vehicleId} onChange={(e)=>setAssignmentForm({...assignmentForm, vehicleId: e.target.value})}>
                        <option value="">Select a vehicle</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.number} - {v.model}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Driver</Form.Label>
                      <Form.Select value={assignmentForm.driverId} onChange={(e)=>setAssignmentForm({...assignmentForm, driverId: e.target.value})}>
                        <option value="">Select a driver</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name} - {d.phone}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Route</Form.Label>
                      <Form.Select value={assignmentForm.routeId} onChange={(e)=>setAssignmentForm({...assignmentForm, routeId: e.target.value})}>
                        <option value="">Select a route</option>
                        {routes.map(r => (
                          <option key={r.id} value={r.id}>{r.title}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select value={assignmentForm.status} onChange={(e)=>setAssignmentForm({...assignmentForm, status: e.target.value})}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                    <Button variant="success btn-enhanced" onClick={addAssignment} disabled={loading}>
                      <i className="fas fa-plus me-2"></i>
                      Add Assignment
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            <Col md={7}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Assignments List</strong></Card.Header>
                <Card.Body>
                  <Table responsive striped bordered hover size="sm" className="table-enhanced">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Vehicle</th>
                        <th>Driver</th>
                        <th>Route</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map(a => (
                        <tr key={a.id}>
                          <td>{lookupName(a.studentId, students, 'name')}</td>
                          <td>{lookupName(a.vehicleId, vehicles, 'number')}</td>
                          <td>{lookupName(a.driverId, drivers, 'name')}</td>
                          <td>{lookupName(a.routeId, routes, 'title')}</td>
                          <td><Badge bg={a.status === 'active' ? 'success' : 'secondary'}>{a.status || 'active'}</Badge></td>
                          <td>
                            <Button size="sm" variant="outline-danger" onClick={()=>deleteAssignment(a.id)}>
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

        <Tab eventKey="trips" title="Trips">
          <Card className="card-enhanced">
            <Card.Header style={gradientHeader}><strong>Trips</strong></Card.Header>
            <Card.Body>
              <p className="text-muted mb-0">Log daily trips and attendance. (Coming soon)</p>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="payments" title="Payments">
          <Card className="card-enhanced">
            <Card.Header style={gradientHeader}><strong>Payments</strong></Card.Header>
            <Card.Body>
              <p className="text-muted mb-0">Record transport fee payments. (Coming soon)</p>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default TransportDashboard;


