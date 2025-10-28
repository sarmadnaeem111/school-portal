import React, { useEffect, useState } from 'react';
import { Card, Table, Alert, Spinner } from 'react-bootstrap';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const StudentTimetable = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userDoc, setUserDoc] = useState(null);
  const [timetable, setTimetable] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      setLoading(true);
      setError('');
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setError('User profile not found.');
          setLoading(false);
          return;
        }
        const u = { id: userSnap.id, ...userSnap.data() };
        setUserDoc(u);
        if (!u.classId) {
          setError('No class assigned.');
          setLoading(false);
          return;
        }
        const ttRef = doc(db, 'timetables', u.classId);
        const ttSnap = await getDoc(ttRef);
        if (!ttSnap.exists()) {
          setError('Timetable not available yet.');
          setLoading(false);
          return;
        }
        setTimetable(ttSnap.data());
      } catch (e) {
        console.error(e);
        setError('Failed to load timetable.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  if (loading) return <div className="d-flex align-items-center"><Spinner animation="border" size="sm" className="me-2"/> Loading...</div>;
  if (error) return <Alert variant="warning" className="mb-0">{error}</Alert>;
  if (!timetable) return null;

  const days = timetable.days || [];
  const slots = timetable.slots || [];
  const schedule = timetable.schedule || {};

  return (
    <Card>
      <Card.Header>
        <strong>Class Timetable</strong>
        <div className="text-muted" style={{ fontSize: '0.9rem' }}>{timetable.className}</div>
      </Card.Header>
      <Card.Body>
        <Table bordered responsive>
          <thead>
            <tr>
              <th>Day / Slot</th>
              {slots.map(s => (
                <th key={s.id}>{s.start} - {s.end}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={day}>
                <td><strong>{day}</strong></td>
                {slots.map(s => {
                  const cell = schedule?.[day]?.[s.id];
                  return (
                    <td key={`${day}-${s.id}`}>{cell ? (cell.subjectName || '—') : '—'}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default StudentTimetable;


