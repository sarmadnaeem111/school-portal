import React, { useEffect, useState } from 'react';
import { Tabs, Tab, Card, Row, Col, Form, Button, Table, Alert, Badge } from 'react-bootstrap';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ModuleSidebar from '../common/ModuleSidebar';

const gradientHeader = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  border: 'none'
};

const LibraryDashboard = () => {
  const { logout, userRole } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [students, setStudents] = useState([]);

  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', copies: 1, status: 'available' });
  const [issueForm, setIssueForm] = useState({ studentId: '', bookId: '', status: 'issued' });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [bookSnap, issueSnap, studentSnap] = await Promise.all([
        getDocs(collection(db, 'libraryBooks')),
        getDocs(collection(db, 'libraryIssues')),
        getDocs(query(collection(db, 'users'), where('role','==','student')))
      ]);
      setBooks(bookSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setIssues(issueSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStudents(studentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setMessage('Error loading library data');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const addBook = async () => {
    if (!bookForm.title) return;
    try {
      await addDoc(collection(db, 'libraryBooks'), {
        ...bookForm,
        copies: Number(bookForm.copies) || 0,
        createdAt: serverTimestamp()
      });
      setBookForm({ title: '', author: '', isbn: '', copies: 1, status: 'available' });
      setMessage('Book added');
      setMessageType('success');
      loadAll();
    } catch (e) {
      setMessage('Failed to add book');
      setMessageType('danger');
    }
  };

  const deleteBook = async (id) => {
    try { await deleteDoc(doc(db, 'libraryBooks', id)); setBooks(prev => prev.filter(b => b.id !== id)); }
    catch(e) { setMessage('Failed to delete book'); setMessageType('danger'); }
  };

  const addIssue = async () => {
    if (!issueForm.studentId || !issueForm.bookId) {
      setMessage('Please select student and book');
      setMessageType('warning');
      return;
    }
    try {
      await addDoc(collection(db, 'libraryIssues'), {
        ...issueForm,
        issuedAt: serverTimestamp()
      });
      setIssueForm({ studentId: '', bookId: '', status: 'issued' });
      setMessage('Book issued');
      setMessageType('success');
      loadAll();
    } catch (e) {
      setMessage('Failed to issue');
      setMessageType('danger');
    }
  };

  const returnIssue = async (id) => {
    try {
      await updateDoc(doc(db, 'libraryIssues', id), { status: 'returned', returnedAt: serverTimestamp() });
      setIssues(prev => prev.map(i => i.id === id ? { ...i, status: 'returned' } : i));
    } catch (e) {
      setMessage('Failed to update');
      setMessageType('danger');
    }
  };

  const handleLogout = async () => { try { await logout(); navigate('/login'); } catch(e) {} };

  const getName = (id) => (students.find(s => s.id === id)?.name) || 'N/A';
  const getBookTitle = (id) => (books.find(b => b.id === id)?.title) || 'N/A';

  const isAdminView = userRole === 'admin';

  return (
    <div className="d-flex min-vh-100">
      {!isAdminView && (
        <div className="sidebar-overlay" onClick={() => { const s=document.querySelector('.sidebar-enhanced'); const o=document.querySelector('.sidebar-overlay'); if (s&&o){s.classList.remove('show'); o.classList.remove('show');}}}></div>
      )}
      {!isAdminView && (
      <ModuleSidebar
        title="Library"
        onLogout={handleLogout}
        items={[
          { key: 'overview', label: 'Overview', icon: 'fas fa-tachometer-alt', onClick: () => setActiveTab('overview') },
          { key: 'books', label: 'Books', icon: 'fas fa-book', onClick: () => setActiveTab('books') },
          { key: 'issues', label: 'Issues', icon: 'fas fa-exchange-alt', onClick: () => setActiveTab('issues') }
        ]}
      />)}
      <div className="flex-grow-1 d-flex flex-column container-enhanced">
        <div className="mb-4">
        <h2 className="mb-1" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          <i className="fas fa-book me-3"></i>
          Library Management
        </h2>
        <p className="text-muted mb-0">Manage books and issues</p>
        </div>

      {message && (
        <Alert variant={messageType} className={`alert-enhanced alert-${messageType}`} onClose={() => setMessage('')} dismissible>
          {message}
        </Alert>
      )}

      <Row>
        <Col md={12}>
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')} className="mb-4 nav-tabs-enhanced">
        <Tab eventKey="overview" title="Overview">
          <Row>
            <Col md={4}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Books</strong></Card.Header>
                <Card.Body>
                  <h3 className="mb-0">{books.length}</h3>
                  <small className="text-muted">Total books</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Active Issues</strong></Card.Header>
                <Card.Body>
                  <h3 className="mb-0">{issues.filter(i => i.status !== 'returned').length}</h3>
                  <small className="text-muted">Currently issued</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="books" title="Books">
          <Row>
            <Col md={5}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Add Book</strong></Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Title</Form.Label>
                      <Form.Control value={bookForm.title} onChange={(e)=>setBookForm({...bookForm, title: e.target.value})} placeholder="Book title"/>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Author</Form.Label>
                      <Form.Control value={bookForm.author} onChange={(e)=>setBookForm({...bookForm, author: e.target.value})} placeholder="Author name"/>
                    </Form.Group>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>ISBN</Form.Label>
                          <Form.Control value={bookForm.isbn} onChange={(e)=>setBookForm({...bookForm, isbn: e.target.value})} placeholder="ISBN"/>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Copies</Form.Label>
                          <Form.Control type="number" value={bookForm.copies} onChange={(e)=>setBookForm({...bookForm, copies: e.target.value})}/>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select value={bookForm.status} onChange={(e)=>setBookForm({...bookForm, status: e.target.value})}>
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                      </Form.Select>
                    </Form.Group>
                    <Button variant="success btn-enhanced" onClick={addBook} disabled={loading}>
                      <i className="fas fa-plus me-2"></i>
                      Add Book
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            <Col md={7}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Books List</strong></Card.Header>
                <Card.Body>
                  <Table responsive striped bordered hover size="sm" className="table-enhanced">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>ISBN</th>
                        <th>Copies</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map(b => (
                        <tr key={b.id}>
                          <td>{b.title}</td>
                          <td>{b.author}</td>
                          <td>{b.isbn}</td>
                          <td>{b.copies}</td>
                          <td><Badge bg={b.status === 'available' ? 'success' : 'secondary'}>{b.status}</Badge></td>
                          <td>
                            <Button size="sm" variant="outline-danger" onClick={()=>deleteBook(b.id)}>
                              <i className="fas fa-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="issues" title="Issues">
          <Row>
            <Col md={5}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Issue Book</strong></Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Student</Form.Label>
                      <Form.Select value={issueForm.studentId} onChange={(e)=>setIssueForm({...issueForm, studentId: e.target.value})}>
                        <option value="">Select a student</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.name} {s.rollNumber ? `(${s.rollNumber})` : ''}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Book</Form.Label>
                      <Form.Select value={issueForm.bookId} onChange={(e)=>setIssueForm({...issueForm, bookId: e.target.value})}>
                        <option value="">Select a book</option>
                        {books.filter(b => b.status === 'available').map(b => (
                          <option key={b.id} value={b.id}>{b.title} - {b.author}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select value={issueForm.status} onChange={(e)=>setIssueForm({...issueForm, status: e.target.value})}>
                        <option value="issued">Issued</option>
                        <option value="returned">Returned</option>
                      </Form.Select>
                    </Form.Group>
                    <Button variant="success btn-enhanced" onClick={addIssue} disabled={loading}>
                      <i className="fas fa-plus me-2"></i>
                      Issue Book
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            <Col md={7}>
              <Card className="card-enhanced mb-3">
                <Card.Header style={gradientHeader}><strong>Issues List</strong></Card.Header>
                <Card.Body>
                  <Table responsive striped bordered hover size="sm" className="table-enhanced">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Book</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map(i => (
                        <tr key={i.id}>
                          <td>{getName(i.studentId)}</td>
                          <td>{getBookTitle(i.bookId)}</td>
                          <td><Badge bg={i.status === 'issued' ? 'warning' : 'success'}>{i.status}</Badge></td>
                          <td>
                            {i.status !== 'returned' && (
                              <Button size="sm" variant="outline-success" onClick={()=>returnIssue(i.id)}>
                                <i className="fas fa-check"></i>
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
        </Col>
      </Row>
      </div>
    </div>
  );
};

export default LibraryDashboard;


