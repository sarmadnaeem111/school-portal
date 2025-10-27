import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Row, Col, Card, Badge } from 'react-bootstrap';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinaryUpload';

const StudyMaterials = () => {
  const { currentUser } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    materialType: 'homework',
    file: null
  });

  useEffect(() => {
    fetchTeacherSubjects();
    fetchMaterials();
  }, []);

  const fetchTeacherSubjects = async () => {
    try {
      const subjectsQuery = query(collection(db, 'subjects'), where('teacherId', '==', currentUser.uid));
      const subjectsSnapshot = await getDocs(subjectsQuery);
      setSubjects(subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const materialsQuery = query(collection(db, 'studyMaterials'), where('teacherId', '==', currentUser.uid));
      const materialsSnapshot = await getDocs(materialsQuery);
      const materialsList = materialsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaterials(materialsList.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let fileData = null;

      if (formData.file) {
        console.log('Uploading file to Cloudinary:', formData.file.name);
        fileData = await uploadToCloudinary(formData.file, 'study-materials');
        console.log('File uploaded successfully:', fileData);
      }

      const materialData = {
        title: formData.title,
        description: formData.description,
        subjectId: formData.subjectId,
        subjectName: subjects.find(s => s.id === formData.subjectId)?.name,
        materialType: formData.materialType,
        fileUrl: fileData?.url || null,
        fileName: fileData?.fileName || null,
        fileSize: fileData?.fileSize || null,
        publicId: fileData?.publicId || null,
        teacherId: currentUser.uid,
        teacherName: currentUser.displayName,
        createdAt: new Date()
      };

      console.log('Saving material data to Firestore:', materialData);
      await addDoc(collection(db, 'studyMaterials'), materialData);
      
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        subjectId: '',
        materialType: 'homework',
        file: null
      });
      fetchMaterials();
    } catch (error) {
      console.error('Error creating material:', error);
      alert('Error uploading material. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        // Find the material to get the publicId
        const material = materials.find(m => m.id === materialId);
        
        // Delete from Cloudinary if publicId exists
        if (material?.publicId) {
          console.log('Deleting file from Cloudinary:', material.publicId);
          await deleteFromCloudinary(material.publicId);
        }
        
        // Delete from Firestore
        await deleteDoc(doc(db, 'studyMaterials', materialId));
        fetchMaterials();
      } catch (error) {
        console.error('Error deleting material:', error);
        alert('Error deleting material. Please try again.');
      }
    }
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown';
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'homework': return 'primary';
      case 'notes': return 'info';
      case 'assignment': return 'warning';
      case 'exam': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Study Materials</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Upload Material
        </Button>
      </div>

      <Row>
        {materials.map(material => (
          <Col md={6} key={material.id} className="mb-3">
            <Card>
              <Card.Header className={`bg-${getTypeColor(material.materialType)} text-white`}>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">{material.title}</h6>
                  <Badge bg="light" text="dark">{material.materialType}</Badge>
                </div>
              </Card.Header>
              <Card.Body>
                <p className="card-text">{material.description}</p>
                <div className="mb-2">
                  <small className="text-muted">
                    Subject: {material.subjectName} | Uploaded: {formatDate(material.createdAt)}
                  </small>
                </div>
                {material.fileUrl && (
                  <div className="mb-2">
                    <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                      <i className="fas fa-download me-1"></i>
                      {material.fileName}
                    </a>
                  </div>
                )}
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={() => handleDelete(material.id)}
                >
                  Delete
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Upload Study Material</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Material Type</Form.Label>
                  <Form.Select
                    value={formData.materialType}
                    onChange={(e) => setFormData({...formData, materialType: e.target.value})}
                  >
                    <option value="homework">Homework</option>
                    <option value="notes">Notes</option>
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam Paper</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>File</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Uploading...
                </>
              ) : (
                'Upload Material'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default StudyMaterials;
