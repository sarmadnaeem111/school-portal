import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const MyGrades = () => {
  const { currentUser } = useAuth();
  const [grades, setGrades] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [subjects, setSubjects] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      // Get student info first
      const studentQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
      const studentSnapshot = await getDocs(studentQuery);
      const studentData = studentSnapshot.docs[0]?.data();
      setStudentInfo(studentData);

      if (studentData) {
        // Get grades
        const gradesQuery = query(collection(db, 'grades'), where('studentId', '==', currentUser.uid));
        const gradesSnapshot = await getDocs(gradesQuery);
        const gradesList = gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGrades(gradesList);

        // Get subjects for this student's class only
        if (studentData.classId) {
          const subjectsQuery = query(collection(db, 'subjects'), where('classId', '==', studentData.classId));
          const subjectsSnapshot = await getDocs(subjectsQuery);
          const subjectsList = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSubjects(subjectsList);
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectGrades = (subjectId) => {
    return grades.filter(grade => grade.subjectId === subjectId && (selectedTerm === 'all' || grade.term === selectedTerm));
  };

  const calculateSubjectAverage = (subjectId) => {
    const subjectGrades = getSubjectGrades(subjectId);
    if (subjectGrades.length === 0) return 0;
    
    const totalPercentage = subjectGrades.reduce((sum, grade) => sum + grade.percentage, 0);
    return totalPercentage / subjectGrades.length;
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'info';
    if (percentage >= 70) return 'warning';
    return 'danger';
  };

  const getOverallAverage = () => {
    if (subjects.length === 0) return 0;
    
    const subjectAverages = subjects.map(subject => calculateSubjectAverage(subject.id));
    const validAverages = subjectAverages.filter(avg => avg > 0);
    
    if (validAverages.length === 0) return 0;
    
    return validAverages.reduce((sum, avg) => sum + avg, 0) / validAverages.length;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="mb-4">My Grades</h2>
      
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>Overall Performance</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={4}>
                  <div className="d-flex align-items-center">
                    <span className="me-2">Term:</span>
                    <select className="form-select" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
                      <option value="all">All Terms</option>
                      <option value="first">First Term</option>
                      <option value="second">Second Term</option>
                      <option value="third">Third Term</option>
                    </select>
                  </div>
                </Col>
              </Row>
              <div className="text-center">
                <h2 className={`text-${getGradeColor(getOverallAverage())}`}>
                  {getOverallAverage().toFixed(1)}%
                </h2>
                <p className="text-muted">Overall Average</p>
                <ProgressBar 
                  variant={getGradeColor(getOverallAverage())}
                  now={getOverallAverage()}
                  className="mb-3"
                />
                <Badge bg={getGradeColor(getOverallAverage())} className="fs-6">
                  {getOverallAverage() >= 90 ? 'A+' :
                   getOverallAverage() >= 80 ? 'A' :
                   getOverallAverage() >= 70 ? 'B' :
                   getOverallAverage() >= 60 ? 'C' : 'D'}
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {subjects.map(subject => {
          const subjectAverage = calculateSubjectAverage(subject.id);
          const subjectGrades = getSubjectGrades(subject.id);
          
          return (
            <Col md={6} key={subject.id} className="mb-3">
              <Card>
                <Card.Header className={`bg-${getGradeColor(subjectAverage)} text-white`}>
                  <h6 className="mb-0">{subject.name}</h6>
                </Card.Header>
                <Card.Body>
                  <div className="text-center mb-3">
                    <h4 className={`text-${getGradeColor(subjectAverage)}`}>
                      {subjectAverage.toFixed(1)}%
                    </h4>
                    <ProgressBar 
                      variant={getGradeColor(subjectAverage)}
                      now={subjectAverage}
                    />
                  </div>
                  
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Exam Type</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectGrades.map(grade => (
                        <tr key={grade.id}>
                          <td>{grade.examType}</td>
                          <td>{grade.marks}/{grade.maxMarks}</td>
                          <td>
                            <Badge bg={getGradeColor(grade.percentage)}>
                              {grade.percentage >= 90 ? 'A+' :
                               grade.percentage >= 80 ? 'A' :
                               grade.percentage >= 70 ? 'B' :
                               grade.percentage >= 60 ? 'C' : 'D'}
                            </Badge>
                          </td>
                          <td>{new Date(grade.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default MyGrades;
