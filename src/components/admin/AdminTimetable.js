import React, { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Button, Table, Form, Badge, InputGroup } from 'react-bootstrap';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DEFAULT_SLOTS = [
  { id: '1', start: '08:00', end: '08:40' },
  { id: '2', start: '08:45', end: '09:25' },
  { id: '3', start: '09:30', end: '10:10' },
  { id: '4', start: '10:20', end: '11:00' },
  { id: '5', start: '11:05', end: '11:45' },
  { id: '6', start: '11:50', end: '12:30' },
];

const AdminTimetable = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [timetable, setTimetable] = useState({});
  const [status, setStatus] = useState('');
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [clsSnap, subSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, 'classes')),
          getDocs(collection(db, 'subjects')),
          getDocs(collection(db, 'users')),
        ]);
        setClasses(clsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setSubjects(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTeachers(usersSnap.docs.filter(d => d.data().role === 'teacher').map(d => ({ id: d.id, ...d.data() })));

        // Load timetable settings (days/slots)
        try {
          const settingsRef = doc(db, 'settings', 'timetable');
          const settingsSnap = await getDoc(settingsRef);
          if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            if (Array.isArray(data.days) && data.days.length > 0) setDays(data.days);
            if (Array.isArray(data.slots) && data.slots.length > 0) setSlots(data.slots);
          }
        } catch (e) {
          // Ignore and use defaults
        }
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const subjectsByClass = useMemo(() => {
    const map = {};
    subjects.forEach(s => {
      if (!map[s.classId]) map[s.classId] = [];
      map[s.classId].push(s);
    });
    return map;
  }, [subjects]);

  const teacherBusy = (scheduleMap, teacherId, day, slotId) => {
    for (const clsId of Object.keys(scheduleMap)) {
      const entry = scheduleMap[clsId]?.[day]?.[slotId];
      if (entry && entry.teacherId === teacherId) return true;
    }
    return false;
  };

  const generateForAll = async () => {
    setStatus('');
    const schedule = {}; // classId -> day -> slot -> {subjectId, teacherId}

    // Initialize structure
    classes.forEach(c => {
      schedule[c.id] = {};
      days.forEach(d => {
        schedule[c.id][d] = {};
      });
    });

    // Simple round-robin assignment: iterate days and slots, assign class subjects while avoiding teacher conflicts
    for (const cls of classes) {
      const classSubjects = [...(subjectsByClass[cls.id] || [])];
      if (classSubjects.length === 0) continue;
      let subjectIndex = 0;
      for (const day of days) {
        for (const slot of slots) {
          // Try up to N times to find a subject whose teacher is free
          let attempts = 0;
          let placed = false;
          while (attempts < classSubjects.length) {
            const subj = classSubjects[(subjectIndex + attempts) % classSubjects.length];
            const tId = subj.teacherId || cls.teacherId || null;
            if (!tId || !teacherBusy(schedule, tId, day, slot.id)) {
              schedule[cls.id][day][slot.id] = {
                subjectId: subj.id,
                subjectName: subj.name,
                teacherId: tId,
              };
              subjectIndex = (subjectIndex + 1) % classSubjects.length;
              placed = true;
              break;
            }
            attempts += 1;
          }
          if (!placed) {
            schedule[cls.id][day][slot.id] = {
              subjectId: null,
              subjectName: 'Free/Study',
              teacherId: null,
            };
          }
        }
      }
    }

    // Persist per-class timetable documents
    try {
      await Promise.all(classes.map(async (c) => {
        const ref = doc(db, 'timetables', c.id);
        await setDoc(ref, {
          classId: c.id,
          className: `${c.name} - ${c.section}`,
          schedule: schedule[c.id],
          days: days,
          slots: slots,
          updatedAt: new Date(),
        }, { merge: true });
      }));
      setStatus('Timetables generated and saved successfully.');
      if (selectedClassId) loadExisting(selectedClassId);
    } catch (e) {
      console.error('Failed to save timetables', e);
      setStatus('Failed to save timetables.');
    }
  };

  const loadExisting = async (classId) => {
    try {
      const ref = doc(db, 'timetables', classId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setTimetable(snap.data());
      } else {
        setTimetable({ schedule: {} });
      }
    } catch (e) {
      console.error('Failed to load timetable', e);
    }
  };

  useEffect(() => {
    if (selectedClassId) loadExisting(selectedClassId);
  }, [selectedClassId]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const schedule = timetable?.schedule || {};

  const addSlot = () => {
    const nextIndex = slots.length + 1;
    setSlots([...slots, { id: String(nextIndex), start: '13:00', end: '13:40' }]);
  };

  const removeSlot = (id) => {
    setSlots(slots.filter(s => s.id !== id).map((s, idx) => ({ ...s, id: String(idx + 1) })));
  };

  const updateSlot = (id, field, value) => {
    setSlots(slots.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const ref = doc(db, 'settings', 'timetable');
      await setDoc(ref, { days, slots }, { merge: true });
      setStatus('Timetable settings saved.');
    } catch (e) {
      console.error('Failed to save settings', e);
      setStatus('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Timetable Generator</h2>
        <div className="d-flex align-items-center gap-2">
          <Button variant="primary" onClick={generateForAll} disabled={loading}>
            Generate For All Classes
          </Button>
          <Badge bg="secondary">Classes: {classes.length}</Badge>
        </div>
      </div>

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label>View Class Timetable</Form.Label>
                <Form.Select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                  <option value="">Select class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8}>
              {status && <div className="alert alert-info mb-0">{status}</div>}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>
          <strong>Slot Settings</strong>
        </Card.Header>
        <Card.Body>
          <Table bordered size="sm" responsive className="mb-2">
            <thead>
              <tr>
                <th style={{ width: 80 }}>#</th>
                <th>Start</th>
                <th>End</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>
                    <InputGroup size="sm">
                      <Form.Control type="time" value={s.start} onChange={(e) => updateSlot(s.id, 'start', e.target.value)} />
                    </InputGroup>
                  </td>
                  <td>
                    <InputGroup size="sm">
                      <Form.Control type="time" value={s.end} onChange={(e) => updateSlot(s.id, 'end', e.target.value)} />
                    </InputGroup>
                  </td>
                  <td>
                    <Button variant="outline-danger" size="sm" onClick={() => removeSlot(s.id)} disabled={slots.length <= 1}>Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={addSlot}>Add Slot</Button>
            <Button variant="outline-primary" size="sm" onClick={saveSettings} disabled={savingSettings}>{savingSettings ? 'Saving...' : 'Save Settings'}</Button>
          </div>
        </Card.Body>
      </Card>

      {selectedClass && (
        <Card>
          <Card.Header>
            <strong>{selectedClass.name} - {selectedClass.section}</strong>
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
                        <td key={`${day}-${s.id}`}>
                          {cell ? (
                            <div>
                              <div>{cell.subjectName || '—'}</div>
                            </div>
                          ) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default AdminTimetable;


