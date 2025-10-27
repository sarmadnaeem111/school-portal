import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Row, Col, Card, Badge } from 'react-bootstrap';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const ParentMessages = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [parents, setParents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    parentId: '',
    subject: '',
    message: '',
    priority: 'normal'
  });

  useEffect(() => {
    fetchMessages();
    fetchParents();
  }, []);

  const fetchMessages = async () => {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('teacherId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const messagesList = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesList);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParents = async () => {
    try {
      const parentsSnapshot = await getDocs(collection(db, 'users'));
      const parentsList = parentsSnapshot.docs
        .filter(doc => doc.data().role === 'parent')
        .map(doc => ({ id: doc.id, ...doc.data() }));
      setParents(parentsList);
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const messageData = {
        ...formData,
        teacherId: currentUser.uid,
        teacherName: currentUser.displayName,
        parentName: parents.find(p => p.id === formData.parentId)?.name,
        createdAt: new Date(),
        status: 'sent',
        read: false
      };

      await addDoc(collection(db, 'messages'), messageData);
      
      setShowModal(false);
      setFormData({
        parentId: '',
        subject: '',
        message: '',
        priority: 'normal'
      });
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
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
        <h2>Parent Messages</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Send Message
        </Button>
      </div>

      <Row>
        {messages.map(message => (
          <Col md={6} key={message.id} className="mb-3">
            <Card>
              <Card.Header className={`bg-${getPriorityColor(message.priority)} text-white`}>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">{message.subject}</h6>
                  <Badge bg="light" text="dark">{message.priority}</Badge>
                </div>
              </Card.Header>
              <Card.Body>
                <p className="card-text">{message.message}</p>
                <div className="mb-2">
                  <small className="text-muted">
                    To: {message.parentName} | Sent: {formatDate(message.createdAt)}
                  </small>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <Badge bg={message.read ? 'success' : 'warning'}>
                    {message.read ? 'Read' : 'Unread'}
                  </Badge>
                  <small className="text-muted">
                    Status: {message.status}
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Send Message to Parent</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Select Parent</Form.Label>
              <Form.Select
                value={formData.parentId}
                onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                required
              >
                <option value="">Select Parent</option>
                {parents.map(parent => (
                  <option key={parent.id} value={parent.id}>{parent.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
              />
            </Form.Group>
            
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Send Message
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ParentMessages;
