import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [classFormData, setClassFormData] = useState({
    name: '',
    grade: '',
    section: '',
    capacity: '',
    teacherId: ''
  });
  const [subjectFormData, setSubjectFormData] = useState({
    name: '',
    code: '',
    classId: '',
    teacherId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesSnapshot, subjectsSnapshot, teachersSnapshot] = await Promise.all([
        getDocs(collection(db, 'classes')),
        getDocs(collection(db, 'subjects')),
        getDocs(collection(db, 'users'))
      ]);

      setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSubjects(subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTeachers(teachersSnapshot.docs.filter(doc => doc.data().role === 'teacher').map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await updateDoc(doc(db, 'classes', editingClass.id), classFormData);
      } else {
        await addDoc(collection(db, 'classes'), classFormData);
      }
      setShowClassModal(false);
      setClassFormData({ name: '', grade: '', section: '', capacity: '', teacherId: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving class:', error);
    }
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await updateDoc(doc(db, 'subjects', editingSubject.id), subjectFormData);
      } else {
        await addDoc(collection(db, 'subjects'), subjectFormData);
      }
      setShowSubjectModal(false);
      setSubjectFormData({ name: '', code: '', classId: '', teacherId: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving subject:', error);
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Not Assigned';
  };

  const getClassName = (classId) => {
    const classItem = classes.find(c => c.id === classId);
    return classItem ? `${classItem.name} - ${classItem.section}` : 'Not Assigned';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Class & Subject Management</h2>
        <div>
          <Button variant="primary" onClick={() => setShowClassModal(true)} className="me-2">
            Add Class
          </Button>
          <Button variant="success" onClick={() => setShowSubjectModal(true)}>
            Add Subject
          </Button>
        </div>
      </div>

      <Row>
        <Col md={6} className="mb-4">
          <h4>Classes</h4>
          <div className="table-responsive">
          <Table striped bordered hover className="table-enhanced">
            <thead>
              <tr>
                <th>Name</th>
                <th>Grade</th>
                <th>Section</th>
                <th>Capacity</th>
                <th>Teacher</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls.id}>
                  <td>{cls.name}</td>
                  <td>{cls.grade}</td>
                  <td>{cls.section}</td>
                  <td>{cls.capacity}</td>
                  <td>{getTeacherName(cls.teacherId)}</td>
                  <td>
                    <Button variant="outline-primary" size="sm" onClick={() => {
                      setEditingClass(cls);
                      setClassFormData(cls);
                      setShowClassModal(true);
                    }}>
                      Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => {
                      if (window.confirm('Are you sure?')) {
                        deleteDoc(doc(db, 'classes', cls.id));
                        fetchData();
                      }
                    }} className="ms-2">
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          </div>
        </Col>

        <Col md={6} className="mb-4">
          <h4>Subjects</h4>
          <div className="table-responsive">
          <Table striped bordered hover className="table-enhanced">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Class</th>
                <th>Teacher</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(subject => (
                <tr key={subject.id}>
                  <td>{subject.name}</td>
                  <td>{subject.code}</td>
                  <td>{getClassName(subject.classId)}</td>
                  <td>{getTeacherName(subject.teacherId)}</td>
                  <td>
                    <Button variant="outline-primary" size="sm" onClick={() => {
                      setEditingSubject(subject);
                      setSubjectFormData(subject);
                      setShowSubjectModal(true);
                    }}>
                      Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => {
                      if (window.confirm('Are you sure?')) {
                        deleteDoc(doc(db, 'subjects', subject.id));
                        fetchData();
                      }
                    }} className="ms-2">
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          </div>
        </Col>
      </Row>

      {/* Class Modal */}
      <Modal show={showClassModal} onHide={() => setShowClassModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingClass ? 'Edit Class' : 'Add New Class'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleClassSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Class Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={classFormData.name}
                    onChange={(e) => setClassFormData({...classFormData, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Grade</Form.Label>
                  <Form.Control
                    type="text"
                    value={classFormData.grade}
                    onChange={(e) => setClassFormData({...classFormData, grade: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Section</Form.Label>
                  <Form.Control
                    type="text"
                    value={classFormData.section}
                    onChange={(e) => setClassFormData({...classFormData, section: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacity</Form.Label>
                  <Form.Control
                    type="number"
                    value={classFormData.capacity}
                    onChange={(e) => setClassFormData({...classFormData, capacity: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Class Teacher</Form.Label>
              <Form.Select
                value={classFormData.teacherId}
                onChange={(e) => setClassFormData({...classFormData, teacherId: e.target.value})}
              >
                <option value="">Select Teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowClassModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingClass ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Subject Modal */}
      <Modal show={showSubjectModal} onHide={() => setShowSubjectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubjectSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={subjectFormData.name}
                    onChange={(e) => setSubjectFormData({...subjectFormData, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject Code</Form.Label>
                  <Form.Control
                    type="text"
                    value={subjectFormData.code}
                    onChange={(e) => setSubjectFormData({...subjectFormData, code: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Class</Form.Label>
                  <Form.Select
                    value={subjectFormData.classId}
                    onChange={(e) => setSubjectFormData({...subjectFormData, classId: e.target.value})}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name} - {cls.section}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teacher</Form.Label>
                  <Form.Select
                    value={subjectFormData.teacherId}
                    onChange={(e) => setSubjectFormData({...subjectFormData, teacherId: e.target.value})}
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSubjectModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingSubject ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassManagement;
