import React, { useEffect, useState, useMemo } from 'react';
import { Button, Row, Col, Card, Form, Alert } from 'react-bootstrap';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import QRCode from 'react-qr-code';

const TeacherQRCards = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        setTeachers(list);
        const profileRef = doc(db, 'schoolProfile', 'main');
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          if (data.schoolName) setSchoolName(data.schoolName);
        }
      } catch (e) {
        console.error(e);
        setMessage('Failed to load teachers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return teachers;
    const f = filter.toLowerCase();
    return teachers.filter(t => String(t.name || '').toLowerCase().includes(f) || String(t.email || '').toLowerCase().includes(f));
  }, [teachers, filter]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3 no-print">
        <h2 className="mb-0">Teacher QR Cards</h2>
        <div className="d-flex gap-2">
          <Form.Control
            placeholder="Search by name or email"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ maxWidth: 260 }}
          />
          <Button variant="primary" onClick={handlePrint}>
            <i className="fas fa-print me-2"></i>
            Print
          </Button>
        </div>
      </div>
      {message && (
        <Alert variant="danger" onClose={() => setMessage('')} dismissible className="no-print">{message}</Alert>
      )}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-3">
          {filtered.map(t => {
            const qrPayload = JSON.stringify({ teacherId: t.id });
            return (
              <Col key={t.id}>
                <Card className="h-100 qr-card">
                  <Card.Body className="d-flex flex-column align-items-center text-center">
                    <div className="w-100 d-flex justify-content-between small text-muted">
                      <span>{schoolName || 'School'}</span>
                      <span>Teacher</span>
                    </div>
                    <div style={{ background: 'white', padding: 10, borderRadius: 8, marginTop: 8 }}>
                      <QRCode value={qrPayload} size={140} level="M" />
                    </div>
                    <div className="mt-3 w-100">
                      <div style={{ fontWeight: 700 }}>{t.name || 'Unnamed'}</div>
                      <div className="text-muted" style={{ fontSize: 13 }}>{t.email}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>ID: {t.id}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .qr-card { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default TeacherQRCards;


