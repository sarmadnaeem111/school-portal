import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table, Badge, Alert, Spinner, Modal, Tabs, Tab } from 'react-bootstrap';
import { collection, getDocs, query, where, doc, getDoc, addDoc, orderBy, updateDoc, setDoc } from 'firebase/firestore';
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
  const [classFeeAmounts, setClassFeeAmounts] = useState({}); // { classId: { monthlyTuition, examinationFee, ... } }
  const [editingClassFee, setEditingClassFee] = useState(null); // Currently editing class fee
  const [feeAmountForm, setFeeAmountForm] = useState({
    monthlyTuition: 5000,
    examinationFee: 2000,
    libraryFee: 500,
    sportsFee: 1000,
    transportFee: 3000,
    otherFees: 0
  });
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
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingChalan, setPayingChalan] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amountReceived: 0,
    paymentMethod: 'cash',
    referenceNo: '',
    paidDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  useEffect(() => {
    fetchClasses();
    fetchSchoolProfile();
    fetchSavedChalans();
    fetchClassFeeAmounts();
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

  const fetchClassFeeAmounts = async () => {
    try {
      const feeAmountsRef = collection(db, 'classFeeAmounts');
      const feeAmountsSnapshot = await getDocs(feeAmountsRef);
      const amountsMap = {};
      feeAmountsSnapshot.docs.forEach(doc => {
        amountsMap[doc.data().classId] = { id: doc.id, ...doc.data() };
      });
      setClassFeeAmounts(amountsMap);
    } catch (error) {
      console.error('Error fetching class fee amounts:', error);
    }
  };

  const saveClassFeeAmount = async (classId) => {
    try {
      setLoading(true);
      const feeAmountData = {
        classId: classId,
        monthlyTuition: feeAmountForm.monthlyTuition || 0,
        examinationFee: feeAmountForm.examinationFee || 0,
        libraryFee: feeAmountForm.libraryFee || 0,
        sportsFee: feeAmountForm.sportsFee || 0,
        transportFee: feeAmountForm.transportFee || 0,
        otherFees: feeAmountForm.otherFees || 0,
        updatedAt: new Date()
      };

      // Use setDoc with merge to update or create
      const feeAmountRef = doc(db, 'classFeeAmounts', classId);
      await setDoc(feeAmountRef, feeAmountData, { merge: true });

      // Update local state
      setClassFeeAmounts(prev => ({
        ...prev,
        [classId]: { id: classId, ...feeAmountData }
      }));

      setEditingClassFee(null);
      setMessage(`Fee amounts saved successfully for ${getClassName(classId)}`);
      setMessageType('success');
    } catch (error) {
      console.error('Error saving class fee amount:', error);
      setMessage('Error saving fee amounts. Please try again.');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const openFeeAmountEditor = (classId) => {
    const existingFee = classFeeAmounts[classId];
    if (existingFee) {
      setFeeAmountForm({
        monthlyTuition: existingFee.monthlyTuition || 5000,
        examinationFee: existingFee.examinationFee || 2000,
        libraryFee: existingFee.libraryFee || 500,
        sportsFee: existingFee.sportsFee || 1000,
        transportFee: existingFee.transportFee || 3000,
        otherFees: existingFee.otherFees || 0
      });
    } else {
      setFeeAmountForm({
        monthlyTuition: 5000,
        examinationFee: 2000,
        libraryFee: 500,
        sportsFee: 1000,
        transportFee: 3000,
        otherFees: 0
      });
    }
    setEditingClassFee(classId);
  };

  const getClassFeeAmounts = (classId) => {
    const savedAmounts = classFeeAmounts[classId];
    if (savedAmounts) {
      // Use nullish coalescing (??) instead of || to preserve 0 values
      // Only fall back to defaults if value is null or undefined, not if it's 0
      return {
        monthlyTuition: savedAmounts.monthlyTuition ?? 5000,
        examinationFee: savedAmounts.examinationFee ?? 2000,
        libraryFee: savedAmounts.libraryFee ?? 500,
        sportsFee: savedAmounts.sportsFee ?? 1000,
        transportFee: savedAmounts.transportFee ?? 3000,
        otherFees: savedAmounts.otherFees ?? 0
      };
    }
    // Return default if no saved amounts
    return {
      monthlyTuition: 5000,
      examinationFee: 2000,
      libraryFee: 500,
      sportsFee: 1000,
      transportFee: 3000,
      otherFees: 0
    };
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
      // Ensure all values are defined (no undefined values for Firestore)
      const chalanData = {
        studentId: student.id || '',
        studentName: student.name || '',
        studentRollNumber: student.rollNumber || null,
        classId: student.classId || '',
        className: getClassName(student.classId) || '',
        chalanNumber: feeData.chalanNumber || '',
        academicYear: feeData.academicYear || '2024-2025',
        dueDate: feeData.dueDate || null,
        fees: {
          monthlyTuition: Number(feeData.monthlyTuition) || 0,
          examinationFee: Number(feeData.examinationFee) || 0,
          libraryFee: Number(feeData.libraryFee) || 0,
          sportsFee: Number(feeData.sportsFee) || 0,
          transportFee: Number(feeData.transportFee) || 0,
          otherFees: Number(feeData.otherFees) || 0,
          otherFeeDescription: feeData.otherFeeDescription || null,
          totalAmount: (Number(feeData.monthlyTuition) || 0) + 
                      (Number(feeData.examinationFee) || 0) + 
                      (Number(feeData.libraryFee) || 0) + 
                      (Number(feeData.sportsFee) || 0) + 
                      (Number(feeData.transportFee) || 0) + 
                      (Number(feeData.otherFees) || 0)
        },
        remarks: feeData.remarks || null,
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

    // Use class-specific fee amounts if available, otherwise use custom or default
    let fees;
    if (customFeeData) {
      fees = customFeeData;
    } else {
      // Get class-specific fee amounts from configuration
      const classFees = getClassFeeAmounts(student.classId);
      
      // Build fees object: use class fees for amounts, keep other fields from feeData
      fees = {
        // Use class fee amounts (these take priority)
        monthlyTuition: classFees.monthlyTuition,
        examinationFee: classFees.examinationFee,
        libraryFee: classFees.libraryFee,
        sportsFee: classFees.sportsFee,
        transportFee: classFees.transportFee,
        otherFees: classFees.otherFees,
        // Keep other fields from feeData
        otherFeeDescription: feeData.otherFeeDescription || null,
        remarks: feeData.remarks || null,
        // Ensure required fields are set
        chalanNumber: feeData.chalanNumber || `CH-${Date.now().toString().slice(-6)}`,
        academicYear: feeData.academicYear || '2024-2025',
        dueDate: feeData.dueDate || new Date().toISOString().split('T')[0]
      };
    }
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

  const generateAllStudentsFeeChalans = async () => {
    setLoading(true);
    try {
      // Fetch all students across all classes
      const allStudentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
      const allStudentsSnapshot = await getDocs(allStudentsQuery);
      const allStudentsList = allStudentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (allStudentsList.length === 0) {
        setMessage('No students found in the system');
        setMessageType('warning');
        setLoading(false);
        return;
      }

      // Check if fee amounts are configured for all classes
      const studentsWithoutFeeConfig = allStudentsList.filter(student => {
        return !classFeeAmounts[student.classId];
      });

      if (studentsWithoutFeeConfig.length > 0) {
        const uniqueClassesWithoutConfig = [...new Set(studentsWithoutFeeConfig.map(s => s.classId))];
        const classesNames = uniqueClassesWithoutConfig.map(cid => getClassName(cid)).join(', ');
        const confirmed = window.confirm(
          `Warning: ${studentsWithoutFeeConfig.length} students from ${uniqueClassesWithoutConfig.length} class(es) do not have fee amounts configured. ` +
          `Classes: ${classesNames}\n\n` +
          `These students will use default fee amounts. Do you want to continue?`
        );
        if (!confirmed) {
          setLoading(false);
          return;
        }
      }

      setMessage(`Starting fee chalan generation for ${allStudentsList.length} students...`);
      setMessageType('info');

      let successCount = 0;
      let errorCount = 0;

      // Generate chalans for all students with delay between each
      for (let i = 0; i < allStudentsList.length; i++) {
        const student = allStudentsList[i];
        setTimeout(async () => {
          try {
            await generateFeeChalan(student); // This will use class-specific fee amounts from getClassFeeAmounts
            successCount++;
            
            // Update message periodically
            if ((successCount + errorCount) % 10 === 0 || (successCount + errorCount) === allStudentsList.length) {
              setMessage(`Generating... ${successCount + errorCount}/${allStudentsList.length} completed (${successCount} successful, ${errorCount} errors)`);
            }
          } catch (error) {
            console.error(`Error generating chalan for ${student.name} (${getClassName(student.classId)}):`, error);
            errorCount++;
            
            if ((successCount + errorCount) % 10 === 0 || (successCount + errorCount) === allStudentsList.length) {
              setMessage(`Generating... ${successCount + errorCount}/${allStudentsList.length} completed (${successCount} successful, ${errorCount} errors)`);
            }
          }

          // Final message when all are done
          if (successCount + errorCount === allStudentsList.length) {
            setMessage(`Fee chalans generation completed! ${successCount} successful, ${errorCount} errors`);
            setMessageType(successCount > 0 ? 'success' : 'danger');
            setLoading(false);
            await fetchSavedChalans(); // Refresh saved chalans list
          }
        }, i * 1500); // Delay each by 1.5 seconds to avoid overwhelming the system
      }

    } catch (error) {
      console.error('Error in generating fee chalans for all students:', error);
      setMessage('Error generating fee chalans. Please try again.');
      setMessageType('danger');
      setLoading(false);
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

  const openPayModal = (chalan) => {
    setPayingChalan(chalan);
    const total = Number(chalan?.fees?.totalAmount || 0);
    setPaymentForm({
      amountReceived: total,
      paymentMethod: 'cash',
      referenceNo: '',
      paidDate: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setShowPayModal(true);
  };

  const submitPayment = async () => {
    if (!payingChalan) return;
    try {
      const chalanRef = doc(db, 'feeChalans', payingChalan.id);
      await updateDoc(chalanRef, {
        status: 'paid',
        updatedAt: new Date(),
        payment: {
          amountReceived: Number(paymentForm.amountReceived) || 0,
          paymentMethod: paymentForm.paymentMethod || 'cash',
          referenceNo: paymentForm.referenceNo || null,
          paidDate: paymentForm.paidDate || null,
          remarks: paymentForm.remarks || null
        },
        paidAt: new Date()
      });
      setShowPayModal(false);
      setMessage('Chalan paid successfully.');
      setMessageType('success');
      await fetchSavedChalans();
    } catch (e) {
      console.error('Payment failed', e);
      setMessage('Failed to record payment');
      setMessageType('danger');
    }
  };

  const printPaidReceipt = (chalan) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) { setMessage('Popup blocked! Allow popups to print receipt.'); setMessageType('warning'); return; }
    const fees = chalan.fees || {};
    const payment = chalan.payment || {};
    const totalAmount = fees.totalAmount || 0;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Paid Receipt - ${chalan.studentName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 3px solid #2c3e50; padding-bottom: 14px; margin-bottom: 20px; }
          .title { font-size: 22px; color: #28a745; font-weight: bold; }
          .section { margin-bottom: 16px; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
          .label { color: #555; font-weight: bold; }
          .badge-paid { display:inline-block; background:#28a745; color:#fff; padding:6px 10px; border-radius:16px; font-weight:bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background:#f5f5f5; }
          .total { font-weight: bold; }
          @media print { button { display:none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">FEE CHALAN - PAID RECEIPT</div>
          <div>${schoolProfile?.schoolName || 'School Portal'} | Printed: ${currentDate}</div>
          <div class="badge-paid" style="margin-top:10px;">PAID</div>
        </div>
        <div class="section">
          <div class="row"><span class="label">Student:</span><span>${chalan.studentName}</span></div>
          <div class="row"><span class="label">Class:</span><span>${chalan.className}</span></div>
          <div class="row"><span class="label">Chalan #:</span><span>${chalan.chalanNumber}</span></div>
          <div class="row"><span class="label">Due Date:</span><span>${chalan.dueDate ? new Date(chalan.dueDate).toLocaleDateString() : 'As per schedule'}</span></div>
        </div>
        <div class="section">
          <table>
            <thead><tr><th>Fee Type</th><th>Amount (PKR)</th></tr></thead>
            <tbody>
              <tr><td>Monthly Tuition Fee</td><td>${(fees.monthlyTuition||0).toLocaleString()}</td></tr>
              <tr><td>Examination Fee</td><td>${(fees.examinationFee||0).toLocaleString()}</td></tr>
              <tr><td>Library Fee</td><td>${(fees.libraryFee||0).toLocaleString()}</td></tr>
              <tr><td>Sports Fee</td><td>${(fees.sportsFee||0).toLocaleString()}</td></tr>
              <tr><td>Transport Fee</td><td>${(fees.transportFee||0).toLocaleString()}</td></tr>
              ${fees.otherFees>0?`<tr><td>${fees.otherFeeDescription||'Other Fees'}</td><td>${fees.otherFees.toLocaleString()}</td></tr>`:''}
              <tr class="total"><td>Total</td><td>${(totalAmount).toLocaleString()}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="section">
          <div class="row"><span class="label">Amount Received:</span><span>PKR ${(Number(payment.amountReceived)||0).toLocaleString()}</span></div>
          <div class="row"><span class="label">Payment Method:</span><span>${payment.paymentMethod || 'cash'}</span></div>
          <div class="row"><span class="label">Reference #:</span><span>${payment.referenceNo || '-'}</span></div>
          <div class="row"><span class="label">Paid Date:</span><span>${payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : (chalan.paidAt?.toDate ? chalan.paidAt.toDate().toLocaleDateString() : '')}</span></div>
          <div class="row"><span class="label">Remarks:</span><span>${payment.remarks || '-'}</span></div>
        </div>
        <div style="text-align:center; margin-top:20px;">
          <button onclick="window.print()">Print Receipt</button>
        </div>
      </body>
      </html>
    `);
    try { printWindow.document.close(); } catch(_) {}
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
                    Bulk Fee Chalan Generation
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <Alert variant="warning" className="alert-enhanced mb-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>Generate for All Students:</strong> This will generate fee chalans for all students across all classes using configured fee amounts from "Fee Amount Configuration" tab.
                  </Alert>
                  <Button 
                    variant="primary btn-enhanced" 
                    onClick={generateAllStudentsFeeChalans}
                    disabled={loading}
                    className="w-100 mb-3"
                    size="lg"
                  >
                    <i className="fas fa-file-invoice-dollar me-2"></i>
                    {loading ? 'Generating...' : 'Generate Fee Chalans for All Students'}
                  </Button>
                  <div className="text-center">
                    <i className="fas fa-file-invoice-dollar fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">Professional Fee Chalans</h6>
                    <ul className="list-unstyled text-start">
                      <li className="mb-2">
                        <i className="fas fa-check text-success me-2"></i>
                        Uses class-specific fee amounts
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check text-success me-2"></i>
                        Auto-saves to database
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
                  <div className="table-responsive">
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
                  </div>
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
                <div className="table-responsive">
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
                          <div className="d-flex gap-2">
                            {chalan.status !== 'paid' && (
                              <Button 
                                variant="outline-success btn-enhanced" 
                                size="sm"
                                onClick={() => openPayModal(chalan)}
                                title="Pay Chalan"
                              >
                                <i className="fas fa-money-bill-wave me-1"></i>
                                Pay
                              </Button>
                            )}
                            <Button 
                              variant="outline-primary btn-enhanced" 
                              size="sm"
                              onClick={() => printSavedChalan(chalan)}
                              title="Print Fee Chalan"
                            >
                              <i className="fas fa-print me-1"></i>
                              Print
                            </Button>
                            {chalan.status === 'paid' && (
                              <Button 
                                variant="outline-secondary btn-enhanced" 
                                size="sm"
                                onClick={() => printPaidReceipt(chalan)}
                                title="Print Paid Receipt"
                              >
                                <i className="fas fa-receipt me-1"></i>
                                Receipt
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                </div>
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

        <Tab eventKey="feeAmounts" title="Fee Amount Configuration">
          <Card className="card-enhanced">
            <Card.Header style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none'
            }}>
              <h5 className="mb-0">
                <i className="fas fa-dollar-sign me-2"></i>
                Configure Fee Amounts by Class
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Alert variant="info" className="alert-enhanced mb-4">
                <i className="fas fa-info-circle me-2"></i>
                Set fee amounts for each class. These amounts will be used automatically when generating fee chalans for students in those classes.
              </Alert>

              {classes.length > 0 ? (
                <div className="table-responsive">
                <Table striped bordered hover className="table-enhanced">
                  <thead>
                    <tr>
                      <th>Class Name</th>
                      <th>Grade</th>
                      <th>Section</th>
                      <th>Monthly Tuition</th>
                      <th>Examination Fee</th>
                      <th>Library Fee</th>
                      <th>Sports Fee</th>
                      <th>Transport Fee</th>
                      <th>Other Fees</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map(cls => {
                      const savedFees = classFeeAmounts[cls.id];
                      const total = savedFees ? 
                        (savedFees.monthlyTuition || 0) + 
                        (savedFees.examinationFee || 0) + 
                        (savedFees.libraryFee || 0) + 
                        (savedFees.sportsFee || 0) + 
                        (savedFees.transportFee || 0) + 
                        (savedFees.otherFees || 0) : 0;

                      return (
                        <tr key={cls.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '35px', height: '35px' }}>
                                <i className="fas fa-chalkboard text-white"></i>
                              </div>
                              <span className="fw-bold">{cls.name}</span>
                            </div>
                          </td>
                          <td><Badge bg="info" className="badge-enhanced">Grade {cls.grade}</Badge></td>
                          <td><Badge bg="secondary" className="badge-enhanced">{cls.section}</Badge></td>
                          <td>
                            {savedFees ? (
                              <span className="fw-bold text-primary">
                                PKR {(savedFees.monthlyTuition || 0).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted">Not set</span>
                            )}
                          </td>
                          <td>
                            {savedFees ? (
                              <span className="fw-bold text-primary">
                                PKR {(savedFees.examinationFee || 0).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted">Not set</span>
                            )}
                          </td>
                          <td>
                            {savedFees ? (
                              <span className="fw-bold text-primary">
                                PKR {(savedFees.libraryFee || 0).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted">Not set</span>
                            )}
                          </td>
                          <td>
                            {savedFees ? (
                              <span className="fw-bold text-primary">
                                PKR {(savedFees.sportsFee || 0).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted">Not set</span>
                            )}
                          </td>
                          <td>
                            {savedFees ? (
                              <span className="fw-bold text-primary">
                                PKR {(savedFees.transportFee || 0).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted">Not set</span>
                            )}
                          </td>
                          <td>
                            {savedFees ? (
                              <span className="fw-bold text-primary">
                                PKR {(savedFees.otherFees || 0).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted">Not set</span>
                            )}
                          </td>
                          <td>
                            {total > 0 ? (
                              <span className="fw-bold text-success">
                                PKR {total.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {savedFees ? (
                              <Badge bg="success" className="badge-enhanced">
                                <i className="fas fa-check me-1"></i>
                                Configured
                              </Badge>
                            ) : (
                              <Badge bg="warning" className="badge-enhanced">
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                Not Set
                              </Badge>
                            )}
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary btn-enhanced" 
                              size="sm"
                              onClick={() => openFeeAmountEditor(cls.id)}
                              title="Edit Fee Amounts"
                            >
                              <i className="fas fa-edit me-1"></i>
                              {savedFees ? 'Edit' : 'Set'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-chalkboard fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">No classes found</h6>
                  <p className="text-muted small">Classes will appear here once they are created</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Fee Amount Edit Modal */}
          <Modal 
            show={editingClassFee !== null} 
            onHide={() => setEditingClassFee(null)} 
            size="lg" 
            centered
          >
            <Modal.Header closeButton style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none'
            }}>
              <Modal.Title>
                <i className="fas fa-edit me-2"></i>
                Configure Fee Amounts - {editingClassFee ? getClassName(editingClassFee) : ''}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Alert variant="info" className="alert-enhanced mb-4">
                <i className="fas fa-info-circle me-2"></i>
                Set the fee amounts for this class. These will be used automatically when generating fee chalans for students in this class.
              </Alert>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-enhanced">
                      Monthly Tuition Fee (PKR) <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      className="form-control-enhanced"
                      value={feeAmountForm.monthlyTuition}
                      onChange={(e) => setFeeAmountForm(prev => ({ ...prev, monthlyTuition: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter monthly tuition fee"
                      min="0"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-enhanced">
                      Examination Fee (PKR) <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      className="form-control-enhanced"
                      value={feeAmountForm.examinationFee}
                      onChange={(e) => setFeeAmountForm(prev => ({ ...prev, examinationFee: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter examination fee"
                      min="0"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-enhanced">
                      Library Fee (PKR)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      className="form-control-enhanced"
                      value={feeAmountForm.libraryFee}
                      onChange={(e) => setFeeAmountForm(prev => ({ ...prev, libraryFee: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter library fee"
                      min="0"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-enhanced">
                      Sports Fee (PKR)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      className="form-control-enhanced"
                      value={feeAmountForm.sportsFee}
                      onChange={(e) => setFeeAmountForm(prev => ({ ...prev, sportsFee: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter sports fee"
                      min="0"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-enhanced">
                      Transport Fee (PKR)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      className="form-control-enhanced"
                      value={feeAmountForm.transportFee}
                      onChange={(e) => setFeeAmountForm(prev => ({ ...prev, transportFee: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter transport fee"
                      min="0"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-enhanced">
                      Other Fees (PKR)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      className="form-control-enhanced"
                      value={feeAmountForm.otherFees}
                      onChange={(e) => setFeeAmountForm(prev => ({ ...prev, otherFees: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter other fees"
                      min="0"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="bg-light p-3 rounded mt-3">
                <h6 className="text-primary mb-2">
                  <i className="fas fa-calculator me-2"></i>
                  Total Amount: PKR {(
                    (feeAmountForm.monthlyTuition || 0) + 
                    (feeAmountForm.examinationFee || 0) + 
                    (feeAmountForm.libraryFee || 0) + 
                    (feeAmountForm.sportsFee || 0) + 
                    (feeAmountForm.transportFee || 0) + 
                    (feeAmountForm.otherFees || 0)
                  ).toLocaleString()}
                </h6>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary btn-enhanced" onClick={() => setEditingClassFee(null)}>
                <i className="fas fa-times me-2"></i>
                Cancel
              </Button>
              <Button 
                variant="success btn-enhanced" 
                onClick={() => saveClassFeeAmount(editingClassFee)}
                disabled={loading}
              >
                <i className="fas fa-save me-2"></i>
                {loading ? 'Saving...' : 'Save Fee Amounts'}
              </Button>
            </Modal.Footer>
          </Modal>
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

      {/* Pay Chalan Modal */}
      <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered>
        <Modal.Header closeButton style={{ 
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          color: 'white',
          border: 'none'
        }}>
          <Modal.Title>
            <i className="fas fa-money-bill-wave me-2"></i>
            Pay Chalan {payingChalan ? `- ${payingChalan.studentName}` : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {payingChalan && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="text-muted">Chalan #</div>
                  <div className="fw-bold">{payingChalan.chalanNumber}</div>
                </Col>
                <Col md={6}>
                  <div className="text-muted">Total Amount</div>
                  <div className="fw-bold">PKR {(payingChalan.fees?.totalAmount || 0).toLocaleString()}</div>
                </Col>
              </Row>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Amount Received (PKR)</Form.Label>
                  <Form.Control type="number" value={paymentForm.amountReceived} onChange={(e)=>setPaymentForm({...paymentForm, amountReceived: e.target.value})} />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Method</Form.Label>
                      <Form.Select value={paymentForm.paymentMethod} onChange={(e)=>setPaymentForm({...paymentForm, paymentMethod: e.target.value})}>
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="card">Card</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Paid Date</Form.Label>
                      <Form.Control type="date" value={paymentForm.paidDate} onChange={(e)=>setPaymentForm({...paymentForm, paidDate: e.target.value})} />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Reference No (optional)</Form.Label>
                  <Form.Control value={paymentForm.referenceNo} onChange={(e)=>setPaymentForm({...paymentForm, referenceNo: e.target.value})} placeholder="Transaction/Slip reference" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control as="textarea" rows={2} value={paymentForm.remarks} onChange={(e)=>setPaymentForm({...paymentForm, remarks: e.target.value})} />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary btn-enhanced" onClick={() => setShowPayModal(false)}>
            Cancel
          </Button>
          <Button variant="success btn-enhanced" onClick={submitPayment}>
            <i className="fas fa-check me-2"></i>Pay
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FeeChalan;
