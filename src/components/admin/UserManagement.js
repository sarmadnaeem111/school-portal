import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Row, Col, Card, Tab, Tabs } from 'react-bootstrap';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, signOut, getAuth } from 'firebase/auth';
import { initializeApp, deleteApp, getApps } from 'firebase/app';
import app, { auth, db } from '../../firebase/config';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    phone: '',
    address: '',
    classId: '',
    parentId: '',
    rollNumber: '',
    gender: '',
    status: 'active'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [usersSnapshot, classesSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'classes'))
      ]);
      setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassName = (classId) => {
    if (!classId) return 'N/A';
    const cls = classes.find(c => c.id === classId);
    if (!cls) return classId;
    return `${cls.name}${cls.section ? ' - ' + cls.section : ''}${cls.grade ? ' (Grade ' + cls.grade + ')' : ''}`;
  };

  // Helper function to get parent UID from email
  const getParentUidFromEmail = async (parentEmail) => {
    if (!parentEmail) return null;
    
    try {
      const usersQuery = query(collection(db, 'users'), where('email', '==', parentEmail), where('role', '==', 'parent'));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        throw new Error(`Parent with email ${parentEmail} not found`);
      }
      
      const parentDoc = usersSnapshot.docs[0];
      return parentDoc.id; // This is the UID
    } catch (error) {
      console.error('Error finding parent:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    console.log('Form validation check:', {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role
    });
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (submitting) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }
    
    setSubmitting(true);
    
    // Store the current admin user info before creating new user
    const currentAdminUser = auth.currentUser;
    const adminEmail = currentAdminUser?.email;
    let newlyCreatedUserId = null;
    
    try {
      if (editingUser) {
        // Update existing user
        let processedData = { ...formData }; // keep parentId as the email string provided
        await updateDoc(doc(db, 'users', editingUser.id), processedData);
      } else {
        // Create new user without affecting current admin session using a secondary app
        console.log('Creating new user with data:', formData);
        const existingSecondary = getApps().find(a => a.name === 'Secondary');
        const secondaryApp = existingSecondary || initializeApp(app.options, 'Secondary');
        const secondaryAuth = getAuth(secondaryApp);

        try {
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
          newlyCreatedUserId = userCredential.user.uid;
          console.log('User created in Firebase Auth (secondary):', newlyCreatedUserId);
          
          await updateProfile(userCredential.user, {
            displayName: formData.name
          });
          console.log('User profile updated (secondary)');

          let processedUserData = { ...formData }; // keep parentId as the email string provided

          const userDocData = {
            uid: newlyCreatedUserId,
            email: formData.email,
            name: formData.name,
            role: formData.role,
            phone: formData.phone || '',
            address: formData.address || '',
            classId: formData.classId || '',
            parentId: processedUserData.parentId || '',
            rollNumber: formData.rollNumber || '',
            gender: formData.gender || '',
            status: formData.status || 'active',
            createdAt: new Date()
          };

          console.log('Saving user document to Firestore:', userDocData);
          await setDoc(doc(db, 'users', newlyCreatedUserId), userDocData);
          console.log('User document saved successfully');
        } finally {
          try {
            await signOut(secondaryAuth);
          } catch (_) {}
          // Clean up secondary app to free resources
          try {
            await deleteApp(secondaryApp);
          } catch (_) {}
        }
      }
      
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        phone: '',
        address: '',
        classId: '',
        parentId: '',
        rollNumber: '',
        gender: '',
        status: 'active'
      });
      fetchUsers();
      
      // Show success message
      if (editingUser) {
        alert('User updated successfully!');
      } else {
        alert('User created successfully!');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'student',
      phone: user.phone || '',
      address: user.address || '',
      classId: user.classId || '',
      parentId: user.parentId || '',
      rollNumber: user.rollNumber || '',
      gender: user.gender || '',
      status: user.status || 'active'
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const getUsersByRole = (role) => {
    return users.filter(user => user.role === role);
  };

  const handleSetStatus = async (userId, status) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>User Management</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Add New User
        </Button>
      </div>

      <Tabs defaultActiveKey="students" className="mb-3">
        <Tab eventKey="students" title={`Students (${getUsersByRole('student').length})`}>
          <UserTable 
            users={getUsersByRole('student')} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            role="student"
            getClassName={getClassName}
            onSetStatus={handleSetStatus}
          />
        </Tab>
        <Tab eventKey="teachers" title={`Teachers (${getUsersByRole('teacher').length})`}>
          <UserTable 
            users={getUsersByRole('teacher')} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            role="teacher"
          />
        </Tab>
        <Tab eventKey="parents" title={`Parents (${getUsersByRole('parent').length})`}>
          <UserTable 
            users={getUsersByRole('parent')} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            role="parent"
          />
        </Tab>
        <Tab eventKey="transport" title={`Transport (${getUsersByRole('transport').length})`}>
          <UserTable 
            users={getUsersByRole('transport')} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            role="transport"
          />
        </Tab>
        <Tab eventKey="accounts" title={`Accounts (${getUsersByRole('accounts').length})`}>
          <UserTable 
            users={getUsersByRole('accounts')} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            role="accounts"
          />
        </Tab>
        <Tab eventKey="library" title={`Library (${getUsersByRole('library').length})`}>
          <UserTable 
            users={getUsersByRole('library')} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            role="library"
          />
        </Tab>
        <Tab eventKey="hostel" title={`Hostel (${getUsersByRole('hostel').length})`}>
          <UserTable 
            users={getUsersByRole('hostel')} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            role="hostel"
          />
        </Tab>
      </Tabs>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? 'Edit User' : 'Add New User'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="library">Library</option>
                    <option value="transport">Transport</option>
                    <option value="accounts">Accounts</option>
                    <option value="hostel">Hostel</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            {formData.role === 'student' && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Class</Form.Label>
                    <Form.Select
                      value={formData.classId}
                      onChange={(e) => setFormData({...formData, classId: e.target.value})}
                    >
                      <option value="">Select a Class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} - {cls.section} (Grade {cls.grade})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Roll Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                      placeholder="Enter roll number"
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}
            {formData.role === 'student' && (
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Parent Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.parentId}
                      onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                      placeholder="parent@example.com"
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowModal(false);
              setSubmitting(false);
            }}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={submitting}
              style={{ pointerEvents: 'auto', zIndex: 1000 }}
              onClick={(e) => {
                console.log('Create button clicked');
                console.log('Form data:', formData);
                console.log('Editing user:', editingUser);
                console.log('Submitting:', submitting);
                // Let the form handle the submission
              }}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {editingUser ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingUser ? 'Update' : 'Create'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

const UserTable = ({ users, onEdit, onDelete, role, getClassName, onSetStatus }) => {
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Gender</th>
          <th>Phone</th>
          <th>Address</th>
          {role === 'student' && <th>Roll Number</th>}
          {role === 'student' && <th>Class</th>}
          {role === 'student' && <th>Status</th>}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.gender || 'N/A'}</td>
            <td>{user.phone}</td>
            <td>{user.address}</td>
            {role === 'student' && <td>{user.rollNumber || 'N/A'}</td>}
            {role === 'student' && <td>{getClassName ? getClassName(user.classId) : (user.classId || 'N/A')}</td>}
            {role === 'student' && <td>{user.status || 'active'}</td>}
            <td>
              <Button variant="outline-primary" size="sm" onClick={() => onEdit(user)}>
                Edit
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => onDelete(user.id)} className="ms-2">
                Delete
              </Button>
              {role === 'student' && user.status !== 'stuck off' && (
                <Button 
                  variant="outline-warning" 
                  size="sm" 
                  className="ms-2"
                  onClick={() => onSetStatus && onSetStatus(user.id, 'stuck off')}
                >
                  Stuck Off
                </Button>
              )}
              {role === 'student' && user.status === 'stuck off' && (
                <Button 
                  variant="outline-success" 
                  size="sm" 
                  className="ms-2"
                  onClick={() => onSetStatus && onSetStatus(user.id, 'active')}
                >
                  Activate
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default UserManagement;
