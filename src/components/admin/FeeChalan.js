import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table, Badge, Alert, Spinner, Modal, Tabs, Tab } from 'react-bootstrap';
import { collection, getDocs, query, where, doc, getDoc, addDoc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const FeeChalan = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [savedChalans, setSavedChalans] = useState([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [feeData, setFeeData] = useState({
    monthlyTuition: 5000,
    examinationFee: 2000,
    libraryFee: 500,
    sportsFee: 1000,
    transportFee: 3000,
    otherFees: 0,
    otherFeeDescription: '',
    dueDate: '',
    academicYear: '2024-2025',
    chalanNumber: '',
    remarks: ''
  });

  useEffect(() => {
    fetchClasses();
    fetchSchoolProfile();
    fetchSavedChalans();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsByClass(selectedClass);
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const classesRef = collection(db, 'classes');
      const classesSnapshot = await getDocs(classesRef);
      const classesList = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesList);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setMessage('Error fetching classes');
      setMessageType('danger');
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

  const fetchStudentsByClass = async (classId) => {
    setLoading(true);
    try {
      const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'), where('classId', '==', classId));
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage('Error fetching students');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedChalans = async () => {
    try {
      const chalansRef = collection(db, 'feeChalans');
      const chalansQuery = query(chalansRef, orderBy('createdAt', 'desc'));
      const chalansSnapshot = await getDocs(chalansQuery);
      const chalansList = chalansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedChalans(chalansList);
    } catch (error) {
      console.error('Error fetching saved chalans:', error);
    }
  };

  const getClassName = (classId) => {
    const classData = classes.find(cls => cls.id === classId);
    if (classData) {
      return `${classData.name} - ${classData.section} (Grade ${classData.grade})`;
    }
    return `Class ${classId}`;
  };

  const handleFeeDataChange = (field, value) => {
    setFeeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const openManualForm = (student) => {
    setSelectedStudent(student);
    setFeeData(prev => ({
      ...prev,
      chalanNumber: `CH-${Date.now().toString().slice(-6)}`,
      dueDate: new Date().toISOString().split('T')[0]
    }));
    setShowManualForm(true);
  };

  const saveFeeChalan = async (student, feeData) => {
    try {
      const chalanData = {
        studentId: student.id,
        studentName: student.name,
        studentRollNumber: student.rollNumber,
        classId: student.classId,
        className: getClassName(student.classId),
        chalanNumber: feeData.chalanNumber,
        academicYear: feeData.academicYear,
        dueDate: feeData.dueDate,
        fees: {
          monthlyTuition: feeData.monthlyTuition,
          examinationFee: feeData.examinationFee,
          libraryFee: feeData.libraryFee,
          sportsFee: feeData.sportsFee,
          transportFee: feeData.transportFee,
          otherFees: feeData.otherFees,
          otherFeeDescription: feeData.otherFeeDescription,
          totalAmount: feeData.monthlyTuition + feeData.examinationFee + feeData.libraryFee + 
                      feeData.sportsFee + feeData.transportFee + feeData.otherFees
        },
        remarks: feeData.remarks,
        status: 'pending',
        createdAt: new Date(),
        createdBy: 'admin'
      };

      await addDoc(collection(db, 'feeChalans'), chalanData);
      await fetchSavedChalans();
      return true;
    } catch (error) {
      console.error('Error saving fee chalan:', error);
      return false;
    }
  };

  const generateFeeChalan = async (student, customFeeData = null) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const fees = customFeeData || feeData;
    const totalAmount = fees.monthlyTuition + fees.examinationFee + fees.libraryFee + 
                       fees.sportsFee + fees.transportFee + fees.otherFees;

    // Save the fee chalan to database
    const saved = await saveFeeChalan(student, fees);
    if (!saved) {
      setMessage('Error saving fee chalan to database');
      setMessageType('danger');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      setMessage('Popup blocked! Please allow popups for this site to generate fee chalans.');
      setMessageType('warning');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Chalan - ${student.name}</title>
        <script>
          // Auto-print function with multiple attempts
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
          
          // Trigger print when document is ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', autoPrint);
          } else {
            autoPrint();
          }
          
          // Also try on window load
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
            <span class="info-value">${student.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Roll Number:</span>
            <span class="info-value">${student.rollNumber || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Class:</span>
            <span class="info-value">${getClassName(student.classId)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Academic Year:</span>
            <span class="info-value">${fees.academicYear}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Chalan Number:</span>
            <span class="info-value">${fees.chalanNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Due Date:</span>
            <span class="info-value">${fees.dueDate ? new Date(fees.dueDate).toLocaleDateString() : 'As per schedule'}</span>
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
                <td>${fees.monthlyTuition.toLocaleString()}</td>
                <td>${fees.dueDate ? new Date(fees.dueDate).toLocaleDateString() : '5th of each month'}</td>
                <td>Pending</td>
              </tr>
              <tr>
                <td>Examination Fee</td>
                <td>${fees.examinationFee.toLocaleString()}</td>
                <td>${fees.dueDate ? new Date(fees.dueDate).toLocaleDateString() : 'Before exams'}</td>
                <td>Pending</td>
              </tr>
              <tr>
                <td>Library Fee</td>
                <td>${fees.libraryFee.toLocaleString()}</td>
                <td>${fees.dueDate ? new Date(fees.dueDate).toLocaleDateString() : 'Annually'}</td>
                <td>Pending</td>
              </tr>
              <tr>
                <td>Sports Fee</td>
                <td>${fees.sportsFee.toLocaleString()}</td>
                <td>${fees.dueDate ? new Date(fees.dueDate).toLocaleDateString() : 'Annually'}</td>
                <td>Pending</td>
              </tr>
              <tr>
                <td>Transport Fee</td>
                <td>${fees.transportFee.toLocaleString()}</td>
                <td>${fees.dueDate ? new Date(fees.dueDate).toLocaleDateString() : 'Monthly'}</td>
                <td>Pending</td>
              </tr>
              ${fees.otherFees > 0 ? `
              <tr>
                <td>${fees.otherFeeDescription || 'Other Fees'}</td>
                <td>${fees.otherFees.toLocaleString()}</td>
                <td>${fees.dueDate ? new Date(fees.dueDate).toLocaleDateString() : 'As per schedule'}</td>
                <td>Pending</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td><strong>Total Amount</strong></td>
                <td><strong>${totalAmount.toLocaleString()}</strong></td>
                <td><strong>${fees.dueDate ? new Date(fees.dueDate).toLocaleDateString() : 'As per schedule'}</strong></td>
                <td><strong>Pending</strong></td>
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
      
      // Immediate print attempt
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (printError) {
            console.error('Immediate print error:', printError);
          }
        }
      }, 100);
      
      // Set up print event after document is loaded
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
      
      // Additional fallback - try to print after a longer delay
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

  const generateAllFeeChalans = async () => {
    if (students.length === 0) {
      setMessage('No students found for the selected class');
      setMessageType('warning');
      return;
    }

    try {
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        setTimeout(async () => {
          try {
            await generateFeeChalan(student);
          } catch (error) {
            console.error(`Error generating chalan for ${student.name}:`, error);
          }
        }, i * 2000); // Delay each print by 2 seconds
      }

      setMessage(`Fee chalans generation initiated for ${students.length} students`);
      setMessageType('success');
    } catch (error) {
      console.error('Error in bulk chalan generation:', error);
      setMessage('Error generating fee chalans. Please try again.');
      setMessageType('danger');
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

  const updateChalanStatus = async (chalanId, newStatus) => {
    try {
      const chalanRef = doc(db, 'feeChalans', chalanId);
      await updateDoc(chalanRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Refresh the saved chalans list
      await fetchSavedChalans();
      
      setMessage(`Fee chalan status updated to ${newStatus}`);
      setMessageType('success');
    } catch (error) {
      console.error('Error updating chalan status:', error);
      setMessage('Error updating fee chalan status');
      setMessageType('danger');
    }
  };

  const printSavedChalan = (chalan) => {
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

    const fees = chalan.fees;
    const totalAmount = fees.totalAmount || 0;

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
                <td>${fees.monthlyTuition.toLocaleString()}</td>
                <td>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : '5th of each month'}</td>
                <td>${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}</td>
              </tr>
              <tr>
                <td>Examination Fee</td>
                <td>${fees.examinationFee.toLocaleString()}</td>
                <td>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'Before exams'}</td>
                <td>${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}</td>
              </tr>
              <tr>
                <td>Library Fee</td>
                <td>${fees.libraryFee.toLocaleString()}</td>
                <td>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'Annually'}</td>
                <td>${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}</td>
              </tr>
              <tr>
                <td>Sports Fee</td>
                <td>${fees.sportsFee.toLocaleString()}</td>
                <td>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'Annually'}</td>
                <td>${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}</td>
              </tr>
              <tr>
                <td>Transport Fee</td>
                <td>${fees.transportFee.toLocaleString()}</td>
                <td>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'Monthly'}</td>
                <td>${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}</td>
              </tr>
              ${fees.otherFees > 0 ? `
              <tr>
                <td>${fees.otherFeeDescription || 'Other Fees'}</td>
                <td>${fees.otherFees.toLocaleString()}</td>
                <td>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'As per schedule'}</td>
                <td>${chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td><strong>Total Amount</strong></td>
                <td><strong>${totalAmount.toLocaleString()}</strong></td>
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

  return (
    <div className="animate-fadeInUp">
      <div className="mb-4">
        <h2 className="mb-1" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          <i className="fas fa-file-invoice-dollar me-3"></i>
          Fee Chalan Management
        </h2>
        <p className="text-muted mb-0">Generate, print, and manage fee chalans for students across all classes</p>
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
        <Tab eventKey="generate" title="Generate Fee Chalans">
          <Row className="mb-4">
            <Col md={6}>
              <Card className="card-enhanced">
                <Card.Header style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none'
                }}>
                  <h5 className="mb-0">
                    <i className="fas fa-filter me-2"></i>
                    Class Selection
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <Form.Group>
                    <Form.Label className="form-label-enhanced">Select Class</Form.Label>
                    <Form.Select
                      className="form-control-enhanced"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                    >
                      <option value="">Choose a class...</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} - {cls.section} (Grade {cls.grade})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  
                  {selectedClass && (
                    <div className="mt-3">
                      <Button 
                        variant="success btn-enhanced" 
                        onClick={generateAllFeeChalans}
                        disabled={loading || students.length === 0}
                        className="w-100"
                      >
                        <i className="fas fa-print me-2"></i>
                        Generate All Fee Chalans ({students.length} students)
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="card-enhanced">
                <Card.Header style={{ 
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: 'white',
                  border: 'none'
                }}>
                  <h5 className="mb-0">
                    <i className="fas fa-info-circle me-2"></i>
                    Fee Chalan Features
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="text-center">
                    <i className="fas fa-file-invoice-dollar fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">Professional Fee Chalans</h6>
                    <ul className="list-unstyled text-start">
                      <li className="mb-2">
                        <i className="fas fa-check text-success me-2"></i>
                        Complete student information
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check text-success me-2"></i>
                        Detailed fee structure
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check text-success me-2"></i>
                        Payment instructions
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check text-success me-2"></i>
                        School branding
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check text-success me-2"></i>
                        Auto-save to database
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check text-success me-2"></i>
                        Print-ready format
                      </li>
                    </ul>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {selectedClass && (
            <Card className="card-enhanced">
              <Card.Header style={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                border: 'none'
              }}>
                <h5 className="mb-0">
                  <i className="fas fa-users me-2"></i>
                  Students in {getClassName(selectedClass)} ({students.length} students)
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" className="mb-3" />
                    <h6 className="text-muted">Loading students...</h6>
                  </div>
                ) : students.length > 0 ? (
                  <Table striped bordered hover className="table-enhanced">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Roll Number</th>
                        <th>Class</th>
                        <th>Fee Chalan Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => (
                        <tr key={student.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '35px', height: '35px' }}>
                                <i className="fas fa-user text-white"></i>
                              </div>
                              <span className="fw-bold">{student.name}</span>
                            </div>
                          </td>
                          <td>
                            <Badge bg="info" className="badge-enhanced">
                              {student.rollNumber || 'N/A'}
                            </Badge>
                          </td>
                          <td>{getClassName(student.classId)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button 
                                variant="outline-primary btn-enhanced" 
                                size="sm"
                                onClick={() => generateFeeChalan(student)}
                                title="Generate Standard Fee Chalan"
                              >
                                <i className="fas fa-print me-1"></i>
                                Standard
                              </Button>
                              <Button 
                                variant="outline-success btn-enhanced" 
                                size="sm"
                                onClick={() => openManualForm(student)}
                                title="Create Manual Fee Chalan"
                              >
                                <i className="fas fa-edit me-1"></i>
                                Manual
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-user-graduate fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">No students found in this class</h6>
                    <p className="text-muted small">Students will appear here once they are enrolled in the selected class</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Tab>

        <Tab eventKey="saved" title="Saved Fee Chalans">
          <Card className="card-enhanced">
            <Card.Header style={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              border: 'none'
            }}>
              <h5 className="mb-0">
                <i className="fas fa-archive me-2"></i>
                Saved Fee Chalans ({savedChalans.length})
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              {savedChalans.length > 0 ? (
                <Table striped bordered hover className="table-enhanced">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Roll Number</th>
                      <th>Class</th>
                      <th>Chalan Number</th>
                      <th>Total Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Created Date</th>
                      <th>Updated Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedChalans.map(chalan => (
                      <tr key={chalan.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '35px', height: '35px' }}>
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
                        <td>{chalan.className}</td>
                        <td>
                          <Badge bg="primary" className="badge-enhanced">
                            {chalan.chalanNumber}
                          </Badge>
                        </td>
                        <td>
                          <strong className="text-success">
                            PKR {chalan.fees.totalAmount.toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          {chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Form.Select
                              size="sm"
                              className="form-control-enhanced"
                              value={chalan.status}
                              onChange={(e) => updateChalanStatus(chalan.id, e.target.value)}
                              style={{ 
                                minWidth: '120px',
                                border: 'none',
                                background: `var(--bs-${getStatusColor(chalan.status)})`,
                                color: 'white',
                                fontWeight: 'bold',
                                borderRadius: '20px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="overdue">Overdue</option>
                            </Form.Select>
                            <i className="fas fa-edit text-muted ms-2" style={{ fontSize: '12px' }} title="Click to edit status"></i>
                          </div>
                        </td>
                        <td>
                          {chalan.createdAt ? new Date(chalan.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          {chalan.updatedAt ? new Date(chalan.updatedAt.toDate()).toLocaleDateString() : 
                           chalan.createdAt ? new Date(chalan.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary btn-enhanced" 
                            size="sm"
                            onClick={() => printSavedChalan(chalan)}
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
                  <i className="fas fa-archive fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">No saved fee chalans yet</h6>
                  <p className="text-muted small">Generated fee chalans will appear here</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Manual Fee Chalan Form Modal */}
      <Modal show={showManualForm} onHide={() => setShowManualForm(false)} size="lg" centered>
        <Modal.Header closeButton style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none'
        }}>
          <Modal.Title>
            <i className="fas fa-edit me-2"></i>
            Create Manual Fee Chalan - {selectedStudent?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-enhanced">Chalan Number</Form.Label>
                <Form.Control
                  type="text"
                  className="form-control-enhanced"
                  value={feeData.chalanNumber}
                  onChange={(e) => handleFeeDataChange('chalanNumber', e.target.value)}
                  placeholder="Enter chalan number"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-enhanced">Academic Year</Form.Label>
                <Form.Control
                  type="text"
                  className="form-control-enhanced"
                  value={feeData.academicYear}
                  onChange={(e) => handleFeeDataChange('academicYear', e.target.value)}
                  placeholder="e.g., 2024-2025"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-enhanced">Due Date</Form.Label>
                <Form.Control
                  type="date"
                  className="form-control-enhanced"
                  value={feeData.dueDate}
                  onChange={(e) => handleFeeDataChange('dueDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-enhanced">Monthly Tuition Fee (PKR)</Form.Label>
                <Form.Control
                  type="number"
                  className="form-control-enhanced"
                  value={feeData.monthlyTuition}
                  onChange={(e) => handleFeeDataChange('monthlyTuition', parseInt(e.target.value) || 0)}
                  placeholder="Enter amount"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-enhanced">Examination Fee (PKR)</Form.Label>
                <Form.Control
                  type="number"
                  className="form-control-enhanced"
                  value={feeData.examinationFee}
                  onChange={(e) => handleFeeDataChange('examinationFee', parseInt(e.target.value) || 0)}
                  placeholder="Enter amount"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-enhanced">Library Fee (PKR)</Form.Label>
                <Form.Control
                  type="number"
                  className="form-control-enhanced"
                  value={feeData.libraryFee}
                  onChange={(e) => handleFeeDataChange('libraryFee', parseInt(e.target.value) || 0)}
                  placeholder="Enter amount"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-enhanced">Sports Fee (PKR)</Form.Label>
                <Form.Control
                  type="number"
                  className="form-control-enhanced"
                  value={feeData.sportsFee}
                  onChange={(e) => handleFeeDataChange('sportsFee', parseInt(e.target.value) || 0)}
                  placeholder="Enter amount"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-enhanced">Transport Fee (PKR)</Form.Label>
                <Form.Control
                  type="number"
                  className="form-control-enhanced"
                  value={feeData.transportFee}
                  onChange={(e) => handleFeeDataChange('transportFee', parseInt(e.target.value) || 0)}
                  placeholder="Enter amount"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-enhanced">Other Fees (PKR)</Form.Label>
                <Form.Control
                  type="number"
                  className="form-control-enhanced"
                  value={feeData.otherFees}
                  onChange={(e) => handleFeeDataChange('otherFees', parseInt(e.target.value) || 0)}
                  placeholder="Enter amount"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-enhanced">Other Fee Description</Form.Label>
                <Form.Control
                  type="text"
                  className="form-control-enhanced"
                  value={feeData.otherFeeDescription}
                  onChange={(e) => handleFeeDataChange('otherFeeDescription', e.target.value)}
                  placeholder="Describe other fees"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="form-label-enhanced">Remarks</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              className="form-control-enhanced"
              value={feeData.remarks}
              onChange={(e) => handleFeeDataChange('remarks', e.target.value)}
              placeholder="Enter any additional remarks or instructions"
            />
          </Form.Group>

          <div className="bg-light p-3 rounded">
            <h6 className="text-primary mb-2">
              <i className="fas fa-calculator me-2"></i>
              Total Amount: PKR {(feeData.monthlyTuition + feeData.examinationFee + feeData.libraryFee + feeData.sportsFee + feeData.transportFee + feeData.otherFees).toLocaleString()}
            </h6>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary btn-enhanced" onClick={() => setShowManualForm(false)}>
            <i className="fas fa-times me-2"></i>
            Cancel
          </Button>
          <Button 
            variant="success btn-enhanced" 
            onClick={() => {
              generateFeeChalan(selectedStudent, feeData);
              setShowManualForm(false);
              setMessage(`Fee chalan generated and saved for ${selectedStudent?.name}`);
              setMessageType('success');
            }}
          >
            <i className="fas fa-print me-2"></i>
            Generate & Save Fee Chalan
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FeeChalan;
