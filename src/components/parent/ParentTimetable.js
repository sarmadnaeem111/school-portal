import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Alert, Spinner, Form } from 'react-bootstrap';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const ParentTimetable = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [timetable, setTimetable] = useState(null);
  const [teachersMap, setTeachersMap] = useState({});

  useEffect(() => {
    const loadChildren = async () => {
      if (!currentUser) return;
      setLoading(true);
      setError('');
      try {
        // Load teachers map in parallel
        const teachersPromise = (async () => {
          try {
            const snap = await getDocs(collection(db, 'users'));
            const map = {};
            snap.docs.forEach(d => {
              const data = d.data();
              if (data.role === 'teacher') map[d.id] = data.name || '';
            });
            setTeachersMap(map);
          } catch (_) {
            setTeachersMap({});
          }
        })();
        const qy = query(collection(db, 'users'), where('role', '==', 'student'), where('parentId', '==', currentUser.uid));
        const snap = await getDocs(qy);
        const kids = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setChildren(kids);
        if (kids.length > 0) setSelectedChildId(kids[0].id);
        await teachersPromise;
      } catch (e) {
        console.error(e);
        setError('Failed to load children.');
      } finally {
        setLoading(false);
      }
    };
    loadChildren();
  }, [currentUser]);

  useEffect(() => {
    const loadTimetable = async () => {
      if (!selectedChildId) return;
      setLoading(true);
      setError('');
      try {
        const stuRef = doc(db, 'users', selectedChildId);
        const stuSnap = await getDoc(stuRef);
        if (!stuSnap.exists()) {
          setError('Selected child not found.');
          setLoading(false);
          return;
        }
        const student = { id: stuSnap.id, ...stuSnap.data() };
        if (!student.classId) {
          setError('Selected child has no class assigned.');
          setLoading(false);
          return;
        }
        const ttRef = doc(db, 'timetables', student.classId);
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
    loadTimetable();
  }, [selectedChildId]);

  if (loading) return <div className="d-flex align-items-center"><Spinner animation="border" size="sm" className="me-2"/> Loading...</div>;
  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Class Timetable</strong>
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>{timetable?.className || ''}</div>
          </div>
          <div>
            {children.length > 1 && (
              <Form.Select size="sm" value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}>
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Form.Select>
            )}
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="warning">{error}</Alert>}
        {!error && timetable && (
          <Table bordered responsive>
            <thead>
              <tr>
                <th>Day / Slot</th>
                {(timetable.slots || []).map(s => (
                  <th key={s.id}>{s.start} - {s.end}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(timetable.days || []).map(day => (
                <tr key={day}>
                  <td><strong>{day}</strong></td>
                  {(timetable.slots || []).map(s => {
                    const cell = timetable.schedule?.[day]?.[s.id];
                    if (!cell) return (<td key={`${day}-${s.id}`}>—</td>);
                    const tName = cell.teacherName || (cell.teacherId ? (teachersMap[cell.teacherId] || '') : '');
                    return (
                      <td key={`${day}-${s.id}`}>
                        <div>{cell.subjectName || '—'}</div>
                        {tName ? <div className="text-muted" style={{ fontSize: '0.9rem' }}>{tName}</div> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {!error && !timetable && (
          <Alert variant="info" className="mb-0">No timetable available.</Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default ParentTimetable;


