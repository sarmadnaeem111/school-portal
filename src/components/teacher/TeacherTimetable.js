import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Alert, Spinner, Form } from 'react-bootstrap';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';

const TeacherTimetable = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [timetable, setTimetable] = useState(null);
  const [teachersMap, setTeachersMap] = useState({});

  useEffect(() => {
    const loadClasses = async () => {
      if (!currentUser) return;
      setLoading(true);
      setError('');
      try {
        // Preload teachers map so we can display names if not embedded
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
        // classes where teacher is class teacher
        const classQ = query(collection(db, 'classes'), where('teacherId', '==', currentUser.uid));
        // subjects where teacher teaches -> gather classIds
        const subjQ = query(collection(db, 'subjects'), where('teacherId', '==', currentUser.uid));
        const [classSnap, subjSnap] = await Promise.all([getDocs(classQ), getDocs(subjQ)]);
        const classList = classSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const subjectClassIds = Array.from(new Set(subjSnap.docs.map(d => d.data().classId).filter(Boolean)));
        // fetch classes for those classIds not already included
        const missing = subjectClassIds.filter(id => !classList.some(c => c.id === id));
        if (missing.length > 0) {
          const extra = await Promise.all(missing.map(async id => {
            const ref = doc(db, 'classes', id);
            const s = await getDoc(ref);
            return s.exists() ? { id: s.id, ...s.data() } : null;
          }));
          extra.filter(Boolean).forEach(e => classList.push(e));
        }
        setClasses(classList);
        if (classList.length > 0) setSelectedClassId(classList[0].id);
        await teachersPromise;
      } catch (e) {
        console.error(e);
        setError('Failed to load classes.');
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, [currentUser]);

  useEffect(() => {
    const loadTT = async () => {
      if (!selectedClassId) return;
      setLoading(true);
      setError('');
      try {
        const ttRef = doc(db, 'timetables', selectedClassId);
        const ttSnap = await getDoc(ttRef);
        if (!ttSnap.exists()) {
          setError('Timetable not available for this class.');
          setTimetable(null);
        } else {
          setTimetable(ttSnap.data());
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load timetable.');
      } finally {
        setLoading(false);
      }
    };
    loadTT();
  }, [selectedClassId]);

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Class Timetable</strong>
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>{timetable?.className || ''}</div>
          </div>
          <div>
            {classes.length > 0 && (
              <Form.Select size="sm" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                ))}
              </Form.Select>
            )}
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {loading && <div className="d-flex align-items-center"><Spinner animation="border" size="sm" className="me-2"/> Loading...</div>}
        {!loading && error && <Alert variant="warning">{error}</Alert>}
        {!loading && !error && timetable && (
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
      </Card.Body>
    </Card>
  );
};

export default TeacherTimetable;


