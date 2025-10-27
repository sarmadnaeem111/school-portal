import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Card, Row, Col, Badge } from 'react-bootstrap';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const Messages = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    teacherId: '',
    subject: '',
    message: '',
    priority: 'normal'
  });

  useEffect(() => {
    fetchMessages();
    fetchTeachers();
  }, []);

  const fetchMessages = async () => {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('parentId', '==', currentUser.uid),
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

  const fetchTeachers = async () => {
    try {
      const teachersSnapshot = await getDocs(collection(db, 'users'));
      const teachersList = teachersSnapshot.docs
        .filter(doc => doc.data().role === 'teacher')
        .map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(teachersList);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const messageData = {
        ...formData,
        parentId: currentUser.uid,
        parentName: currentUser.displayName,
        teacherName: teachers.find(t => t.id === formData.teacherId)?.name,
        createdAt: new Date(),
        status: 'sent',
        read: false
      };

      await addDoc(collection(db, 'messages'), messageData);
      
      setShowModal(false);
      setFormData({
        teacherId: '',
        subject: '',
        message: '',
        priority: 'normal'
      });
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        read: true
      });
      fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
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
        <h2>Messages</h2>
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
                    {message.parentId === currentUser.uid ? 'To' : 'From'}: {message.parentId === currentUser.uid ? message.teacherName : message.parentName} | {formatDate(message.createdAt)}
                  </small>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <Badge bg={message.read ? 'success' : 'warning'}>
                    {message.read ? 'Read' : 'Unread'}
                  </Badge>
                  {!message.read && message.parentId !== currentUser.uid && (
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => markAsRead(message.id)}
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Send Message to Teacher</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Select Teacher</Form.Label>
              <Form.Select
                value={formData.teacherId}
                onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
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

export default Messages;
