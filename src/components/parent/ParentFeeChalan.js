import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Alert, Spinner, Button, Tabs, Tab } from 'react-bootstrap';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

const ParentFeeChalan = () => {
  const { currentUser } = useAuth();
  const [children, setChildren] = useState([]);
  const [allFeeChalans, setAllFeeChalans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
      // Fetch children (students) associated with this parent
      const childrenQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('parentId', '==', currentUser.uid)
      );
      const childrenSnapshot = await getDocs(childrenQuery);
      const childrenList = childrenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChildren(childrenList);

      // Fetch fee chalans for all children
      if (childrenList.length > 0) {
        const childIds = childrenList.map(child => child.id);
        const chalansPromises = childIds.map(childId => 
          getDocs(query(
            collection(db, 'feeChalans'),
            where('studentId', '==', childId)
          ))
        );
        
        const chalansSnapshots = await Promise.all(chalansPromises);
        const allChalans = [];
        
        chalansSnapshots.forEach((snapshot, index) => {
          const childChalans = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            childName: childrenList[index].name,
            childRollNumber: childrenList[index].rollNumber
          }));
          allChalans.push(...childChalans);
        });
        
        // Sort by creation date in descending order
        allChalans.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
          return dateB - dateA;
        });
        
        setAllFeeChalans(allChalans);
      }
    } catch (error) {
      console.error('Error fetching children and fee chalans:', error);
      setMessage('Error fetching fee chalan history');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return 'fas fa-check-circle';
      case 'pending': return 'fas fa-clock';
      case 'overdue': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-question-circle';
    }
  };

  const printFeeChalan = (chalan) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      setMessage('Popup blocked! Please allow popups for this site to print fee chalans.');
      setMessageType('warning');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Chalan - ${chalan.studentName}</title>
        <script>
          function autoPrint() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 200);
            
            setTimeout(function() {
              window.focus();
              window.print();
            }, 800);
            
            setTimeout(function() {
              window.focus();
              window.print();
            }, 1500);
          }
          
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', autoPrint);
          } else {
            autoPrint();
          }
          
          window.addEventListener('load', autoPrint);
        </script>
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
          .chalan-title {
            font-size: 24px;
            color: #e74c3c;
            margin-bottom: 10px;
          }
          .student-info {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 5px solid #3498db;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
          .fee-details {
            background: #fff;
            border: 2px solid #e74c3c;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(231, 76, 60, 0.1);
          }
          .fee-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .fee-table th, .fee-table td {
            border: 1px solid #dee2e6;
            padding: 12px;
            text-align: left;
          }
          .fee-table th {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            font-weight: bold;
          }
          .fee-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          .total-row {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%) !important;
            color: white !important;
            font-weight: bold;
          }
          .status-badge {
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
          }
          .status-paid {
            background: #28a745;
            color: white;
          }
          .status-pending {
            background: #ffc107;
            color: #212529;
          }
          .status-overdue {
            background: #dc3545;
            color: white;
          }
          .instructions {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin-top: 20px;
            box-shadow: 0 2px 10px rgba(255, 234, 167, 0.3);
          }
          .instructions h4 {
            color: #856404;
            margin-bottom: 10px;
          }
          .instructions ul {
            margin: 0;
            padding-left: 20px;
          }
          .instructions li {
            color: #856404;
            margin-bottom: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #dee2e6;
            color: #6c757d;
          }
          .print-button {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(231, 76, 60, 0.3);
            transition: all 0.3s ease;
          }
          .print-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            button { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">${schoolProfile?.schoolName || 'School Portal'}</div>
          <div class="chalan-title">FEE CHALAN</div>
          <div style="font-size: 14px; color: #6c757d;">Generated on: ${currentDate}</div>
        </div>

        <div class="student-info">
          <h3 style="color: #2c3e50; margin-bottom: 20px;">Student Information</h3>
          <div class="info-row">
            <span class="info-label">Student Name:</span>
            <span class="info-value">${chalan.studentName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Roll Number:</span>
            <span class="info-value">${chalan.studentRollNumber || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Class:</span>
            <span class="info-value">${chalan.className}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Academic Year:</span>
            <span class="info-value">${chalan.academicYear}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Chalan Number:</span>
            <span class="info-value">${chalan.chalanNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Due Date:</span>
            <span class="info-value">${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'As per schedule'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">
              <span class="status-badge status-${chalan.status}">
                ${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}
              </span>
            </span>
          </div>
        </div>

        <div class="fee-details">
          <h3 style="color: #e74c3c; margin-bottom: 15px;">Fee Structure</h3>
          <table class="fee-table">
            <thead>
              <tr>
                <th>Fee Type</th>
                <th>Amount (PKR)</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Monthly Tuition Fee</td>
                <td>${chalan.fees.monthlyTuition.toLocaleString()}</td>
                <td>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : '5th of each month'}</td>
                <td>${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}</td>
              </tr>
              <tr>
                <td>Examination Fee</td>
                <td>${chalan.fees.examinationFee.toLocaleString()}</td>
                <td>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'Before exams'}</td>
                <td>${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}</td>
              </tr>
              <tr>
                <td>Library Fee</td>
                <td>${chalan.fees.libraryFee.toLocaleString()}</td>
                <td>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'Annually'}</td>
                <td>${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}</td>
              </tr>
              <tr>
                <td>Sports Fee</td>
                <td>${chalan.fees.sportsFee.toLocaleString()}</td>
                <td>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'Annually'}</td>
                <td>${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}</td>
              </tr>
              <tr>
                <td>Transport Fee</td>
                <td>${chalan.fees.transportFee.toLocaleString()}</td>
                <td>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'Monthly'}</td>
                <td>${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}</td>
              </tr>
              ${chalan.fees.otherFees > 0 ? `
              <tr>
                <td>${chalan.fees.otherFeeDescription || 'Other Fees'}</td>
                <td>${chalan.fees.otherFees.toLocaleString()}</td>
                <td>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'As per schedule'}</td>
                <td>${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td><strong>Total Amount</strong></td>
                <td><strong>${chalan.fees.totalAmount.toLocaleString()}</strong></td>
                <td><strong>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'As per schedule'}</strong></td>
                <td><strong>${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="instructions">
          <h4>Payment Instructions:</h4>
          <ul>
            <li>Please pay the fee before the due date to avoid late charges</li>
            <li>Late fee charges: PKR 200 per month after due date</li>
            <li>Payment can be made through bank transfer or cash at school office</li>
            <li>Keep this chalan for your records</li>
            <li>For any queries, contact the school office</li>
          </ul>
        </div>

        <div class="footer">
          <p><strong>${schoolProfile?.schoolName || 'School Portal'}</strong></p>
          <p>${schoolProfile?.address || 'School Address'} | Phone: ${schoolProfile?.phone || 'N/A'}</p>
          <p>Email: ${schoolProfile?.email || 'N/A'} | Website: ${schoolProfile?.website || 'N/A'}</p>
          <div style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" class="print-button">
              🖨️ Print Fee Chalan
            </button>
          </div>
        </div>
      </body>
      </html>
    `);
    
    try {
      printWindow.document.close();
      
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (printError) {
            console.error('Print error:', printError);
          }
        }
      }, 100);
      
      printWindow.onload = function() {
        setTimeout(function() {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (printError) {
            console.error('Onload print error:', printError);
            printWindow.focus();
          }
        }, 500);
      };
      
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (printError) {
            console.error('Fallback print error:', printError);
            printWindow.focus();
          }
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error generating fee chalan:', error);
      setMessage('Error generating fee chalan. Please try again.');
      setMessageType('danger');
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }
    }
  };

  const getChalansByChild = (childId) => {
    return allFeeChalans.filter(chalan => chalan.studentId === childId);
  };

  const getTotalAmountByStatus = (status) => {
    return allFeeChalans
      .filter(chalan => chalan.status === status)
      .reduce((total, chalan) => total + chalan.fees.totalAmount, 0);
  };

  if (loading) {
    return (
      <div className="text-center animate-fadeInUp">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
          <Spinner animation="border" variant="info" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
          <h5 className="text-muted">Loading your children's fee chalan history...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <div className="mb-4">
        <h2 className="mb-1" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          <i className="fas fa-file-invoice-dollar me-3"></i>
          Fee Chalan History
        </h2>
        <p className="text-muted mb-0">View and print fee chalan history for your children</p>
      </div>

      {message && (
        <Alert variant={messageType} className={`alert-enhanced alert-${messageType}`} onClose={() => setMessage('')} dismissible>
          <i className={`fas fa-${messageType === 'success' ? 'check-circle' : messageType === 'danger' ? 'exclamation-circle' : messageType === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2`}></i>
          {message}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 nav-tabs-enhanced"
      >
        <Tab eventKey="overview" title="Overview">
          <Row className="mb-4">
            <Col md={4}>
              <Card className="card-enhanced text-center">
                <Card.Body className="p-4">
                  <i className="fas fa-users fa-3x text-primary mb-3"></i>
                  <h4 className="text-primary">{children.length}</h4>
                  <p className="text-muted mb-0">Children</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="card-enhanced text-center">
                <Card.Body className="p-4">
                  <i className="fas fa-file-invoice-dollar fa-3x text-warning mb-3"></i>
                  <h4 className="text-warning">{allFeeChalans.length}</h4>
                  <p className="text-muted mb-0">Total Fee Chalans</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="card-enhanced text-center">
                <Card.Body className="p-4">
                  <i className="fas fa-rupee-sign fa-3x text-success mb-3"></i>
                  <h4 className="text-success">PKR {allFeeChalans.reduce((total, chalan) => total + chalan.fees.totalAmount, 0).toLocaleString()}</h4>
                  <p className="text-muted mb-0">Total Amount</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Card className="card-enhanced">
                <Card.Header style={{ 
                  background: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)',
                  color: 'white',
                  border: 'none'
                }}>
                  <h6 className="mb-0">
                    <i className="fas fa-clock me-2"></i>
                    Pending Payments
                  </h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <h4 className="text-warning">PKR {getTotalAmountByStatus('pending').toLocaleString()}</h4>
                  <p className="text-muted small mb-0">Awaiting payment</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="card-enhanced">
                <Card.Header style={{ 
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none'
                }}>
                  <h6 className="mb-0">
                    <i className="fas fa-check-circle me-2"></i>
                    Paid Amount
                  </h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <h4 className="text-success">PKR {getTotalAmountByStatus('paid').toLocaleString()}</h4>
                  <p className="text-muted small mb-0">Successfully paid</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="card-enhanced">
                <Card.Header style={{ 
                  background: 'linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)',
                  color: 'white',
                  border: 'none'
                }}>
                  <h6 className="mb-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Overdue Amount
                  </h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <h4 className="text-danger">PKR {getTotalAmountByStatus('overdue').toLocaleString()}</h4>
                  <p className="text-muted small mb-0">Past due date</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="all-chalans" title="All Fee Chalans">
          <Card className="card-enhanced">
            <Card.Header style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none'
            }}>
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                All Fee Chalans ({allFeeChalans.length})
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              {allFeeChalans.length > 0 ? (
                <Table striped bordered hover className="table-enhanced">
                  <thead>
                    <tr>
                      <th>Child Name</th>
                      <th>Roll Number</th>
                      <th>Chalan Number</th>
                      <th>Academic Year</th>
                      <th>Total Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allFeeChalans.map(chalan => (
                      <tr key={chalan.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '35px', height: '35px' }}>
                              <i className="fas fa-user text-white"></i>
                            </div>
                            <span className="fw-bold">{chalan.studentName}</span>
                          </div>
                        </td>
                        <td>
                          <Badge bg="info" className="badge-enhanced">
                            {chalan.studentRollNumber || 'N/A'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg="primary" className="badge-enhanced">
                            {chalan.chalanNumber}
                          </Badge>
                        </td>
                        <td>{chalan.academicYear}</td>
                        <td>
                          <strong className="text-success">
                            PKR {chalan.fees.totalAmount.toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          {chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <Badge bg={getStatusColor(chalan.status)} className="badge-enhanced">
                            <i className={`${getStatusIcon(chalan.status)} me-1`}></i>
                            {chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          {chalan.createdAt ? new Date(chalan.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary btn-enhanced" 
                            size="sm"
                            onClick={() => printFeeChalan(chalan)}
                            title="Print Fee Chalan"
                          >
                            <i className="fas fa-print me-1"></i>
                            Print
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-file-invoice-dollar fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">No fee chalans found</h6>
                  <p className="text-muted small">Fee chalans for your children will appear here once they are generated by the admin</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {children.map(child => (
          <Tab key={child.id} eventKey={`child-${child.id}`} title={child.name}>
            <Card className="card-enhanced">
              <Card.Header style={{ 
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                border: 'none'
              }}>
                <h5 className="mb-0">
                  <i className="fas fa-user-graduate me-2"></i>
                  {child.name} - Fee Chalans ({getChalansByChild(child.id).length})
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                {getChalansByChild(child.id).length > 0 ? (
                  <Table striped bordered hover className="table-enhanced">
                    <thead>
                      <tr>
                        <th>Chalan Number</th>
                        <th>Academic Year</th>
                        <th>Total Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getChalansByChild(child.id).map(chalan => (
                        <tr key={chalan.id}>
                          <td>
                            <Badge bg="primary" className="badge-enhanced">
                              {chalan.chalanNumber}
                            </Badge>
                          </td>
                          <td>{chalan.academicYear}</td>
                          <td>
                            <strong className="text-success">
                              PKR {chalan.fees.totalAmount.toLocaleString()}
                            </strong>
                          </td>
                          <td>
                            {chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td>
                            <Badge bg={getStatusColor(chalan.status)} className="badge-enhanced">
                              <i className={`${getStatusIcon(chalan.status)} me-1`}></i>
                              {chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}
                            </Badge>
                          </td>
                          <td>
                            {chalan.createdAt ? new Date(chalan.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary btn-enhanced" 
                              size="sm"
                              onClick={() => printFeeChalan(chalan)}
                              title="Print Fee Chalan"
                            >
                              <i className="fas fa-print me-1"></i>
                              Print
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-file-invoice-dollar fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">No fee chalans found for {child.name}</h6>
                    <p className="text-muted small">Fee chalans will appear here once they are generated by the admin</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
};

export default ParentFeeChalan;
