import React, { useEffect, useState } from 'react';
import { Tabs, Tab, Card, Row, Col, Form, Button, Table, Alert, Badge } from 'react-bootstrap';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ModuleSidebar from '../common/ModuleSidebar';

const gradientHeader = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  border: 'none'
};

const AccountsDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]); // income/expense
  const [invoices, setInvoices] = useState([]);

  const [txnForm, setTxnForm] = useState({ type: 'income', category: 'fee', amount: '', date: '', description: '' });
  const [invoiceForm, setInvoiceForm] = useState({ studentId: '', amount: '', dueDate: '', status: 'unpaid' });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [stuSnap, txnSnap, invSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role','==','student'))),
        getDocs(collection(db, 'accountsTransactions')),
        getDocs(collection(db, 'accountsInvoices'))
      ]);
      setStudents(stuSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTransactions(txnSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setInvoices(invSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setMessage('Error loading accounts data');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async () => {
    if (!txnForm.amount) { setMessage('Please enter amount'); setMessageType('warning'); return; }
    try {
      await addDoc(collection(db, 'accountsTransactions'), {
        ...txnForm,
        amount: Number(txnForm.amount) || 0,
        createdAt: serverTimestamp()
      });
      setTxnForm({ type: 'income', category: 'fee', amount: '', date: '', description: '' });
      setMessage('Transaction added');
      setMessageType('success');
      loadAll();
    } catch (e) {
      setMessage('Failed to add transaction');
      setMessageType('danger');
    }
  };

  const deleteTransaction = async (id) => {
    try { await deleteDoc(doc(db, 'accountsTransactions', id)); setTransactions(prev => prev.filter(t => t.id !== id)); }
    catch(e){ setMessage('Failed to delete transaction'); setMessageType('danger'); }
  };

  const addInvoice = async () => {
    if (!invoiceForm.studentId || !invoiceForm.amount) { setMessage('Please select student and amount'); setMessageType('warning'); return; }
    try {
      await addDoc(collection(db, 'accountsInvoices'), {
        ...invoiceForm,
        amount: Number(invoiceForm.amount) || 0,
        createdAt: serverTimestamp()
      });
      setInvoiceForm({ studentId: '', amount: '', dueDate: '', status: 'unpaid' });
      setMessage('Invoice created');
      setMessageType('success');
      loadAll();
    } catch (e) {
      setMessage('Failed to create invoice');
      setMessageType('danger');
    }
  };

  const markInvoicePaid = async (id) => {
    try {
      await updateDoc(doc(db, 'accountsInvoices', id), { status: 'paid', paidAt: serverTimestamp() });
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid' } : i));
    } catch (e) { setMessage('Failed to update invoice'); setMessageType('danger'); }
  };

  const deleteInvoice = async (id) => {
    try { await deleteDoc(doc(db, 'accountsInvoices', id)); setInvoices(prev => prev.filter(i => i.id !== id)); }
    catch(e){ setMessage('Failed to delete invoice'); setMessageType('danger'); }
  };

  const handleLogout = async () => { try { await logout(); navigate('/login'); } catch(e) {} };

  const getStudentName = (id) => (students.find(s => s.id === id)?.name) || 'N/A';

  const totals = transactions.reduce((acc, t) => {
    if ((t.type || 'income') === 'income') acc.income += Number(t.amount) || 0; else acc.expense += Number(t.amount) || 0; return acc;
  }, { income: 0, expense: 0 });

  return (
    <div className="d-flex min-vh-100">
      <div className="sidebar-overlay" onClick={() => { const s=document.querySelector('.sidebar-enhanced'); const o=document.querySelector('.sidebar-overlay'); if (s&&o){s.classList.remove('show'); o.classList.remove('show');}}}></div>
      <ModuleSidebar
        title="Accounts"
        onLogout={handleLogout}
        items={[
          { key: 'overview', label: 'Overview', icon: 'fas fa-tachometer-alt', onClick: () => setActiveTab('overview') },
          { key: 'transactions', label: 'Transactions', icon: 'fas fa-receipt', onClick: () => setActiveTab('transactions') },
          { key: 'invoices', label: 'Invoices', icon: 'fas fa-file-invoice-dollar', onClick: () => setActiveTab('invoices') },
          { key: 'reports', label: 'Reports', icon: 'fas fa-chart-line', onClick: () => setActiveTab('reports') }
        ]}
      />
      <div className="flex-grow-1 d-flex flex-column container-enhanced">
        <div className="mb-4">
          <h2 className="mb-1" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            <i className="fas fa-calculator me-3"></i>
            Accounts Management
          </h2>
          <p className="text-muted mb-0">Manage transactions and invoices</p>
        </div>

        {message && (
          <Alert variant={messageType} className={`alert-enhanced alert-${messageType}`} onClose={() => setMessage('')} dismissible>
            {message}
          </Alert>
        )}

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')} className="mb-4 nav-tabs-enhanced">
          <Tab eventKey="overview" title="Overview">
            <Row>
              <Col md={4}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Total Income</strong></Card.Header>
                  <Card.Body>
                    <h3 className="mb-0">PKR {totals.income.toLocaleString()}</h3>
                    <small className="text-muted">From transactions</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Total Expense</strong></Card.Header>
                  <Card.Body>
                    <h3 className="mb-0">PKR {totals.expense.toLocaleString()}</h3>
                    <small className="text-muted">From transactions</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Unpaid Invoices</strong></Card.Header>
                  <Card.Body>
                    <h3 className="mb-0">{invoices.filter(i => i.status !== 'paid').length}</h3>
                    <small className="text-muted">Awaiting payment</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="transactions" title="Transactions">
            <Row>
              <Col md={5}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Add Transaction</strong></Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Type</Form.Label>
                        <Form.Select value={txnForm.type} onChange={(e)=>setTxnForm({...txnForm, type: e.target.value})}>
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Control value={txnForm.category} onChange={(e)=>setTxnForm({...txnForm, category: e.target.value})} placeholder="e.g., fee, utility"/>
                      </Form.Group>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Amount (PKR)</Form.Label>
                            <Form.Control type="number" value={txnForm.amount} onChange={(e)=>setTxnForm({...txnForm, amount: e.target.value})}/>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Date</Form.Label>
                            <Form.Control type="date" value={txnForm.date} onChange={(e)=>setTxnForm({...txnForm, date: e.target.value})}/>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control value={txnForm.description} onChange={(e)=>setTxnForm({...txnForm, description: e.target.value})} placeholder="Optional description"/>
                      </Form.Group>
                      <Button variant="success btn-enhanced" onClick={addTransaction} disabled={loading}>
                        <i className="fas fa-plus me-2"></i>
                        Add Transaction
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={7}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Transactions List</strong></Card.Header>
                  <Card.Body>
                    <Table responsive striped bordered hover size="sm" className="table-enhanced">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Category</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(t => (
                          <tr key={t.id}>
                            <td><Badge bg={t.type === 'income' ? 'success' : 'danger'}>{t.type}</Badge></td>
                            <td>{t.category}</td>
                            <td>PKR {(Number(t.amount)||0).toLocaleString()}</td>
                            <td>{t.date || 'N/A'}</td>
                            <td>{t.description || ''}</td>
                            <td>
                              <Button size="sm" variant="outline-danger" onClick={()=>deleteTransaction(t.id)}>
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

          <Tab eventKey="invoices" title="Invoices">
            <Row>
              <Col md={5}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Create Invoice</strong></Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Student</Form.Label>
                        <Form.Select value={invoiceForm.studentId} onChange={(e)=>setInvoiceForm({...invoiceForm, studentId: e.target.value})}>
                          <option value="">Select a student</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name} {s.rollNumber ? `(${s.rollNumber})` : ''}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Amount (PKR)</Form.Label>
                            <Form.Control type="number" value={invoiceForm.amount} onChange={(e)=>setInvoiceForm({...invoiceForm, amount: e.target.value})}/>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Due Date</Form.Label>
                            <Form.Control type="date" value={invoiceForm.dueDate} onChange={(e)=>setInvoiceForm({...invoiceForm, dueDate: e.target.value})}/>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select value={invoiceForm.status} onChange={(e)=>setInvoiceForm({...invoiceForm, status: e.target.value})}>
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                        </Form.Select>
                      </Form.Group>
                      <Button variant="success btn-enhanced" onClick={addInvoice} disabled={loading}>
                        <i className="fas fa-plus me-2"></i>
                        Create Invoice
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={7}>
                <Card className="card-enhanced mb-3">
                  <Card.Header style={gradientHeader}><strong>Invoices List</strong></Card.Header>
                  <Card.Body>
                    <Table responsive striped bordered hover size="sm" className="table-enhanced">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Amount</th>
                          <th>Due Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv.id}>
                            <td>{getStudentName(inv.studentId)}</td>
                            <td>PKR {(Number(inv.amount)||0).toLocaleString()}</td>
                            <td>{inv.dueDate || 'N/A'}</td>
                            <td><Badge bg={inv.status === 'paid' ? 'success' : 'warning'}>{inv.status || 'unpaid'}</Badge></td>
                            <td className="d-flex gap-2">
                              {inv.status !== 'paid' && (
                                <Button size="sm" variant="outline-success" onClick={()=>markInvoicePaid(inv.id)}>
                                  <i className="fas fa-check"></i>
                                </Button>
                              )}
                              <Button size="sm" variant="outline-danger" onClick={()=>deleteInvoice(inv.id)}>
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

          <Tab eventKey="reports" title="Reports">
            <Card className="card-enhanced">
              <Card.Header style={gradientHeader}><strong>Reports</strong></Card.Header>
              <Card.Body>
                <p className="text-muted mb-0">Summary and export features (coming soon).</p>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountsDashboard;
