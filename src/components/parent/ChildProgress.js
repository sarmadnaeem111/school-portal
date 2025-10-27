import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Form, Badge, ProgressBar } from 'react-bootstrap';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const ChildProgress = () => {
  const { currentUser } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildGrades();
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const childrenQuery = query(collection(db, 'users'), where('parentId', '==', currentUser.uid));
      const childrenSnapshot = await getDocs(childrenQuery);
      const childrenList = childrenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChildren(childrenList);
      
      if (childrenList.length > 0) {
        setSelectedChild(childrenList[0].id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildGrades = async () => {
    try {
      const gradesQuery = query(collection(db, 'grades'), where('studentId', '==', selectedChild));
      const gradesSnapshot = await getDocs(gradesQuery);
      const gradesList = gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGrades(gradesList);

      // Get subjects for this child
      const subjectsQuery = query(collection(db, 'subjects'));
      const subjectsSnapshot = await getDocs(subjectsQuery);
      setSubjects(subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const getSubjectGrades = (subjectId) => {
    return grades.filter(grade => grade.subjectId === subjectId);
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

  const selectedChildData = children.find(child => child.id === selectedChild);

  return (
    <div>
      <h2 className="mb-4">Child Progress Report</h2>
      
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Select Child</Form.Label>
            <Form.Select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {selectedChildData && (
        <>
          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Header>
                  <h5>Overall Performance - {selectedChildData.name}</h5>
                </Card.Header>
                <Card.Body>
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
        </>
      )}
    </div>
  );
};

export default ChildProgress;
