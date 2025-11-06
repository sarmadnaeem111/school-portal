import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, ProgressBar, Form, Button, Alert } from 'react-bootstrap';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const Results = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [schoolProfile, setSchoolProfile] = useState({});

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      generateResults();
    }
  }, [selectedClass, grades, subjects]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      
      // Get teacher's classes
      const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', currentUser.uid));
      const classesSnapshot = await getDocs(classesQuery);
      const classesList = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesList);
      
      // Get teacher's subjects
      const subjectsQuery = query(collection(db, 'subjects'), where('teacherId', '==', currentUser.uid));
      const subjectsSnapshot = await getDocs(subjectsQuery);
      const subjectsList = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(subjectsList);

      // Get all grades for teacher's subjects
      if (subjectsList.length > 0) {
        const subjectIds = subjectsList.map(subject => subject.id);
        const gradesQuery = query(collection(db, 'grades'));
        const gradesSnapshot = await getDocs(gradesQuery);
        const allGrades = gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter grades for teacher's subjects
        const teacherGrades = allGrades.filter(grade => subjectIds.includes(grade.subjectId));
        setGrades(teacherGrades);
      }

      // Get school profile
      const profileRef = doc(db, 'schoolProfile', 'main');
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        setSchoolProfile(profileSnap.data());
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setMessage('Error fetching data');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const generateResults = () => {
    try {
      if (!selectedClass || subjects.length === 0 || grades.length === 0) {
        setStudentResults([]);
        return;
      }

      const termFilteredGrades = selectedTerm === 'all' 
        ? grades 
        : grades.filter(g => (g.term || '') === selectedTerm);

      // Get students for the selected class
      const studentsQuery = query(
        collection(db, 'users'), 
        where('role', '==', 'student'),
        where('classId', '==', selectedClass)
      );
      
      getDocs(studentsQuery).then(studentsSnapshot => {
        const studentsList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentsList);

        // Generate results for each student
        const results = studentsList.map(student => {
          try {
            const studentGrades = termFilteredGrades.filter(grade => grade.studentId === student.id);
            const studentSubjects = subjects.filter(subject => subject.classId === selectedClass);
            
            const subjectResults = studentSubjects.map(subject => {
              const subjectGrades = studentGrades.filter(grade => grade.subjectId === subject.id);
              
              if (subjectGrades.length === 0) {
                return {
                  subjectId: subject.id,
                  subjectName: subject.name || 'Unknown Subject',
                  subjectCode: subject.code || 'N/A',
                  totalMarks: 0,
                  obtainedMarks: 0,
                  percentage: 0,
                  grade: 'N/A',
                  examCount: 0
                };
              }

              const totalMarks = subjectGrades.reduce((sum, grade) => sum + (parseFloat(grade.maxMarks) || 0), 0);
              const obtainedMarks = subjectGrades.reduce((sum, grade) => sum + (parseFloat(grade.marks) || 0), 0);
              const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
              const grade = calculateGrade(percentage);

              return {
                subjectId: subject.id,
                subjectName: subject.name || 'Unknown Subject',
                subjectCode: subject.code || 'N/A',
                totalMarks: totalMarks,
                obtainedMarks: obtainedMarks,
                percentage: percentage,
                grade: grade,
                examCount: subjectGrades.length
              };
            });

            const overallTotal = subjectResults.reduce((sum, result) => sum + (result.totalMarks || 0), 0);
            const overallObtained = subjectResults.reduce((sum, result) => sum + (result.obtainedMarks || 0), 0);
            const overallPercentage = overallTotal > 0 ? (overallObtained / overallTotal) * 100 : 0;
            const overallGrade = calculateGrade(overallPercentage);

            return {
              studentId: student.id,
              studentName: student.name || 'Unknown Student',
              rollNumber: student.rollNumber || 'N/A',
              classId: selectedClass,
              subjectResults: subjectResults,
              overallTotal: overallTotal,
              overallObtained: overallObtained,
              overallPercentage: overallPercentage,
              overallGrade: overallGrade
            };
          } catch (error) {
            console.error('Error processing student:', student.id, error);
            return {
              studentId: student.id,
              studentName: student.name || 'Unknown Student',
              rollNumber: student.rollNumber || 'N/A',
              classId: selectedClass,
              subjectResults: [],
              overallTotal: 0,
              overallObtained: 0,
              overallPercentage: 0,
              overallGrade: 'N/A'
            };
          }
        });

        setStudentResults(results);
      }).catch(error => {
        console.error('Error fetching students:', error);
        setMessage('Error fetching students');
        setMessageType('danger');
      });
    } catch (error) {
      console.error('Error generating results:', error);
      setMessage('Error generating results');
      setMessageType('danger');
    }
  };

  const calculateGrade = (percentage) => {
    const numPercentage = parseFloat(percentage) || 0;
    if (numPercentage >= 90) return 'A+';
    if (numPercentage >= 80) return 'A';
    if (numPercentage >= 70) return 'B';
    if (numPercentage >= 60) return 'C';
    if (numPercentage >= 50) return 'D';
    return 'F';
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+': return 'success';
      case 'A': return 'success';
      case 'B': return 'info';
      case 'C': return 'warning';
      case 'D': return 'warning';
      case 'F': return 'danger';
      default: return 'secondary';
    }
  };

  const getGradeColorByPercentage = (percentage) => {
    const numPercentage = parseFloat(percentage) || 0;
    if (numPercentage >= 90) return 'success';
    if (numPercentage >= 80) return 'info';
    if (numPercentage >= 70) return 'warning';
    return 'danger';
  };

  // Helper function to safely format numbers
  const safeToFixed = (value, decimals = 1) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0.0';
    return numValue.toFixed(decimals);
  };

  // Get available classes for the teacher
  const getAvailableClasses = () => {
    return classes;
  };

  const getClassName = (classId) => {
    const classData = classes.find(cls => cls.id === classId);
    if (classData) {
      return `${classData.name} - ${classData.section} (Grade ${classData.grade})`;
    }
    return `Class ${classId}`;
  };

  // Print individual student results
  const printStudentResults = (studentResult) => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();
    const termLabel = selectedTerm === 'all' 
      ? 'All Terms' 
      : (selectedTerm === 'first' ? 'First Term' : selectedTerm === 'second' ? 'Second Term' : 'Third Term');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Results - ${studentResult.studentName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .school-name {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
          }
          .student-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .student-info h3 {
            margin: 0 0 10px 0;
            color: #007bff;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .overall-performance {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
          }
          .overall-grade {
            font-size: 24px;
            font-weight: bold;
            color: #28a745;
            margin: 10px 0;
          }
          .marks-summary {
            font-size: 18px;
            color: #6c757d;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #dee2e6;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #007bff;
            color: white;
            font-weight: bold;
          }
          .grade-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            color: white;
          }
          .grade-A { background-color: #28a745; }
          .grade-B { background-color: #17a2b8; }
          .grade-C { background-color: #ffc107; color: #000; }
          .grade-D { background-color: #fd7e14; }
          .grade-F { background-color: #dc3545; }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">${schoolProfile.schoolName || 'School Portal'}</div>
          <div>Student Academic Results</div>
          <div style="font-size: 14px; color: #6c757d;">Generated on: ${currentDate}</div>
          <div style="font-size: 14px; color: #6c757d;">Term: ${termLabel}</div>
        </div>

        <div class="student-info">
          <h3>Student Information</h3>
          <div class="info-row">
            <span><strong>Name:</strong> ${studentResult.studentName}</span>
            <span><strong>Roll Number:</strong> ${studentResult.rollNumber}</span>
          </div>
          <div class="info-row">
            <span><strong>Class:</strong> ${getClassName(studentResult.classId)}</span>
            <span><strong>Academic Year:</strong> 2024-2025</span>
          </div>
        </div>

        <div class="overall-performance">
          <h4>Overall Performance</h4>
          <div class="overall-grade">${studentResult.overallGrade} (${safeToFixed(studentResult.overallPercentage, 1)}%)</div>
          <div class="marks-summary">
            Total Marks: ${safeToFixed(studentResult.overallObtained, 0)} / ${safeToFixed(studentResult.overallTotal, 0)}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Subject Code</th>
              <th>Marks Obtained</th>
              <th>Total Marks</th>
              <th>Percentage</th>
              <th>Grade</th>
              <th>Exams Taken</th>
            </tr>
          </thead>
          <tbody>
            ${studentResult.subjectResults.map(subject => `
              <tr>
                <td>${subject.subjectName}</td>
                <td>${subject.subjectCode}</td>
                <td>${subject.totalMarks > 0 ? safeToFixed(subject.obtainedMarks, 0) : 'N/A'}</td>
                <td>${subject.totalMarks > 0 ? safeToFixed(subject.totalMarks, 0) : 'N/A'}</td>
                <td>${subject.totalMarks > 0 ? safeToFixed(subject.percentage, 1) + '%' : 'N/A'}</td>
                <td>
                  <span class="grade-badge grade-${subject.grade.charAt(0)}">${subject.grade}</span>
                </td>
                <td>${subject.examCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

     
          <p>This is a computer-generated report. No signature is required.</p>
          <p>For any queries, please contact the school administration.</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="mb-4">Student Results</h2>
      
      {message && (
        <Alert variant={messageType} onClose={() => setMessage('')} dismissible>
          {message}
        </Alert>
      )}

      {/* Class and Term Selection */}
      <Row className="mb-4">
        <Col md={5}>
          <Form.Group>
            <Form.Label>Select Class</Form.Label>
            <Form.Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Choose a class</option>
              {getAvailableClasses().map(cls => (
                <option key={cls.id} value={cls.id}>
                  {getClassName(cls.id)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Term</Form.Label>
            <Form.Select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="all">All Terms</option>
              <option value="first">First Term</option>
              <option value="second">Second Term</option>
              <option value="third">Third Term</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3} className="d-flex align-items-end">
          <Button variant="primary" onClick={generateResults}>
            <i className="fas fa-sync-alt me-2"></i>
            Refresh Results
          </Button>
        </Col>
      </Row>

      {selectedClass && studentResults.length > 0 && (
        <div>
          {/* Class Summary */}
          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Header>
                  <h5>Class Summary - {getClassName(selectedClass)}</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3}>
                      <div className="text-center">
                        <h4 className="text-primary">{studentResults.length}</h4>
                        <p className="text-muted">Total Students</p>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center">
                        <h4 className="text-success">
                          {studentResults.filter(result => (result.overallPercentage || 0) >= 80).length}
                        </h4>
                        <p className="text-muted">A Grade Students</p>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center">
                        <h4 className="text-warning">
                          {studentResults.filter(result => (result.overallPercentage || 0) >= 60 && (result.overallPercentage || 0) < 80).length}
                        </h4>
                        <p className="text-muted">B-C Grade Students</p>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center">
                        <h4 className="text-danger">
                          {studentResults.filter(result => (result.overallPercentage || 0) < 60).length}
                        </h4>
                        <p className="text-muted">Below 60%</p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Student Results */}
          {studentResults.map((result, index) => (
            <Card key={result.studentId} className="mb-4">
              <Card.Header>
                <Row className="align-items-center">
                  <Col md={6}>
                    <h5 className="mb-0">
                      {result.studentName} ({result.rollNumber})
                    </h5>
                  </Col>
                  <Col md={6} className="text-end">
                    <div className="d-flex align-items-center justify-content-end gap-2">
                      <Badge bg={getGradeColor(result.overallGrade)} className="fs-6">
                        Overall: {result.overallGrade} ({safeToFixed(result.overallPercentage, 1)}%)
                      </Badge>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => printStudentResults(result)}
                        title="Print Student Results"
                      >
                        <i className="fas fa-print me-1"></i>
                        Print
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <div className="d-flex justify-content-between">
                      <span>Overall Performance</span>
                      <span>{safeToFixed(result.overallPercentage, 1)}%</span>
                    </div>
                    <ProgressBar 
                      variant={getGradeColorByPercentage(result.overallPercentage)}
                      now={parseFloat(result.overallPercentage) || 0}
                      className="mt-1"
                    />
                  </Col>
                  <Col md={6}>
                    <div className="text-center">
                      <h6>Marks: {safeToFixed(result.overallObtained, 0)} / {safeToFixed(result.overallTotal, 0)}</h6>
                    </div>
                  </Col>
                </Row>

                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Code</th>
                        <th>Marks</th>
                        <th>Percentage</th>
                        <th>Grade</th>
                        <th>Exams</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.subjectResults.map(subject => (
                        <tr key={subject.subjectId}>
                          <td>{subject.subjectName}</td>
                          <td>{subject.subjectCode}</td>
                          <td>
                            {subject.totalMarks > 0 
                              ? `${safeToFixed(subject.obtainedMarks, 0)} / ${safeToFixed(subject.totalMarks, 0)}`
                              : 'No Exams'
                            }
                          </td>
                          <td>
                            {subject.totalMarks > 0 
                              ? `${safeToFixed(subject.percentage, 1)}%`
                              : 'N/A'
                            }
                          </td>
                          <td>
                            <Badge bg={getGradeColor(subject.grade)}>
                              {subject.grade}
                            </Badge>
                          </td>
                          <td>{subject.examCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {selectedClass && studentResults.length === 0 && (
        <Card>
          <Card.Body className="text-center">
            <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">No Results Found</h5>
            <p className="text-muted">
              No students found for the selected class or no grades have been entered yet.
            </p>
            <Button variant="outline-primary" onClick={generateResults}>
              <i className="fas fa-sync-alt me-2"></i>
              Refresh
            </Button>
          </Card.Body>
        </Card>
      )}

      {!selectedClass && (
        <Card>
          <Card.Body className="text-center">
            <i className="fas fa-graduation-cap fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">Select a Class</h5>
            <p className="text-muted">
              Please select a class to view student results.
            </p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Results;
