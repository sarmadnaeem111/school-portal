import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const announcementsQuery = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc')
      );
      const announcementsSnapshot = await getDocs(announcementsQuery);
      const announcementsList = announcementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter announcements for students
      const filteredAnnouncements = announcementsList.filter(announcement => 
        announcement.targetAudience === 'all' || 
        announcement.targetAudience === 'students'
      );
      
      setAnnouncements(filteredAnnouncements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
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
      <h2 className="mb-4">School Announcements</h2>
      
      <Row>
        {announcements.length > 0 ? (
          announcements.map(announcement => (
            <Col md={6} key={announcement.id} className="mb-3">
              <Card>
                <Card.Header className={`bg-${getPriorityColor(announcement.priority)} text-white`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">{announcement.title}</h6>
                    <div className="d-flex align-items-center">
                      <Badge bg="light" text="dark" className="me-2">{announcement.priority}</Badge>
                      <small>{formatDate(announcement.createdAt)}</small>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <p className="card-text">{announcement.content}</p>
                  <div className="mb-2">
                    <small className="text-muted">
                      Target: {announcement.targetAudience} | Created by: {announcement.createdBy}
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
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col md={12}>
            <Card>
              <Card.Body className="text-center">
                <h5>No announcements available</h5>
                <p className="text-muted">Check back later for school updates and announcements.</p>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default Announcements;
