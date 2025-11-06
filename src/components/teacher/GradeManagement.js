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
    term: '',
    marks: '',
    maxMarks: '',
    remarks: ''
  });
  const [bulkEntryActive, setBulkEntryActive] = useState(false);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);

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
      // If editing a single grade, keep existing behavior
      if (editingGrade) {
        const gradeData = {
          ...formData,
          teacherId: currentUser.uid,
          teacherName: currentUser.displayName,
          createdAt: new Date(),
          percentage: (parseFloat(formData.marks) / parseFloat(formData.maxMarks)) * 100
        };
        await updateDoc(doc(db, 'grades', editingGrade.id), gradeData);
        setShowModal(false);
        setEditingGrade(null);
        setFormData({ studentId: '', subjectId: '', examType: '', term: '', marks: '', maxMarks: '', remarks: '' });
        fetchSubjectGrades();
        return;
      }

      // Start bulk entry flow: require subject, exam type, max marks
      if (!formData.subjectId || !formData.examType || !formData.term || !formData.maxMarks) {
        alert('Please select term, exam type and enter max marks.');
        return;
      }

      if (students.length === 0) {
        alert('No students found for this subject’s class.');
        return;
      }

      // Initialize bulk entry mode
      setBulkEntryActive(true);
      setCurrentStudentIndex(0);
      setFormData({
        ...formData,
        studentId: students[0].id,
        marks: ''
      });
    } catch (error) {
      console.error('Error preparing grade entry:', error);
    }
  };

  const saveCurrentStudentGrade = async () => {
    const currentStudent = students[currentStudentIndex];
    if (!currentStudent) return;

    if (formData.marks === '' || isNaN(parseFloat(formData.marks))) {
      alert('Please enter valid obtained marks.');
      return false;
    }

    try {
      const gradeData = {
        studentId: currentStudent.id,
        subjectId: formData.subjectId,
        examType: formData.examType,
        term: formData.term,
        marks: formData.marks,
        maxMarks: formData.maxMarks,
        remarks: formData.remarks,
        teacherId: currentUser.uid,
        teacherName: currentUser.displayName,
        createdAt: new Date(),
        percentage: (parseFloat(formData.marks) / parseFloat(formData.maxMarks)) * 100
      };
      await addDoc(collection(db, 'grades'), gradeData);
      return true;
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Failed to save grade for ' + currentStudent.name);
      return false;
    }
  };

  const handleNextStudent = async () => {
    const saved = await saveCurrentStudentGrade();
    if (!saved) return;
    const nextIndex = currentStudentIndex + 1;
    if (nextIndex >= students.length) {
      // Finished
      setBulkEntryActive(false);
      setShowModal(false);
      setFormData({ studentId: '', subjectId: '', examType: '', marks: '', maxMarks: '', remarks: '' });
      fetchSubjectGrades();
      return;
    }
    setCurrentStudentIndex(nextIndex);
    setFormData({ ...formData, studentId: students[nextIndex].id, marks: '' });
  };

  const handlePrevStudent = () => {
    const prevIndex = Math.max(0, currentStudentIndex - 1);
    setCurrentStudentIndex(prevIndex);
    setFormData({ ...formData, studentId: students[prevIndex].id, marks: '' });
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setFormData({
      studentId: grade.studentId,
      subjectId: grade.subjectId,
      examType: grade.examType,
      term: grade.term || '',
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
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Term</th>
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
                      <td className="text-capitalize">{grade.term || '-'}</td>
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
            </div>
          </Card.Body>
        </Card>
      )}

      <Modal show={showModal} onHide={() => { setShowModal(false); setBulkEntryActive(false); setEditingGrade(null); }}>
        <Modal.Header closeButton>
          <Modal.Title>{editingGrade ? 'Edit Grade' : bulkEntryActive ? 'Enter Marks for Students' : 'Add New Grade'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {editingGrade && (
              <Form.Group className="mb-3">
                <Form.Label>Student</Form.Label>
                <Form.Control
                  type="text"
                  value={getStudentName(formData.studentId)}
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
            )}

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
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Exam Type</Form.Label>
                  <Form.Select
                    value={formData.examType}
                    onChange={(e) => setFormData({...formData, examType: e.target.value})}
                    required
                    disabled={bulkEntryActive}
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
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Term</Form.Label>
                  <Form.Select
                    value={formData.term}
                    onChange={(e) => setFormData({...formData, term: e.target.value})}
                    required
                    disabled={bulkEntryActive}
                  >
                    <option value="">Select Term</option>
                    <option value="first">First Term</option>
                    <option value="second">Second Term</option>
                    <option value="third">Third Term</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Marks</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({...formData, maxMarks: e.target.value})}
                    required
                    disabled={bulkEntryActive}
                  />
                </Form.Group>
              </Col>
            </Row>

            {bulkEntryActive || editingGrade ? (
              <>
                {bulkEntryActive && (
                  <div className="mb-2">
                    <strong>Student:</strong> {students[currentStudentIndex]?.name}
                  </div>
                )}
                <Form.Group className="mb-3">
                  <Form.Label>Obtained Marks</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.marks}
                    onChange={(e) => setFormData({...formData, marks: e.target.value})}
                    required
                  />
                </Form.Group>
              </>
            ) : null}

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
            {!bulkEntryActive && !editingGrade && (
              <>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Add Grade
                </Button>
              </>
            )}
            {editingGrade && (
              <>
                <Button variant="secondary" onClick={() => { setShowModal(false); setEditingGrade(null); }}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">Update Grade</Button>
              </>
            )}
            {bulkEntryActive && (
              <>
                <Button variant="secondary" onClick={handlePrevStudent} disabled={currentStudentIndex === 0}>
                  Previous
                </Button>
                <Button variant="primary" onClick={handleNextStudent}>
                  {currentStudentIndex === students.length - 1 ? 'Save & Finish' : 'Save & Next'}
                </Button>
              </>
            )}
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default GradeManagement;
