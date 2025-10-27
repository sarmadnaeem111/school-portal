import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button } from 'react-bootstrap';
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
      
      // Filter announcements for teachers
      const filteredAnnouncements = announcementsList.filter(announcement => 
        announcement.targetAudience === 'all' || 
        announcement.targetAudience === 'teachers' ||
        announcement.targetAudience === 'staff'
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
    try {
      if (!timestamp) {
        return 'Date not available';
      }
      
      // Handle Firestore timestamp objects
      if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      
      // Handle regular Date objects or date strings
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error, 'Timestamp:', timestamp);
      return 'Date Error';
    }
  };

  const handleDownload = async (fileUrl, fileName) => {
    try {
      console.log('Downloading announcement file:', fileName, 'from URL:', fileUrl);
      
      // Validate URL
      if (!fileUrl) {
        throw new Error('No file URL provided');
      }
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'announcement-file';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Download initiated successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback: open in new tab if download fails
      alert(`Download failed: ${error.message}. Opening file in new tab...`);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>School Announcements</h2>
        <Button variant="outline-primary" onClick={fetchAnnouncements}>
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </Button>
      </div>
      
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
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleDownload(announcement.fileUrl, announcement.fileName)}
                      >
                        <i className="fas fa-download me-1"></i>
                        Download {announcement.fileName || 'File'}
                      </Button>
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
                <Button variant="outline-primary" onClick={fetchAnnouncements}>
                  <i className="fas fa-sync-alt me-2"></i>
                  Refresh
                </Button>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default Announcements;
