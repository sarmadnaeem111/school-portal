import React, { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Form, Button, Table, InputGroup, Badge } from 'react-bootstrap';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const normalizePhoneForWhatsApp = (raw) => {
  if (!raw) return '';
  const digits = ('' + raw).replace(/[^0-9+]/g, '');
  if (digits.startsWith('+')) return digits.substring(1);
  return digits;
};

const buildWhatsAppUrl = (phone, text) => {
  const parsed = normalizePhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(text || '');
  return `https://wa.me/${parsed}?text=${encodedText}`;
};

const AdminWhatsApp = () => {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    const fetchParents = async () => {
      setLoading(true);
      setError('');
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'parent'));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setParents(list);
      } catch (e) {
        console.error('Failed fetching parents', e);
        setError('Failed to load parents');
      } finally {
        setLoading(false);
      }
    };
    fetchParents();
  }, []);

  const filteredParents = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return parents;
    return parents.filter(p =>
      (p.name || '').toLowerCase().includes(s) ||
      (p.email || '').toLowerCase().includes(s) ||
      (p.phone || '').toLowerCase().includes(s)
    );
  }, [parents, search]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredParents.map(p => p.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleSendSingle = (parent) => {
    const url = buildWhatsAppUrl(parent.phone, message);
    if (!parent.phone) {
      alert('Parent has no phone number saved.');
      return;
    }
    window.open(url, '_blank');
  };

  const handleSendSelected = () => {
    if (!message) {
      alert('Please type a message first.');
      return;
    }
    const selected = parents.filter(p => selectedIds.has(p.id));
    if (selected.length === 0) {
      alert('Please select at least one parent.');
      return;
    }
    selected.forEach(p => {
      if (p.phone) {
        const url = buildWhatsAppUrl(p.phone, message);
        window.open(url, '_blank');
      }
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>WhatsApp Messaging</h2>
        <Badge bg="secondary">Parents: {parents.length}</Badge>
      </div>

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Search Parents</Form.Label>
                <InputGroup>
                  <InputGroup.Text><i className="fas fa-search" /></InputGroup.Text>
                  <Form.Control
                    placeholder="Search by name, email, or phone"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Type your message to parents..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <div className="mt-3 d-flex gap-2">
            <Button variant="outline-secondary" onClick={selectAllFiltered}>Select All</Button>
            <Button variant="outline-secondary" onClick={clearSelection}>Clear Selection</Button>
            <Button variant="success" onClick={handleSendSelected} disabled={!message || selectedIds.size === 0}>
              <i className="fab fa-whatsapp me-2" /> Send to Selected ({selectedIds.size})
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {error && <div className="alert alert-danger mb-3">{error}</div>}
          {loading ? (
            <div>Loading...</div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParents.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </td>
                    <td>{p.name || 'N/A'}</td>
                    <td>{p.email || 'N/A'}</td>
                    <td>{p.phone || '—'}</td>
                    <td>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleSendSingle(p)}
                        disabled={!p.phone}
                      >
                        <i className="fab fa-whatsapp me-2" /> Send
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredParents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">No parents found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminWhatsApp;


