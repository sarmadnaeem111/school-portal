import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Card, Row, Col } from 'react-bootstrap';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    targetAudience: 'all',
    file: null
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const announcementsSnapshot = await getDocs(collection(db, 'announcements'));
      const announcementsList = announcementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(announcementsList.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let fileUrl = null;
      
      if (formData.file) {
        const fileRef = ref(storage, `announcements/${Date.now()}_${formData.file.name}`);
        await uploadBytes(fileRef, formData.file);
        fileUrl = await getDownloadURL(fileRef);
      }

      const announcementData = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        targetAudience: formData.targetAudience,
        fileUrl: fileUrl,
        fileName: formData.file ? formData.file.name : null,
        createdAt: new Date(),
        createdBy: 'admin' // You can get this from auth context
      };

      await addDoc(collection(db, 'announcements'), announcementData);
      
      setShowModal(false);
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
        targetAudience: 'all',
        file: null
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const handleDelete = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteDoc(doc(db, 'announcements', announcementId));
        fetchAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'normal': return 'info';
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
        <h2>School Announcements</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Create Announcement
        </Button>
      </div>

      <Row>
        {announcements.map(announcement => (
          <Col md={6} key={announcement.id} className="mb-3">
            <Card>
              <Card.Header className={`bg-${getPriorityColor(announcement.priority)} text-white`}>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">{announcement.title}</h6>
                  <small>{formatDate(announcement.createdAt)}</small>
                </div>
              </Card.Header>
              <Card.Body>
                <p className="card-text">{announcement.content}</p>
                <div className="mb-2">
                  <small className="text-muted">
                    Target: {announcement.targetAudience} | Priority: {announcement.priority}
                  </small>
                </div>
                {announcement.fileUrl && (
                  <div className="mb-2">
                    <a href={announcement.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                      <i className="fas fa-download me-1"></i>
                      {announcement.fileName}
                    </a>
                  </div>
                )}
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={() => handleDelete(announcement.id)}
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
          <Modal.Title>Create New Announcement</Modal.Title>
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
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Target Audience</Form.Label>
                  <Form.Select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                  >
                    <option value="all">All Users</option>
                    <option value="students">Students Only</option>
                    <option value="parents">Parents Only</option>
                    <option value="teachers">Teachers Only</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Attachment (Optional)</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Announcement
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Announcements;
