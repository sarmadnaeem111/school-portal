import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Alert, Spinner, Button } from 'react-bootstrap';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

const ParentResults = () => {
  const { currentUser } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childResults, setChildResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (currentUser && currentUser.uid) {
      fetchChildren();
      fetchSchoolProfile();
    }
  }, [currentUser]);

  const fetchChildren = async () => {
    if (!currentUser || !currentUser.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const childrenQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('parentId', '==', currentUser.uid)
      );
      const childrenSnapshot = await getDocs(childrenQuery);
      const childrenList = childrenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChildren(childrenList);
      
      if (childrenList.length > 0) {
        setSelectedChild(childrenList[0].id);
        fetchChildResults(childrenList[0].id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      setMessage('Error fetching children');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildResults = async (childId) => {
    setLoading(true);
    try {
      const resultsQuery = query(
        collection(db, 'results'),
        where('studentId', '==', childId)
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      
      if (!resultsSnapshot.empty) {
        const resultsDoc = resultsSnapshot.docs[0];
        setChildResults({ id: resultsDoc.id, ...resultsDoc.data() });
      } else {
        setChildResults(null);
      }
    } catch (error) {
      console.error('Error fetching child results:', error);
      setMessage('Error fetching results');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolProfile = async () => {
    try {
      const schoolProfileRef = doc(db, 'schoolProfile', 'profile');
      const schoolProfileSnap = await getDoc(schoolProfileRef);
      if (schoolProfileSnap.exists()) {
        setSchoolProfile(schoolProfileSnap.data());
      }
    } catch (error) {
      console.error('Error fetching school profile:', error);
    }
  };

  const handleChildSelect = (childId) => {
    setSelectedChild(childId);
    fetchChildResults(childId);
  };

  const calculateGrade = (marks, totalMarks) => {
    const percentage = (marks / totalMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const calculateOverallGrade = (results) => {
    if (!results || !results.grades) return 'N/A';
    
    let totalMarks = 0;
    let totalObtainedMarks = 0;
    
    Object.values(results.grades).forEach(subjectGrade => {
      Object.values(subjectGrade).forEach(gradeData => {
        if (gradeData.obtainedMarks !== undefined && gradeData.totalMarks !== undefined) {
          totalObtainedMarks += gradeData.obtainedMarks;
          totalMarks += gradeData.totalMarks;
        }
      });
    });
    
    if (totalMarks === 0) return 'N/A';
    return calculateGrade(totalObtainedMarks, totalMarks);
  };

  const printResults = () => {
    if (!childResults || !selectedChild) return;

    const child = children.find(c => c.id === selectedChild);
    if (!child) return;

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      setMessage('Popup blocked! Please allow popups for this site to print results.');
      setMessageType('warning');
      return;
    }

    const overallGrade = calculateOverallGrade(childResults);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Results - ${child.name}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .school-name {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 24px;
            color: #3498db;
            margin-bottom: 10px;
          }
          .student-info {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 5px solid #3498db;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
            border-bottom: 1px solid #dee2e6;
          }
          .info-label {
            font-weight: bold;
            color: #2c3e50;
          }
          .info-value {
            color: #495057;
          }
          .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .results-table th, .results-table td {
            border: 1px solid #dee2e6;
            padding: 12px;
            text-align: left;
          }
          .results-table th {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            font-weight: bold;
          }
          .results-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          .grade-badge {
            padding: 5px 10px;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;
          }
          .grade-a-plus { background: #27ae60; color: white; }
          .grade-a { background: #2ecc71; color: white; }
          .grade-b { background: #f39c12; color: white; }
          .grade-c { background: #e67e22; color: white; }
          .grade-d { background: #e74c3c; color: white; }
          .grade-f { background: #c0392b; color: white; }
          .overall-grade {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #dee2e6;
            color: #6c757d;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">${schoolProfile?.schoolName || 'School Portal'}</div>
          <div class="report-title">ACADEMIC RESULTS</div>
          <div style="font-size: 14px; color: #6c757d;">Generated on: ${currentDate}</div>
        </div>

        <div class="student-info">
          <h3 style="color: #2c3e50; margin-bottom: 20px;">Student Information</h3>
          <div class="info-row">
            <span class="info-label">Student Name:</span>
            <span class="info-value">${child.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Roll Number:</span>
            <span class="info-value">${child.rollNumber || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Class:</span>
            <span class="info-value">${child.className || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Academic Year:</span>
            <span class="info-value">2024-2025</span>
          </div>
        </div>

        <h3 style="color: #2c3e50; margin-bottom: 15px;">Subject-wise Results</h3>
        <table class="results-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Obtained Marks</th>
              <th>Total Marks</th>
              <th>Percentage</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            ${childResults.grades && Object.keys(childResults.grades).length > 0 ? 
              Object.entries(childResults.grades).map(([subject, gradeData]) => {
                const totalObtained = Object.values(gradeData).reduce((sum, g) => sum + (g.obtainedMarks || 0), 0);
                const totalMarks = Object.values(gradeData).reduce((sum, g) => sum + (g.totalMarks || 0), 0);
                const percentage = totalMarks > 0 ? ((totalObtained / totalMarks) * 100).toFixed(2) : 0;
                const grade = calculateGrade(totalObtained, totalMarks);
                return `
                  <tr>
                    <td>${subject}</td>
                    <td>${totalObtained}</td>
                    <td>${totalMarks}</td>
                    <td>${percentage}%</td>
                    <td><span class="grade-badge grade-${grade.toLowerCase()}">${grade}</span></td>
                  </tr>
                `;
              }).join('')
            : '<tr><td colspan="5" style="text-align: center;">No grades available</td></tr>'}
          </tbody>
        </table>

        <div class="overall-grade">
          Overall Grade: ${overallGrade}
        </div>

        <div class="footer">
          <p><strong>${schoolProfile?.schoolName || 'School Portal'}</strong></p>
          <p>${schoolProfile?.address || 'School Address'} | Phone: ${schoolProfile?.phone || 'N/A'}</p>
          <p>Email: ${schoolProfile?.email || 'N/A'}</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (loading && !childResults) {
    return (
      <div className="text-center animate-fadeInUp">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
          <Spinner animation="border" variant="info" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
          <h5 className="text-muted">Loading results...</h5>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="animate-fadeInUp">
        <Alert variant="info" className="alert-enhanced">
          <i className="fas fa-info-circle me-2"></i>
          No children found. Please contact the admin to associate children with your account.
        </Alert>
      </div>
    );
  }

  const overallGrade = childResults ? calculateOverallGrade(childResults) : 'N/A';

  return (
    <div className="animate-fadeInUp">
      <div className="mb-4">
        <h2 className="mb-1" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          <i className="fas fa-chart-bar me-3"></i>
          Child Results
        </h2>
        <p className="text-muted mb-0">View and print your children's academic results</p>
      </div>

      {message && (
        <Alert variant={messageType} className={`alert-enhanced alert-${messageType}`} onClose={() => setMessage('')} dismissible>
          <i className={`fas fa-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
          {message}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={4}>
          <Card className="card-enhanced">
            <Card.Header style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none'
            }}>
              <h5 className="mb-0">
                <i className="fas fa-users me-2"></i>
                Select Child
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              {children.map(child => (
                <Button
                  key={child.id}
                  variant={selectedChild === child.id ? 'primary' : 'outline-primary'}
                  className={`w-100 mb-2 btn-enhanced ${selectedChild === child.id ? '' : 'text-dark'}`}
                  onClick={() => handleChildSelect(child.id)}
                >
                  <div className="d-flex align-items-center">
                    <i className="fas fa-user-graduate me-2"></i>
                    {child.name}
                    {selectedChild === child.id && (
                      <i className="fas fa-check ms-auto"></i>
                    )}
                  </div>
                </Button>
              ))}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          {childResults ? (
            <Card className="card-enhanced">
              <Card.Header style={{ 
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                border: 'none'
              }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-graduation-cap me-2"></i>
                    Academic Results
                  </h5>
                  <Button variant="light btn-enhanced" onClick={printResults}>
                    <i className="fas fa-print me-2"></i>
                    Print Results
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <div className="bg-light p-4 rounded">
                    <h4 className="text-primary mb-2">Overall Grade</h4>
                    <h1 className="display-4 text-primary fw-bold">{overallGrade}</h1>
                  </div>
                </div>

                <Table striped bordered hover className="table-enhanced">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Obtained Marks</th>
                      <th>Total Marks</th>
                      <th>Percentage</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childResults.grades && Object.keys(childResults.grades).length > 0 ? (
                      Object.entries(childResults.grades).map(([subject, gradeData]) => {
                        const totalObtained = Object.values(gradeData).reduce((sum, g) => sum + (g.obtainedMarks || 0), 0);
                        const totalMarks = Object.values(gradeData).reduce((sum, g) => sum + (g.totalMarks || 0), 0);
                        const percentage = totalMarks > 0 ? ((totalObtained / totalMarks) * 100).toFixed(2) : 0;
                        const grade = calculateGrade(totalObtained, totalMarks);
                        
                        return (
                          <tr key={subject}>
                            <td className="fw-bold">{subject}</td>
                            <td>{totalObtained}</td>
                            <td>{totalMarks}</td>
                            <td>{percentage}%</td>
                            <td>
                              <Badge bg={grade === 'A+' ? 'success' : grade === 'A' ? 'success' : grade === 'B' ? 'warning' : grade === 'C' ? 'warning' : 'danger'} className="badge-enhanced">
                                {grade}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted">
                          No grades available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          ) : (
            <Card className="card-enhanced">
              <Card.Body className="p-4 text-center">
                <i className="fas fa-graduation-cap fa-3x text-muted mb-3"></i>
                <h6 className="text-muted">No results found</h6>
                <p className="text-muted small">Results will appear here once they are added by teachers</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ParentResults;
