import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Row, Col, Card, Badge } from 'react-bootstrap';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const GradeManagement = () => {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    subjectId: '',
    examType: '',
    marks: '',
    maxMarks: '',
    remarks: ''
  });

  useEffect(() => {
    fetchTeacherSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchSubjectStudents();
      fetchSubjectGrades();
    }
  }, [selectedSubject]);

  const fetchTeacherSubjects = async () => {
    try {
      const subjectsQuery = query(collection(db, 'subjects'), where('teacherId', '==', currentUser.uid));
      const subjectsSnapshot = await getDocs(subjectsQuery);
      setSubjects(subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchSubjectStudents = async () => {
    try {
      // First get the subject to find its classId
      const selectedSubjectData = subjects.find(subject => subject.id === selectedSubject);
      if (!selectedSubjectData) {
        console.log('Selected subject not found');
        setStudents([]);
        return;
      }

      console.log('Fetching students for class:', selectedSubjectData.classId);
      
      // Now query students by the subject's classId
      const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'), where('classId', '==', selectedSubjectData.classId));
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('Found students:', studentsList);
      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchSubjectGrades = async () => {
    try {
      const gradesQuery = query(collection(db, 'grades'), where('subjectId', '==', selectedSubject));
      const gradesSnapshot = await getDocs(gradesQuery);
      setGrades(gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting grade with form data:', formData);
      console.log('Available students:', students);
      
      const gradeData = {
        ...formData,
        teacherId: currentUser.uid,
        teacherName: currentUser.displayName,
        createdAt: new Date(),
        percentage: (parseFloat(formData.marks) / parseFloat(formData.maxMarks)) * 100
      };
      
      console.log('Grade data to be saved:', gradeData);

      if (editingGrade) {
        await updateDoc(doc(db, 'grades', editingGrade.id), gradeData);
      } else {
        await addDoc(collection(db, 'grades'), gradeData);
      }

      setShowModal(false);
      setFormData({
        studentId: '',
        subjectId: '',
        examType: '',
        marks: '',
        maxMarks: '',
        remarks: ''
      });
      fetchSubjectGrades();
    } catch (error) {
      console.error('Error saving grade:', error);
    }
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setFormData({
      studentId: grade.studentId,
      subjectId: grade.subjectId,
      examType: grade.examType,
      marks: grade.marks,
      maxMarks: grade.maxMarks,
      remarks: grade.remarks
    });
    setShowModal(true);
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown';
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'info';
    if (percentage >= 70) return 'warning';
    return 'danger';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Grade Management</h2>
        <Button variant="primary" onClick={() => {
          if (!selectedSubject) {
            alert('Please select a subject first to add grades.');
            return;
          }
          setFormData({
            ...formData,
            subjectId: selectedSubject
          });
          setShowModal(true);
        }}>
          Add Grade
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Select Subject</Form.Label>
            <Form.Select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Choose a subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} - {subject.code}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {selectedSubject && (
        <Card>
          <Card.Header>
            <h5>Grades for {subjects.find(s => s.id === selectedSubject)?.name}</h5>
          </Card.Header>
          <Card.Body>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Exam Type</th>
                  <th>Marks</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(grade => (
                  <tr key={grade.id}>
                    <td>{getStudentName(grade.studentId)}</td>
                    <td>{grade.examType}</td>
                    <td>{grade.marks}/{grade.maxMarks}</td>
                    <td>
                      <Badge bg={getGradeColor(grade.percentage)}>
                        {grade.percentage.toFixed(1)}%
                      </Badge>
                    </td>
                    <td>
                      {grade.percentage >= 90 ? 'A+' :
                       grade.percentage >= 80 ? 'A' :
                       grade.percentage >= 70 ? 'B' :
                       grade.percentage >= 60 ? 'C' : 'D'}
                    </td>
                    <td>{grade.remarks || '-'}</td>
                    <td>
                      <Button variant="outline-primary" size="sm" onClick={() => handleEdit(grade)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingGrade ? 'Edit Grade' : 'Add New Grade'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Student</Form.Label>
              <Form.Select
                value={formData.studentId}
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                required
              >
                <option value="">Select Student</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </Form.Select>
              {students.length === 0 && selectedSubject && (
                <Form.Text className="text-warning">
                  No students found for this subject's class. Please ensure students are assigned to the correct class.
                </Form.Text>
              )}
              {!selectedSubject && (
                <Form.Text className="text-muted">
                  Please select a subject first to load students.
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                type="text"
                value={subjects.find(s => s.id === formData.subjectId)?.name || 'No subject selected'}
                readOnly
                className="bg-light"
              />
              <Form.Text className="text-muted">
                Subject is automatically selected based on your current selection.
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Exam Type</Form.Label>
                  <Form.Select
                    value={formData.examType}
                    onChange={(e) => setFormData({...formData, examType: e.target.value})}
                    required
                  >
                    <option value="">Select Exam Type</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="midterm">Midterm</option>
                    <option value="final">Final Exam</option>
                    <option value="project">Project</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Marks</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({...formData, maxMarks: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Obtained Marks</Form.Label>
              <Form.Control
                type="number"
                value={formData.marks}
                onChange={(e) => setFormData({...formData, marks: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingGrade ? 'Update' : 'Add'} Grade
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default GradeManagement;
