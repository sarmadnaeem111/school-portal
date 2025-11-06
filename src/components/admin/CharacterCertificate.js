import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table, Alert, Modal, Badge } from 'react-bootstrap';
import { collection, getDocs, addDoc, query, where, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const CharacterCertificate = () => {
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
    className: '',
    academicYear: '2024-2025',
    issueDate: new Date().toLocaleDateString(),
    principalName: 'Principal Name',
    schoolName: 'School Portal',
    characterDescription: ''
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
        collection(db, 'characterCertificates'),
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

      await addDoc(collection(db, 'characterCertificates'), certificateToSave);
      setMessage('Character Certificate saved successfully!');
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
        await deleteDoc(doc(db, 'characterCertificates', certificateId));
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

    const currentDate = new Date().toLocaleDateString();
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Character Certificate - ${certificateData.studentName}</title>
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
            padding: 8px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            position: relative;
            box-sizing: border-box;
            page-break-inside: avoid;
          }
          .certificate-header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #2c3e50;
          }
          .school-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .certificate-title {
            font-size: 22px;
            font-weight: bold;
            color: #34495e;
            margin-bottom: 15px;
            text-decoration: underline;
            text-decoration-thickness: 2px;
            text-underline-offset: 4px;
          }
          .certificate-body {
            text-align: center;
            line-height: 1.6;
            font-size: 16px;
            margin-bottom: 20px;
            padding: 15px 0;
          }
          .student-info {
            background-color: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #3498db;
            box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-weight: bold;
            font-size: 16px;
            padding: 6px 0;
            border-bottom: 1px solid #bdc3c7;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .character-description {
            text-align: justify;
            margin: 20px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border: 2px solid #dee2e6;
            font-size: 16px;
            line-height: 1.6;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            max-height: 300px;
            overflow-y: auto;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 3px solid #2c3e50;
          }
          .signature-box {
            text-align: center;
            width: 200px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #dee2e6;
          }
          .signature-line {
            border-bottom: 2px solid #000;
            margin-bottom: 10px;
            height: 40px;
          }
          .signature-label {
            font-weight: bold;
            font-size: 14px;
            color: #2c3e50;
          }
          .date-section {
            text-align: right;
            margin-top: 15px;
            font-weight: bold;
            font-size: 14px;
            padding: 10px;
            background-color: #ecf0f1;
            border-radius: 6px;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            margin-bottom: 5px;
            height: 40px;
          }
          .signature-label {
            font-weight: bold;
            font-size: 14px;
          }
          .date-section {
            text-align: right;
            margin-top: 20px;
            font-weight: bold;
          }
          .seal {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 80px;
            height: 80px;
            border: 3px solid #e74c3c;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #fff;
            font-weight: bold;
            color: #e74c3c;
            font-size: 12px;
            text-align: center;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 0;
            }
            .no-print { display: none; }
            .certificate-container {
              width: 100% !important;
              height: calc(100vh - 0.6in) !important;
              margin: 0 !important;
              padding: 8px !important;
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
            .character-description {
              max-height: 250px !important;
              overflow: visible !important;
            }
            .certificate-container {
              height: auto !important;
              min-height: 100vh !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="seal">
            SCHOOL<br>SEAL
          </div>
          
          <div class="certificate-header">
            ${schoolLogo ? `<img src="${schoolLogo}" style="height:80px;margin-bottom:10px;object-fit:contain;" />` : ''}
            <div class="school-name">${certificateData.schoolName}</div>
            <div class="certificate-title">CHARACTER CERTIFICATE</div>
          </div>

          <div class="certificate-body">
            <p>This is to certify that</p>
            
            <div class="student-info">
              <div class="info-row">
                <span>Name:</span>
                <span>${certificateData.studentName}</span>
              </div>
              <div class="info-row">
                <span>Roll Number:</span>
                <span>${certificateData.rollNumber}</span>
              </div>
              <div class="info-row">
                <span>Class:</span>
                <span>${certificateData.className}</span>
              </div>
              <div class="info-row">
                <span>Academic Year:</span>
                <span>${certificateData.academicYear}</span>
              </div>
            </div>

            <p style="margin: 15px 0; font-size: 16px; font-weight: 500; padding: 10px; background-color: #f8f9fa; border-radius: 6px;">is a student of this institution and has shown exemplary character and conduct during the academic year.</p>

            <div class="character-description">
              <p style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #2c3e50; text-align: center;"><strong>Character Assessment:</strong></p>
              <p style="font-size: 16px; line-height: 1.6; text-align: justify; padding: 5px;">${certificateData.characterDescription || 'The student has demonstrated excellent moral character, integrity, and respect for teachers and fellow students. They have shown leadership qualities and have been a positive influence in the school community.'}</p>
              
            </div>

            <p style="margin: 15px 0; font-size: 16px; font-weight: 500; padding: 10px; background-color: #f8f9fa; border-radius: 6px;">This certificate is issued on this <strong>${certificateData.issueDate}</strong> and bears testimony to the student's good character and conduct.</p>
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
            <p>Date: ${certificateData.issueDate}</p>
            <p>Place: School Campus</p>
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
    link.download = `Character_Certificate_${certificateData.studentName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Certificate downloaded! You can open the file and print it.');
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
      
      const currentDate = new Date().toLocaleDateString();
      
      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Character Certificate - ${certificateData.studentName}</title>
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
            padding: 8px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            position: relative;
            box-sizing: border-box;
            page-break-inside: avoid;
          }
          .certificate-header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #2c3e50;
          }
          .school-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .certificate-title {
            font-size: 22px;
            font-weight: bold;
            color: #34495e;
            margin-bottom: 15px;
            text-decoration: underline;
            text-decoration-thickness: 2px;
            text-underline-offset: 4px;
          }
          .certificate-body {
            text-align: center;
            line-height: 1.6;
            font-size: 16px;
            margin-bottom: 20px;
            padding: 15px 0;
          }
          .student-info {
            background-color: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #3498db;
            box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-weight: bold;
            font-size: 16px;
            padding: 6px 0;
            border-bottom: 1px solid #bdc3c7;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .character-description {
            text-align: justify;
            margin: 20px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border: 2px solid #dee2e6;
            font-size: 16px;
            line-height: 1.6;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            max-height: 300px;
            overflow-y: auto;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 3px solid #2c3e50;
          }
          .signature-box {
            text-align: center;
            width: 200px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #dee2e6;
          }
          .signature-line {
            border-bottom: 2px solid #000;
            margin-bottom: 10px;
            height: 40px;
          }
          .signature-label {
            font-weight: bold;
            font-size: 14px;
            color: #2c3e50;
          }
          .date-section {
            text-align: right;
            margin-top: 15px;
            font-weight: bold;
            font-size: 14px;
            padding: 10px;
            background-color: #ecf0f1;
            border-radius: 6px;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            margin-bottom: 5px;
            height: 40px;
          }
          .signature-label {
            font-weight: bold;
            font-size: 14px;
          }
          .date-section {
            text-align: right;
            margin-top: 20px;
            font-weight: bold;
          }
          .seal {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 80px;
            height: 80px;
            border: 3px solid #e74c3c;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #fff;
            font-weight: bold;
            color: #e74c3c;
            font-size: 12px;
            text-align: center;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 0;
            }
            .no-print { display: none; }
            .certificate-container {
              width: 100% !important;
              height: calc(100vh - 0.6in) !important;
              margin: 0 !important;
              padding: 8px !important;
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
            .character-description {
              max-height: 250px !important;
              overflow: visible !important;
            }
            .certificate-container {
              height: auto !important;
              min-height: 100vh !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="seal">
            SCHOOL<br>SEAL
          </div>
          
          <div class="certificate-header">
            ${schoolLogo ? `<img src="${schoolLogo}" style="height:80px;margin-bottom:10px;object-fit:contain;" />` : ''}
            <div class="school-name">${certificateData.schoolName}</div>
            <div class="certificate-title">CHARACTER CERTIFICATE</div>
          </div>

          <div class="certificate-body">
            <p>This is to certify that</p>
            
            <div class="student-info">
              <div class="info-row">
                <span>Name:</span>
                <span>${certificateData.studentName}</span>
              </div>
              <div class="info-row">
                <span>Roll Number:</span>
                <span>${certificateData.rollNumber}</span>
              </div>
              <div class="info-row">
                <span>Class:</span>
                <span>${certificateData.className}</span>
              </div>
              <div class="info-row">
                <span>Academic Year:</span>
                <span>${certificateData.academicYear}</span>
              </div>
            </div>

            <p style="margin: 15px 0; font-size: 16px; font-weight: 500; padding: 10px; background-color: #f8f9fa; border-radius: 6px;">is a student of this institution and has shown exemplary character and conduct during the academic year.</p>

            <div class="character-description">
              <p style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #2c3e50; text-align: center;"><strong>Character Assessment:</strong></p>
              <p style="font-size: 16px; line-height: 1.6; text-align: justify; padding: 5px;">${certificateData.characterDescription || 'The student has demonstrated excellent moral character, integrity, and respect for teachers and fellow students. They have shown leadership qualities and have been a positive influence in the school community.'}</p>
              
            </div>

            <p style="margin: 15px 0; font-size: 16px; font-weight: 500; padding: 10px; background-color: #f8f9fa; border-radius: 6px;">This certificate is issued on this <strong>${certificateData.issueDate}</strong> and bears testimony to the student's good character and conduct.</p>
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
            <p>Date: ${certificateData.issueDate}</p>
            <p>Place: School Campus</p>
          </div>
        </div>
      </body>
      </html>
    `);
      
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

  const printCertificateFromData = (data) => {
    try {
      const html = `<!DOCTYPE html>
      <html><head><title>Character Certificate - ${data.studentName || ''}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; background: #fff; color: #000; }
        .certificate-container { width: 100%; min-height: 100vh; border: 4px solid #2c3e50; padding: 8px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); box-sizing: border-box; position: relative; }
        .certificate-header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #2c3e50; }
        .school-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .certificate-title { font-size: 22px; font-weight: bold; color: #34495e; margin-bottom: 15px; text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 4px; }
        .student-info { background:#ecf0f1; padding:20px; border-radius:8px; margin:15px 0; border-left:4px solid #3498db; box-shadow:0 1px 4px rgba(0,0,0,0.1); }
        .info-row { display:flex; justify-content:space-between; margin-bottom:10px; font-weight:bold; font-size:16px; padding:6px 0; border-bottom:1px solid #bdc3c7; }
        .info-row:last-child { border-bottom:none; }
        .character-description { text-align: justify; margin:20px 0; padding:20px; background:#f8f9fa; border-radius:8px; border:2px solid #dee2e6; font-size:16px; line-height:1.6; box-shadow:0 2px 6px rgba(0,0,0,0.1); }
        .signatures { display:flex; justify-content:space-between; margin-top:25px; padding-top:15px; border-top:3px solid #2c3e50; }
        .signature-box { text-align:center; width:200px; padding:15px; background:#f8f9fa; border-radius:6px; border:1px solid #dee2e6; }
        .signature-line { border-bottom:2px solid #000; margin-bottom:10px; height:40px; }
        .signature-label { font-weight:bold; font-size:14px; color:#2c3e50; }
        .date-section { text-align:right; margin-top:15px; font-weight:bold; font-size:14px; padding:10px; background:#ecf0f1; border-radius:6px; }
        .seal { position:absolute; top:20px; right:20px; width:80px; height:80px; border:3px solid #e74c3c; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#fff; font-weight:bold; color:#e74c3c; font-size:12px; text-align:center; }
        @media print { @page { margin: 0.3in 0.1in; size: A4; } }
      </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="seal">SCHOOL<br>SEAL</div>
          <div class="certificate-header">
            ${schoolLogo ? `<img src="${schoolLogo}" style="height:80px;margin-bottom:10px;object-fit:contain;" />` : ''}
            <div class="school-name">${data.schoolName || 'School Portal'}</div>
            <div class="certificate-title">CHARACTER CERTIFICATE</div>
          </div>
          <div class="student-info">
            <div class="info-row"><span>Name:</span><span>${data.studentName || ''}</span></div>
            <div class="info-row"><span>Roll Number:</span><span>${data.rollNumber || ''}</span></div>
            <div class="info-row"><span>Class:</span><span>${data.className || ''}</span></div>
            <div class="info-row"><span>Academic Year:</span><span>${data.academicYear || ''}</span></div>
          </div>
          <div class="character-description">${data.characterDescription || 'The student has demonstrated excellent moral character, integrity, and respect for teachers and fellow students. They have shown leadership qualities and have been a positive influence in the school community.'}</div>
          <div class="signatures">
            <div class="signature-box"><div class="signature-line"></div><div class="signature-label">Class Teacher</div></div>
            <div class="signature-box"><div class="signature-line"></div><div class="signature-label">Principal</div></div>
          </div>
          <div class="date-section">
            <p>Date: ${data.issueDate || new Date().toLocaleDateString()}</p>
            <p>Place: School Campus</p>
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
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {}
        setTimeout(() => { try { document.body.removeChild(iframe); } catch (_) {} }, 1000);
      };
      iframe.srcdoc = html;
    } catch (e) {
      console.error('Failed to print certificate:', e);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Character Certificate</h2>
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
                        <i className="fas fa-certificate me-1"></i>
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
              Please select a class to view students and generate character certificates.
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Certificate Generation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Generate Character Certificate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Student Name</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.studentName}
                  onChange={(e) => handleCertificateDataChange('studentName', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Roll Number</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.rollNumber}
                  onChange={(e) => handleCertificateDataChange('rollNumber', e.target.value)}
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
                <Form.Label>Principal Name</Form.Label>
                <Form.Control
                  type="text"
                  value={certificateData.principalName}
                  onChange={(e) => handleCertificateDataChange('principalName', e.target.value)}
                />
              </Form.Group>
            </Col>
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
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Character Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={certificateData.characterDescription}
              onChange={(e) => handleCertificateDataChange('characterDescription', e.target.value)}
              placeholder="Describe the student's character and behavior..."
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
          <Modal.Title>Saved Character Certificates</Modal.Title>
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
                        onClick={() => printCertificateFromData(certificate)}
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
              <p className="text-muted">No character certificates have been saved yet.</p>
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

export default CharacterCertificate;
