import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, ProgressBar, Button, Alert } from 'react-bootstrap';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const StudentResults = () => {
  const { currentUser } = useAuth();
  const [studentResults, setStudentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [schoolProfile, setSchoolProfile] = useState({});

  useEffect(() => {
    if (currentUser) {
      fetchStudentResults();
    }
  }, [currentUser]);

  const fetchStudentResults = async () => {
    try {
      setLoading(true);
      setMessage(''); // Clear previous messages
      
      // Check if currentUser has required data
      if (!currentUser || !currentUser.uid) {
        setMessage('User not authenticated');
        setMessageType('danger');
        setLoading(false);
        return;
      }

      // Fetch student document from Firestore to get classId and other student data
      let studentData = null;
      let studentDocId = currentUser.uid;
      
      try {
        // Try to get by document ID (since users are stored with uid as doc ID)
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          studentData = { id: userDocSnap.id, ...userDocSnap.data() };
          studentDocId = userDocSnap.id;
        } else {
          // Fallback: try query by uid field
          const studentQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
          const studentSnapshot = await getDocs(studentQuery);
          if (!studentSnapshot.empty) {
            const studentDoc = studentSnapshot.docs[0];
            studentData = { id: studentDoc.id, ...studentDoc.data() };
            studentDocId = studentDoc.id;
          }
        }
      } catch (error) {
        console.error('Error fetching student document:', error);
        // Fallback: try query by uid field
        try {
          const studentQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
          const studentSnapshot = await getDocs(studentQuery);
          if (!studentSnapshot.empty) {
            const studentDoc = studentSnapshot.docs[0];
            studentData = { id: studentDoc.id, ...studentDoc.data() };
            studentDocId = studentDoc.id;
          }
        } catch (fallbackError) {
          console.error('Error in fallback query:', fallbackError);
        }
      }

      if (!studentData) {
        setMessage('Student information not found. Please contact the school administration.');
        setMessageType('warning');
        setStudentResults([]);
        setLoading(false);
        return;
      }

      console.log('Student data:', studentData);

      if (!studentData.classId) {
        setMessage('Student class information not found. Please contact the school administration.');
        setMessageType('warning');
        setStudentResults([]);
        setLoading(false);
        return;
      }
      
      // Get student's grades - try both document ID and uid
      const gradesQuery = query(
        collection(db, 'grades'),
        where('studentId', '==', studentDocId)
      );
      const gradesSnapshot = await getDocs(gradesQuery);
      let grades = gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // If no grades found with document ID, try with uid as fallback
      if (grades.length === 0 && studentDocId !== currentUser.uid) {
        const gradesQueryByUid = query(
          collection(db, 'grades'),
          where('studentId', '==', currentUser.uid)
        );
        const gradesSnapshotByUid = await getDocs(gradesQueryByUid);
        grades = gradesSnapshotByUid.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      console.log('Found grades:', grades);

      // Get subjects for the student's class
      const subjectsQuery = query(
        collection(db, 'subjects'),
        where('classId', '==', studentData.classId)
      );
      const subjectsSnapshot = await getDocs(subjectsQuery);
      const subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('Found subjects:', subjects);

      // Generate results for the student
      const subjectResults = subjects.map(subject => {
        const subjectGrades = grades.filter(grade => grade.subjectId === subject.id);
        
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

      const studentResult = {
        studentId: studentDocId,
        studentName: studentData.name || currentUser.displayName || 'Unknown Student',
        rollNumber: studentData.rollNumber || 'N/A',
        classId: studentData.classId,
        subjectResults: subjectResults,
        overallTotal: overallTotal,
        overallObtained: overallObtained,
        overallPercentage: overallPercentage,
        overallGrade: overallGrade
      };

      console.log('Generated student result:', studentResult);
      
      // Always set results, even if empty, so the component shows something
      setStudentResults([studentResult]);
      
      // Get school profile
      const profileRef = doc(db, 'schoolProfile', 'main');
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        setSchoolProfile(profileSnap.data());
      }

      // Show message if no grades found
      if (grades.length === 0 && subjects.length > 0) {
        setMessage('No grades found for this student. Please contact your teachers.');
        setMessageType('info');
      } else if (subjects.length === 0) {
        setMessage('No subjects found for your class. Please contact the school administration.');
        setMessageType('warning');
      } else if (grades.length > 0 && subjects.length > 0) {
        setMessage('Results loaded successfully!');
        setMessageType('success');
      }
    } catch (error) {
      console.error('Error fetching student results:', error);
      setMessage('Error fetching results');
      setMessageType('danger');
    } finally {
      setLoading(false);
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

  const safeToFixed = (value, decimals = 1) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0.0';
    return numValue.toFixed(decimals);
  };

  const printStudentResults = (studentResult) => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>My Results - ${studentResult.studentName}</title>
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
          <div>My Academic Results</div>
          <div style="font-size: 14px; color: #6c757d;">Generated on: ${currentDate}</div>
        </div>

        <div class="student-info">
          <h3>Student Information</h3>
          <div class="info-row">
            <span><strong>Name:</strong> ${studentResult.studentName}</span>
            <span><strong>Roll Number:</strong> ${studentResult.rollNumber}</span>
          </div>
          <div class="info-row">
            <span><strong>Class:</strong> ${studentResult.classId}</span>
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

        <div class="footer">
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
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <div className="mb-4">
        <h2 className="mb-1" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          <i className="fas fa-chart-line me-3"></i>
          My Results
        </h2>
        <p className="text-muted mb-0">View your academic performance and grades</p>
      </div>
      
      {message && (
        <Alert variant={messageType} className={`alert-enhanced alert-${messageType}`} onClose={() => setMessage('')} dismissible>
          <i className={`fas fa-${messageType === 'success' ? 'check-circle' : messageType === 'danger' ? 'exclamation-circle' : messageType === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2`}></i>
          {message}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={12} className="d-flex justify-content-end">
          <Button variant="primary btn-enhanced" onClick={fetchStudentResults}>
            <i className="fas fa-sync-alt me-2"></i>
            Refresh Results
          </Button>
        </Col>
      </Row>

      {studentResults.length > 0 && studentResults[0] && (
        <div>
          {studentResults.map((result, index) => (
            <Card key={result.studentId} className="mb-4 card-enhanced">
              <Card.Header>
                <Row className="align-items-center">
                  <Col md={6}>
                    <h5 className="mb-0">
                      <i className="fas fa-user-graduate me-2"></i>
                      {result.studentName} ({result.rollNumber})
                    </h5>
                  </Col>
                  <Col md={6} className="text-end">
                    <div className="d-flex align-items-center justify-content-end gap-2">
                      <Badge bg={getGradeColor(result.overallGrade)} className="fs-6 badge-enhanced">
                        Overall: {result.overallGrade} ({safeToFixed(result.overallPercentage, 1)}%)
                      </Badge>
                      <Button 
                        variant="outline-primary btn-enhanced" 
                        size="sm"
                        onClick={() => printStudentResults(result)}
                        title="Print My Results"
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
                      className="mt-1 progress-enhanced"
                    />
                  </Col>
                  <Col md={6}>
                    <div className="text-center">
                      <h6>Marks: {safeToFixed(result.overallObtained, 0)} / {safeToFixed(result.overallTotal, 0)}</h6>
                    </div>
                  </Col>
                </Row>

                <div className="table-responsive">
                  <Table striped bordered hover size="sm" className="table-enhanced" responsive>
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
                            <Badge bg={getGradeColor(subject.grade)} className="badge-enhanced">
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

      {studentResults.length === 0 && !loading && (
        <Card>
          <Card.Body className="text-center">
            <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">No Results Found</h5>
            <p className="text-muted">
              No results found. Grades may not have been entered yet.
            </p>
            <Button variant="outline-primary" onClick={fetchStudentResults}>
              <i className="fas fa-sync-alt me-2"></i>
              Refresh
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Debug information - remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-3">
          <Card.Header>
            <h6>Debug Information</h6>
          </Card.Header>
          <Card.Body>
            <small>
              <strong>Current User:</strong> {currentUser ? 'Authenticated' : 'Not authenticated'}<br/>
              <strong>User ID:</strong> {currentUser?.uid || 'N/A'}<br/>
              <strong>Class ID:</strong> {studentResults.length > 0 ? studentResults[0]?.classId || 'N/A' : 'N/A'}<br/>
              <strong>Results Count:</strong> {studentResults.length}<br/>
              <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
            </small>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default StudentResults;
