import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table, Alert, Modal, Badge } from 'react-bootstrap';
import { collection, getDocs, addDoc, query, where, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const SchoolLeavingCertificate = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [savedCertificates, setSavedCertificates] = useState([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [certificateData, setCertificateData] = useState({
    studentName: '',
    rollNumber: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    admissionNumber: '',
    admissionDate: '',
    className: '',
    academicYear: '2024-2025',
    leavingDate: new Date().toLocaleDateString(),
    reasonForLeaving: 'Completion of Course',
    conduct: 'Excellent',
    attendance: '95%',
    principalName: 'Principal Name',
    schoolName: 'School Portal',
    schoolAddress: 'School Address, City, State',
    schoolPhone: 'Phone Number',
    schoolEmail: 'school@example.com',
    boardName: 'Board of Education',
    lastExamPassed: 'Class 10',
    examYear: '2024',
    examBoard: 'Board of Education',
    subjectsStudied: 'English, Mathematics, Science, Social Studies, Computer Science',
    overallGrade: 'A+',
    remarks: ''
  });
  const [schoolLogo, setSchoolLogo] = useState('');

  useEffect(() => {
    fetchSchoolProfile();
    fetchClasses();
    fetchSavedCertificates();
  }, []);

  const fetchSchoolProfile = async () => {
    try {
      const profileRef = doc(db, 'schoolProfile', 'main');
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        if (data.schoolName) {
          setCertificateData(prev => ({ ...prev, schoolName: data.schoolName }));
        }
        if (data.principalName) {
          setCertificateData(prev => ({ ...prev, principalName: data.principalName }));
        }
        if (data.address) {
          setCertificateData(prev => ({ ...prev, schoolAddress: data.address }));
        }
        if (data.phone) {
          setCertificateData(prev => ({ ...prev, schoolPhone: data.phone }));
        }
        if (data.email) {
          setCertificateData(prev => ({ ...prev, schoolEmail: data.email }));
        }
        if (data.board) {
          setCertificateData(prev => ({ ...prev, boardName: data.board }));
        }
        if (data.logo) {
          setSchoolLogo(data.logo);
        }
      }
    } catch (error) {
      console.error('Error fetching school profile:', error);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const classesSnapshot = await getDocs(collection(db, 'classes'));
      const classesList = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesList);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setMessage('Error fetching classes');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('classId', '==', selectedClass)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage('Error fetching students');
      setMessageType('danger');
    }
  };

  const fetchSavedCertificates = async () => {
    try {
      const certificatesQuery = query(
        collection(db, 'schoolLeavingCertificates'),
        orderBy('createdAt', 'desc')
      );
      const certificatesSnapshot = await getDocs(certificatesQuery);
      const certificatesList = certificatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedCertificates(certificatesList);
    } catch (error) {
      console.error('Error fetching saved certificates:', error);
    }
  };

  const getClassName = (classId) => {
    const classData = classes.find(cls => cls.id === classId);
    if (classData) {
      return `${classData.name} - ${classData.section} (Grade ${classData.grade})`;
    }
    return `Class ${classId}`;
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setCertificateData({
      ...certificateData,
      studentName: student.name || '',
      rollNumber: student.rollNumber || '',
      className: getClassName(student.classId)
    });
    setShowModal(true);
  };

  const handleCertificateDataChange = (field, value) => {
    setCertificateData({
      ...certificateData,
      [field]: value
    });
  };

  const saveCertificate = async () => {
    try {
      const certificateToSave = {
        ...certificateData,
        studentId: selectedStudent?.id,
        studentEmail: selectedStudent?.email,
        createdAt: new Date(),
        status: 'saved'
      };

      await addDoc(collection(db, 'schoolLeavingCertificates'), certificateToSave);
      setMessage('Certificate saved successfully!');
      setMessageType('success');
      fetchSavedCertificates();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving certificate:', error);
      setMessage('Error saving certificate');
      setMessageType('danger');
    }
  };

  const deleteCertificate = async (certificateId) => {
    if (window.confirm('Are you sure you want to delete this certificate?')) {
      try {
        await deleteDoc(doc(db, 'schoolLeavingCertificates', certificateId));
        setMessage('Certificate deleted successfully!');
        setMessageType('success');
        fetchSavedCertificates();
      } catch (error) {
        console.error('Error deleting certificate:', error);
        setMessage('Error deleting certificate');
        setMessageType('danger');
      }
    }
  };

  const generateCertificateFile = () => {
    // Validate required fields
    if (!certificateData.studentName || !certificateData.rollNumber) {
      alert('Please fill in the student name and roll number before generating the certificate.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>School Leaving Certificate - ${certificateData.studentName}</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 0;
            background-color: #fff;
            color: #000;
          }
          .certificate-container {
            width: 100%;
            height: 100vh;
            border: 4px solid #2c3e50;
            padding: 15px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            position: relative;
            box-sizing: border-box;
            page-break-inside: avoid;
          }
          .certificate-header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 10px;
          }
          .school-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .school-address {
            font-size: 12px;
            color: #7f8c8d;
            margin-bottom: 3px;
          }
          .certificate-title {
            font-size: 20px;
            font-weight: bold;
            color: #34495e;
            margin: 10px 0;
            text-decoration: underline;
            text-decoration-thickness: 2px;
            text-underline-offset: 5px;
          }
          .certificate-body {
            line-height: 1.4;
            font-size: 14px;
            margin-bottom: 15px;
          }
          .student-info {
            background-color: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #3498db;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-weight: bold;
            padding: 1px 0;
            border-bottom: 1px solid #bdc3c7;
            font-size: 12px;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            color: #2c3e50;
            font-weight: bold;
            min-width: 180px;
            flex: 0 0 180px;
          }
          .info-value {
            color: #34495e;
            flex: 1;
            text-align: right;
            padding-left: 10px;
          }
          .academic-details {
            background-color: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            margin: 10px 0;
            border: 1px solid #dee2e6;
          }
          .academic-details h4 {
            color: #2c3e50;
            margin-bottom: 8px;
            text-align: center;
            font-size: 14px;
          }
          .subjects-list {
            margin: 5px 0;
            padding: 6px;
            background-color: #fff;
            border-radius: 4px;
            border: 1px solid #e9ecef;
            font-size: 12px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #2c3e50;
          }
          .signature-box {
            text-align: center;
            width: 200px;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            margin-bottom: 4px;
            height: 30px;
          }
          .signature-label {
            font-weight: bold;
            font-size: 12px;
            color: #2c3e50;
          }
          .date-section {
            text-align: right;
            margin-top: 15px;
            font-weight: bold;
            font-size: 12px;
          }
          .seal {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 60px;
            height: 60px;
            border: 2px solid #e74c3c;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #fff;
            font-weight: bold;
            color: #e74c3c;
            font-size: 10px;
            text-align: center;
            box-shadow: 0 1px 5px rgba(0,0,0,0.2);
          }
          .certificate-number {
            position: absolute;
            top: 10px;
            left: 10px;
            font-size: 10px;
            color: #7f8c8d;
            font-weight: bold;
          }
          .footer-info {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #bdc3c7;
            text-align: center;
            font-size: 10px;
            color: #7f8c8d;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 0;
            }
            .no-print { display: none; }
            .certificate-container {
              width: 100% !important;
              height: 100vh !important;
              margin: 0 !important;
              padding: 10px !important;
              box-sizing: border-box;
              overflow: hidden;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            @page {
              margin: 0.2in 0.1in;
              size: A4;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="seal">
            SCHOOL<br>SEAL
          </div>
          
          <div class="certificate-number">
            Certificate No: SLC-${Date.now().toString().slice(-6)}
          </div>
          
          <div class="certificate-header">
            ${schoolLogo ? `<img src="${schoolLogo}" style="height:70px;margin-bottom:8px;object-fit:contain;" />` : ''}
            <div class="school-name">${certificateData.schoolName}</div>
            <div class="school-address">${certificateData.schoolAddress}</div>
            <div class="school-address">Phone: ${certificateData.schoolPhone} | Email: ${certificateData.schoolEmail}</div>
            <div class="certificate-title">SCHOOL LEAVING CERTIFICATE</div>
          </div>

          <div class="certificate-body">
            <p style="text-align: center; font-size: 14px; margin-bottom: 15px;">
              <strong>This is to certify that</strong>
            </p>
            
            <div class="student-info">
              <div class="info-row">
                <span class="info-label">Student Name:</span>
                <span class="info-value">${certificateData.studentName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Roll Number:</span>
                <span class="info-value">${certificateData.rollNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Father's Name:</span>
                <span class="info-value">${certificateData.fatherName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Mother's Name:</span>
                <span class="info-value">${certificateData.motherName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date of Birth:</span>
                <span class="info-value">${certificateData.dateOfBirth}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Place of Birth:</span>
                <span class="info-value">${certificateData.placeOfBirth}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Admission Number:</span>
                <span class="info-value">${certificateData.admissionNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Admission Date:</span>
                <span class="info-value">${certificateData.admissionDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Class:</span>
                <span class="info-value">${certificateData.className}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Academic Year:</span>
                <span class="info-value">${certificateData.academicYear}</span>
              </div>
            </div>

            <div class="academic-details">
              <h4>Academic Performance</h4>
              <div class="info-row">
                <span class="info-label">Last Exam Passed:</span>
                <span class="info-value">${certificateData.lastExamPassed} (${certificateData.examYear})</span>
              </div>
              <div class="info-row">
                <span class="info-label">Exam Board:</span>
                <span class="info-value">${certificateData.examBoard}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Overall Grade:</span>
                <span class="info-value">${certificateData.overallGrade}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Conduct:</span>
                <span class="info-value">${certificateData.conduct}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Attendance:</span>
                <span class="info-value">${certificateData.attendance}</span>
              </div>
              <div class="subjects-list">
                <strong>Subjects Studied:</strong><br>
                ${certificateData.subjectsStudied}
              </div>
            </div>

            <p style="text-align: justify; margin: 10px 0; font-size: 13px;">
              The above-named student was a bonafide student of this institution from 
              <strong>${certificateData.admissionDate}</strong> to <strong>${certificateData.leavingDate}</strong> 
              and has completed the course of study satisfactorily. The student's conduct during the period of study was 
              <strong>${certificateData.conduct}</strong> and attendance was <strong>${certificateData.attendance}</strong>.
            </p>

            <p style="text-align: justify; margin: 10px 0; font-size: 13px;">
              <strong>Reason for Leaving:</strong> ${certificateData.reasonForLeaving}
            </p>

            ${certificateData.remarks ? `
            <p style="text-align: justify; margin: 10px 0; font-size: 13px;">
              <strong>Remarks:</strong> ${certificateData.remarks}
            </p>
            ` : ''}

            <p style="text-align: center; margin: 15px 0; font-size: 13px;">
              This certificate is issued on this <strong>${certificateData.leavingDate}</strong> and bears testimony to the student's academic record and conduct during the period of study.
            </p>
          </div>

          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Class Teacher</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Principal</div>
            </div>
          </div>

          <div class="date-section">
            <p>Date: ${certificateData.leavingDate}</p>
            <p>Place: ${certificateData.schoolAddress.split(',')[0]}</p>
          </div>

          <div class="footer-info">
            <p>This is a computer-generated certificate. No signature is required.</p>
            <p>For verification, contact: ${certificateData.schoolEmail} | ${certificateData.schoolPhone}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create a blob and download the file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `School_Leaving_Certificate_${certificateData.studentName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('School Leaving Certificate downloaded! You can open the file and print it.');
  };

  const generateCertificate = () => {
    // Validate required fields
    if (!certificateData.studentName || !certificateData.rollNumber) {
      alert('Please fill in the student name and roll number before generating the certificate.');
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        // Fallback: Create downloadable HTML file
        generateCertificateFile();
        return;
      }
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>School Leaving Certificate - ${certificateData.studentName}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              margin: 0;
              padding: 0;
              background-color: #fff;
              color: #000;
            }
            .certificate-container {
              width: 100%;
              height: 100vh;
              border: 4px solid #2c3e50;
              padding: 15px;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              position: relative;
              box-sizing: border-box;
              page-break-inside: avoid;
            }
            .certificate-header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 2px solid #2c3e50;
              padding-bottom: 10px;
            }
            .school-name {
              font-size: 24px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .school-address {
              font-size: 12px;
              color: #7f8c8d;
              margin-bottom: 3px;
            }
            .certificate-title {
              font-size: 20px;
              font-weight: bold;
              color: #34495e;
              margin: 10px 0;
              text-decoration: underline;
              text-decoration-thickness: 2px;
              text-underline-offset: 5px;
            }
            .certificate-body {
              line-height: 1.4;
              font-size: 14px;
              margin-bottom: 15px;
            }
            .student-info {
              background-color: #ecf0f1;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
              border-left: 4px solid #3498db;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              font-weight: bold;
              padding: 1px 0;
              border-bottom: 1px solid #bdc3c7;
              font-size: 12px;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              color: #2c3e50;
              font-weight: bold;
              min-width: 180px;
              flex: 0 0 180px;
            }
            .info-value {
              color: #34495e;
              flex: 1;
              text-align: right;
              padding-left: 10px;
            }
            .academic-details {
              background-color: #f8f9fa;
              padding: 12px;
              border-radius: 6px;
              margin: 10px 0;
              border: 1px solid #dee2e6;
            }
            .academic-details h4 {
              color: #2c3e50;
              margin-bottom: 8px;
              text-align: center;
              font-size: 14px;
            }
            .subjects-list {
              margin: 5px 0;
              padding: 6px;
              background-color: #fff;
              border-radius: 4px;
              border: 1px solid #e9ecef;
              font-size: 12px;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px solid #2c3e50;
            }
            .signature-box {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              margin-bottom: 4px;
              height: 30px;
            }
            .signature-label {
              font-weight: bold;
              font-size: 12px;
              color: #2c3e50;
            }
            .date-section {
              text-align: right;
              margin-top: 15px;
              font-weight: bold;
              font-size: 12px;
            }
            .seal {
              position: absolute;
              top: 15px;
              right: 15px;
              width: 60px;
              height: 60px;
              border: 2px solid #e74c3c;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #fff;
              font-weight: bold;
              color: #e74c3c;
              font-size: 10px;
              text-align: center;
              box-shadow: 0 1px 5px rgba(0,0,0,0.2);
            }
            .certificate-number {
              position: absolute;
              top: 10px;
              left: 10px;
              font-size: 10px;
              color: #7f8c8d;
              font-weight: bold;
            }
            .footer-info {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #bdc3c7;
              text-align: center;
              font-size: 10px;
              color: #7f8c8d;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 0;
              }
              .no-print { display: none; }
              .certificate-container {
                width: 100% !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 10px !important;
                box-sizing: border-box;
                overflow: hidden;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              @page {
                margin: 0.3in 0.1in;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="seal">
              SCHOOL<br>SEAL
            </div>
            
            <div class="certificate-number">
              Certificate No: SLC-${Date.now().toString().slice(-6)}
            </div>
            
            <div class="certificate-header">
              ${schoolLogo ? `<img src="${schoolLogo}" style="height:70px;margin-bottom:8px;object-fit:contain;" />` : ''}
              <div class="school-name">${certificateData.schoolName}</div>
              <div class="school-address">${certificateData.schoolAddress}</div>
              <div class="school-address">Phone: ${certificateData.schoolPhone} | Email: ${certificateData.schoolEmail}</div>
              <div class="certificate-title">SCHOOL LEAVING CERTIFICATE</div>
            </div>

            <div class="certificate-body">
              <p style="text-align: center; font-size: 14px; margin-bottom: 15px;">
                <strong>This is to certify that</strong>
              </p>
              
              <div class="student-info">
                <div class="info-row">
                  <span class="info-label">Student Name:</span>
                  <span class="info-value">${certificateData.studentName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Roll Number:</span>
                  <span class="info-value">${certificateData.rollNumber}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Father's Name:</span>
                  <span class="info-value">${certificateData.fatherName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Mother's Name:</span>
                  <span class="info-value">${certificateData.motherName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date of Birth:</span>
                  <span class="info-value">${certificateData.dateOfBirth}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Place of Birth:</span>
                  <span class="info-value">${certificateData.placeOfBirth}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Admission Number:</span>
                  <span class="info-value">${certificateData.admissionNumber}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Admission Date:</span>
                  <span class="info-value">${certificateData.admissionDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Class:</span>
                  <span class="info-value">${certificateData.className}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Academic Year:</span>
                  <span class="info-value">${certificateData.academicYear}</span>
                </div>
              </div>

              <div class="academic-details">
                <h4>Academic Performance</h4>
                <div class="info-row">
                  <span class="info-label">Last Exam Passed:</span>
                  <span class="info-value">${certificateData.lastExamPassed} (${certificateData.examYear})</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Exam Board:</span>
                  <span class="info-value">${certificateData.examBoard}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Overall Grade:</span>
                  <span class="info-value">${certificateData.overallGrade}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Conduct:</span>
                  <span class="info-value">${certificateData.conduct}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Attendance:</span>
                  <span class="info-value">${certificateData.attendance}</span>
                </div>
                <div class="subjects-list">
                  <strong>Subjects Studied:</strong><br>
                  ${certificateData.subjectsStudied}
                </div>
              </div>

              <p style="text-align: justify; margin: 10px 0; font-size: 13px;">
                The above-named student was a bonafide student of this institution from 
                <strong>${certificateData.admissionDate}</strong> to <strong>${certificateData.leavingDate}</strong> 
                and has completed the course of study satisfactorily. The student's conduct during the period of study was 
                <strong>${certificateData.conduct}</strong> and attendance was <strong>${certificateData.attendance}</strong>.
              </p>

              <p style="text-align: justify; margin: 10px 0; font-size: 13px;">
                <strong>Reason for Leaving:</strong> ${certificateData.reasonForLeaving}
              </p>

              ${certificateData.remarks ? `
              <p style="text-align: justify; margin: 10px 0; font-size: 13px;">
                <strong>Remarks:</strong> ${certificateData.remarks}
              </p>
              ` : ''}

              <p style="text-align: center; margin: 15px 0; font-size: 13px;">
                This certificate is issued on this <strong>${certificateData.leavingDate}</strong> and bears testimony to the student's academic record and conduct during the period of study.
              </p>
            </div>

            <div class="signatures">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Class Teacher</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Principal</div>
              </div>
            </div>

            <div class="date-section">
              <p>Date: ${certificateData.leavingDate}</p>
              <p>Place: ${certificateData.schoolAddress.split(',')[0]}</p>
            </div>

            <div class="footer-info">
              <p>This is a computer-generated certificate. No signature is required.</p>
              <p>For verification, contact: ${certificateData.schoolEmail} | ${certificateData.schoolPhone}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for the content to load before printing
      setTimeout(() => {
        try {
          printWindow.print();
          // Close the window after a short delay
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        } catch (printError) {
          console.error('Print error:', printError);
          alert('Print dialog could not be opened. The certificate is ready in the new window.');
        }
      }, 500);
      
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Error generating certificate. Please try again.');
    }
  };

  const printSLCFromData = (data) => {
    try {
      const html = `<!DOCTYPE html><html><head><title>School Leaving Certificate - ${data.studentName || ''}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin:0; padding:0; background:#fff; color:#000; }
        .certificate-container { width:100%; min-height:100vh; border:4px solid #2c3e50; padding:15px; background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); box-sizing:border-box; position:relative; }
        .certificate-header { text-align:center; margin-bottom:15px; border-bottom:2px solid #2c3e50; padding-bottom:10px; }
        .school-name { font-size:24px; font-weight:bold; color:#2c3e50; margin-bottom:5px; text-transform:uppercase; letter-spacing:2px; }
        .school-address { font-size:12px; color:#7f8c8d; margin-bottom:3px; }
        .certificate-title { font-size:20px; font-weight:bold; color:#34495e; margin:10px 0; text-decoration:underline; text-decoration-thickness:2px; text-underline-offset:5px; }
        .student-info { background:#ecf0f1; padding:15px; border-radius:8px; margin:15px 0; border-left:4px solid #3498db; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
        .info-row { display:flex; justify-content:space-between; margin-bottom:4px; font-weight:bold; padding:1px 0; border-bottom:1px solid #bdc3c7; font-size:12px; }
        .info-row:last-child { border-bottom:none; }
        .info-label { color:#2c3e50; font-weight:bold; min-width:180px; flex:0 0 180px; }
        .info-value { color:#34495e; flex:1; text-align:right; padding-left:10px; }
        .academic-details { background:#f8f9fa; padding:12px; border-radius:6px; margin:10px 0; border:1px solid #dee2e6; }
        .academic-details h4 { color:#2c3e50; margin-bottom:8px; text-align:center; font-size:14px; }
        .subjects-list { margin:5px 0; padding:6px; background:#fff; border-radius:4px; border:1px solid #e9ecef; font-size:12px; }
        .signatures { display:flex; justify-content:space-between; margin-top:20px; padding-top:15px; border-top:2px solid #2c3e50; }
        .signature-box { text-align:center; width:200px; }
        .signature-line { border-bottom:1px solid #000; margin-bottom:4px; height:30px; }
        .signature-label { font-weight:bold; font-size:12px; color:#2c3e50; }
        .date-section { text-align:right; margin-top:15px; font-weight:bold; font-size:12px; }
        .seal { position:absolute; top:15px; right:15px; width:60px; height:60px; border:2px solid #e74c3c; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#fff; font-weight:bold; color:#e74c3c; font-size:10px; text-align:center; box-shadow:0 1px 5px rgba(0,0,0,0.2); }
        .certificate-number { position:absolute; top:10px; left:10px; font-size:10px; color:#7f8c8d; font-weight:bold; }
        @media print { @page { margin: 0.3in 0.1in; size: A4; } }
      </style></head><body>
      <div class="certificate-container">
        <div class="seal">SCHOOL<br>SEAL</div>
        <div class="certificate-number">Certificate No: SLC-${Date.now().toString().slice(-6)}</div>
        <div class="certificate-header">
          <div class="school-name">${data.schoolName || 'School Portal'}</div>
          <div class="school-address">${data.schoolAddress || ''}</div>
          <div class="school-address">Phone: ${data.schoolPhone || ''} | Email: ${data.schoolEmail || ''}</div>
          <div class="certificate-title">SCHOOL LEAVING CERTIFICATE</div>
        </div>
        <div class="student-info">
          <div class="info-row"><span class="info-label">Student Name:</span><span class="info-value">${data.studentName || ''}</span></div>
          <div class="info-row"><span class="info-label">Roll Number:</span><span class="info-value">${data.rollNumber || ''}</span></div>
          <div class="info-row"><span class="info-label">Father's Name:</span><span class="info-value">${data.fatherName || ''}</span></div>
          <div class="info-row"><span class="info-label">Mother's Name:</span><span class="info-value">${data.motherName || ''}</span></div>
          <div class="info-row"><span class="info-label">Date of Birth:</span><span class="info-value">${data.dateOfBirth || ''}</span></div>
          <div class="info-row"><span class="info-label">Place of Birth:</span><span class="info-value">${data.placeOfBirth || ''}</span></div>
          <div class="info-row"><span class="info-label">Admission Number:</span><span class="info-value">${data.admissionNumber || ''}</span></div>
          <div class="info-row"><span class="info-label">Admission Date:</span><span class="info-value">${data.admissionDate || ''}</span></div>
          <div class="info-row"><span class="info-label">Class:</span><span class="info-value">${data.className || ''}</span></div>
          <div class="info-row"><span class="info-label">Academic Year:</span><span class="info-value">${data.academicYear || ''}</span></div>
        </div>
        <div class="academic-details">
          <h4>Academic Performance</h4>
          <div class="info-row"><span class="info-label">Last Exam Passed:</span><span class="info-value">${data.lastExamPassed || ''} ${data.examYear ? '(' + data.examYear + ')' : ''}</span></div>
          <div class="info-row"><span class="info-label">Exam Board:</span><span class="info-value">${data.examBoard || ''}</span></div>
          <div class="info-row"><span class="info-label">Overall Grade:</span><span class="info-value">${data.overallGrade || ''}</span></div>
          <div class="info-row"><span class="info-label">Conduct:</span><span class="info-value">${data.conduct || ''}</span></div>
          <div class="info-row"><span class="info-label">Attendance:</span><span class="info-value">${data.attendance || ''}</span></div>
          ${data.subjectsStudied ? `<div class="subjects-list"><strong>Subjects Studied:</strong><br>${data.subjectsStudied}</div>` : ''}
        </div>

        <p style="text-align: justify; margin: 10px 0; font-size: 13px;">
          The above-named student was a bonafide student of this institution from 
          <strong>${data.admissionDate || ''}</strong> to <strong>${data.leavingDate || ''}</strong> 
          and has completed the course of study satisfactorily. The student's conduct during the period of study was 
          <strong>${data.conduct || ''}</strong> and attendance was <strong>${data.attendance || ''}</strong>.
        </p>

        ${data.reasonForLeaving ? `<p style="text-align: justify; margin: 10px 0; font-size: 13px;"><strong>Reason for Leaving:</strong> ${data.reasonForLeaving}</p>` : ''}
        ${data.remarks ? `<p style="text-align: justify; margin: 10px 0; font-size: 13px;"><strong>Remarks:</strong> ${data.remarks}</p>` : ''}
        <div class="date-section">
          <p>Date: ${data.leavingDate || new Date().toLocaleDateString()}</p>
          <p>Place: ${(data.schoolAddress || '').split(',')[0]}</p>
        </div>
        <div class="signatures">
          <div class="signature-box"><div class="signature-line"></div><div class="signature-label">Class Teacher</div></div>
          <div class="signature-box"><div class="signature-line"></div><div class="signature-label">Principal</div></div>
        </div>
      </div>
      </body></html>`;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch (e) {}
        setTimeout(() => { try { document.body.removeChild(iframe); } catch (_) {} }, 1000);
      };
      iframe.srcdoc = html;
    } catch (e) {
      console.error('Failed to print SLC:', e);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>School Leaving Certificate</h2>
        <Button variant="outline-info" onClick={() => setShowSavedModal(true)}>
          <i className="fas fa-archive me-2"></i>
          View Saved Certificates ({savedCertificates.length})
        </Button>
      </div>
      
      {message && (
        <Alert variant={messageType} onClose={() => setMessage('')} dismissible>
          {message}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Select Class</Form.Label>
            <Form.Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Choose a class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {getClassName(cls.id)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {selectedClass && students.length > 0 && (
        <Card>
          <Card.Header>
            <h5>Students in {getClassName(selectedClass)}</h5>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
            <Table striped bordered hover className="table-enhanced">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Roll Number</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.rollNumber || 'N/A'}</td>
                    <td>{student.email}</td>
                    <td>{student.phone || 'N/A'}</td>
                    <td>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleStudentSelect(student)}
                      >
                        <i className="fas fa-graduation-cap me-1"></i>
                        Generate Certificate
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

      {selectedClass && students.length === 0 && (
        <Card>
          <Card.Body className="text-center">
            <i className="fas fa-users fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">No Students Found</h5>
            <p className="text-muted">
              No students found for the selected class.
            </p>
          </Card.Body>
        </Card>
      )}

      {!selectedClass && (
        <Card>
          <Card.Body className="text-center">
            <i className="fas fa-graduation-cap fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">Select a Class</h5>
            <p className="text-muted">
              Please select a class to view students and generate school leaving certificates.
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Certificate Generation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Generate School Leaving Certificate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Student Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.studentName}
                  onChange={(e) => handleCertificateDataChange('studentName', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Roll Number *</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.rollNumber}
                  onChange={(e) => handleCertificateDataChange('rollNumber', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Father's Name</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.fatherName}
                  onChange={(e) => handleCertificateDataChange('fatherName', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mother's Name</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.motherName}
                  onChange={(e) => handleCertificateDataChange('motherName', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date of Birth</Form.Label>
                <Form.Control
                  type="date"
                  value={certificateData.dateOfBirth}
                  onChange={(e) => handleCertificateDataChange('dateOfBirth', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Place of Birth</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.placeOfBirth}
                  onChange={(e) => handleCertificateDataChange('placeOfBirth', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Admission Number</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.admissionNumber}
                  onChange={(e) => handleCertificateDataChange('admissionNumber', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Admission Date</Form.Label>
                <Form.Control
                  type="date"
                  value={certificateData.admissionDate}
                  onChange={(e) => handleCertificateDataChange('admissionDate', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Class</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.className}
                  onChange={(e) => handleCertificateDataChange('className', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Academic Year</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.academicYear}
                  onChange={(e) => handleCertificateDataChange('academicYear', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Leaving Date</Form.Label>
                <Form.Control
                  type="date"
                  value={certificateData.leavingDate}
                  onChange={(e) => handleCertificateDataChange('leavingDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Reason for Leaving</Form.Label>
                <Form.Select
                  value={certificateData.reasonForLeaving}
                  onChange={(e) => handleCertificateDataChange('reasonForLeaving', e.target.value)}
                >
                  <option value="Completion of Course">Completion of Course</option>
                  <option value="Transfer to Another School">Transfer to Another School</option>
                  <option value="Family Relocation">Family Relocation</option>
                  <option value="Personal Reasons">Personal Reasons</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Conduct</Form.Label>
                <Form.Select
                  value={certificateData.conduct}
                  onChange={(e) => handleCertificateDataChange('conduct', e.target.value)}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Satisfactory">Satisfactory</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Attendance</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.attendance}
                  onChange={(e) => handleCertificateDataChange('attendance', e.target.value)}
                  placeholder="e.g., 95%"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Last Exam Passed</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.lastExamPassed}
                  onChange={(e) => handleCertificateDataChange('lastExamPassed', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Exam Year</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.examYear}
                  onChange={(e) => handleCertificateDataChange('examYear', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Overall Grade</Form.Label>
                <Form.Select
                  value={certificateData.overallGrade}
                  onChange={(e) => handleCertificateDataChange('overallGrade', e.target.value)}
                >
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="C+">C+</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Exam Board</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.examBoard}
                  onChange={(e) => handleCertificateDataChange('examBoard', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Subjects Studied</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={certificateData.subjectsStudied}
              onChange={(e) => handleCertificateDataChange('subjectsStudied', e.target.value)}
              placeholder="List all subjects studied..."
            />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>School Name</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.schoolName}
                  onChange={(e) => handleCertificateDataChange('schoolName', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Principal Name</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.principalName}
                  onChange={(e) => handleCertificateDataChange('principalName', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>School Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={certificateData.schoolAddress}
              onChange={(e) => handleCertificateDataChange('schoolAddress', e.target.value)}
            />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>School Phone</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.schoolPhone}
                  onChange={(e) => handleCertificateDataChange('schoolPhone', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>School Email</Form.Label>
                <Form.Control
                  type="email"
                  value={certificateData.schoolEmail}
                  onChange={(e) => handleCertificateDataChange('schoolEmail', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Remarks</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={certificateData.remarks}
              onChange={(e) => handleCertificateDataChange('remarks', e.target.value)}
              placeholder="Any additional remarks or comments..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={saveCertificate}>
            <i className="fas fa-save me-1"></i>
            Save Certificate
          </Button>
          <Button variant="outline-primary" onClick={generateCertificateFile}>
            <i className="fas fa-download me-1"></i>
            Download Certificate
          </Button>
          <Button variant="primary" onClick={generateCertificate}>
            <i className="fas fa-print me-1"></i>
            Print Certificate
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Saved Certificates Modal */}
      <Modal show={showSavedModal} onHide={() => setShowSavedModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Saved School Leaving Certificates</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {savedCertificates.length > 0 ? (
            <div className="table-responsive">
            <Table striped bordered hover className="table-enhanced">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Class</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedCertificates.map(certificate => (
                  <tr key={certificate.id}>
                    <td>{certificate.studentName}</td>
                    <td>{certificate.rollNumber}</td>
                    <td>{certificate.className}</td>
                    <td>{certificate.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
                    <td>
                      <Badge bg="success">{certificate.status}</Badge>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => {
                          setCertificateData(certificate);
                          setShowSavedModal(false);
                          setShowModal(true);
                        }}
                        className="me-2"
                      >
                        <i className="fas fa-edit me-1"></i>
                        Edit
                      </Button>
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        onClick={() => printSLCFromData(certificate)}
                        className="me-2"
                      >
                        <i className="fas fa-print me-1"></i>
                        Print
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => deleteCertificate(certificate.id)}
                      >
                        <i className="fas fa-trash me-1"></i>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-certificate fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No Saved Certificates</h5>
              <p className="text-muted">No school leaving certificates have been saved yet.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSavedModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SchoolLeavingCertificate;
