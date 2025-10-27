import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { validatePassword, isValidEmail } from '../utils/validation';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [classId, setClassId] = useState('');
  const [parentId, setParentId] = useState('');
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [schoolName, setSchoolName] = useState('School Portal');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const { signin, signup, userRole, currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Fetch available classes
  const fetchClasses = async () => {
    try {
      const classesSnapshot = await getDocs(collection(db, 'classes'));
      const classesList = classesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setClasses(classesList);
    } catch (error) {
      console.error('Error fetching classes');
    }
  };

  // Fetch school profile
  const fetchSchoolProfile = async () => {
    try {
      const profileRef = doc(db, 'schoolProfile', 'main');
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        if (data.schoolName) {
          setSchoolName(data.schoolName);
        }
      }
    } catch (error) {
      console.error('Error fetching school profile:', error);
    }
  };

  // Load classes and school profile when component mounts
  useEffect(() => {
    fetchClasses();
    fetchSchoolProfile();
  }, []);

  // Handle navigation when user role becomes available
  useEffect(() => {
    if (currentUser && userRole && !authLoading && isRedirecting) {
      switch (userRole) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        case 'parent':
          navigate('/parent/dashboard');
          break;
        case 'student':
          navigate('/student/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
      setIsRedirecting(false);
    }
  }, [currentUser, userRole, authLoading, isRedirecting, navigate]);

  // Handle case where user is logged in but no role is found
  useEffect(() => {
    if (currentUser && !userRole && !authLoading && isRedirecting) {
      // Add a delay to allow role fetching to complete
      const checkRoleTimeout = setTimeout(() => {
        if (currentUser && !userRole && !authLoading && isRedirecting) {
          setError('Your account is missing role information. Please try logging in again or contact the administrator.');
          setIsRedirecting(false);
          setLoading(false);
        }
      }, 3000); // Wait 3 seconds for role to be fetched

      return () => clearTimeout(checkRoleTimeout);
    }
  }, [currentUser, userRole, authLoading, isRedirecting]);

  // Timeout mechanism to prevent infinite waiting
  useEffect(() => {
    if (isRedirecting) {
      const timeout = setTimeout(() => {
        if (isRedirecting) {
          setError('Authentication is taking longer than expected. Please check your internet connection and try again.');
          setIsRedirecting(false);
          setLoading(false);
        }
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isRedirecting]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await signin(email, password);
      
      // Set redirecting flag and wait for userRole to be available
      setIsRedirecting(true);
    } catch (error) {
      setError(error.message || 'Failed to sign in. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      setPasswordErrors([]);
      
      // Validate email
      if (!isValidEmail(email)) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }
      
      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setPasswordErrors(passwordValidation.errors);
        setError('Please fix password errors before submitting.');
        setLoading(false);
        return;
      }
      
      // Validate student-specific fields
      if (role === 'student') {
        if (!classId) {
          setError('Please select a class for the student.');
          setLoading(false);
          return;
        }
        if (!rollNumber) {
          setError('Please enter a roll number for the student.');
          setLoading(false);
          return;
        }
      }
      
      const userData = {
        name,
        role,
        gender,
        phone,
        address,
        ...(role === 'student' && { rollNumber, classId, parentId })
      };
      
      await signup(email, password, userData);
      
      // Set redirecting flag and wait for userRole to be available
      setIsRedirecting(true);
    } catch (error) {
      setError(error.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  // Show loading spinner when redirecting
  if (isRedirecting) {
    return (
      <div className="welcome-container">
        <Container className="px-3 px-md-5" style={{ position: 'relative', zIndex: 1 }}>
          <Row className="justify-content-center align-items-center" style={{ minHeight: '90vh' }}>
            <Col md={6} className="text-center">
              <Card className="welcome-card">
                <Card.Body className="p-5">
                  <div className="spinner-border" style={{ color: '#667eea', width: '4rem', height: '4rem' }} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h4 className="mt-4" style={{ color: '#667eea' }}>Verifying your account...</h4>
                  <p className="text-muted">Please wait while we fetch your role information</p>
                  <div className="mt-4">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setIsRedirecting(false);
                        setLoading(false);
                      }}
                    >
                      <i className="fas fa-times me-2"></i>
                      Cancel
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="welcome-container">
      <Container className="px-3 px-md-5" style={{ position: 'relative', zIndex: 1 }}>
        <Row className="justify-content-center align-items-center" style={{ minHeight: '90vh' }}>
          <Col xs={12} sm={10} md={8} lg={6}>
            <Card className="welcome-card">
              <Card.Header className="welcome-header text-white text-center">
                <h2 className="mb-2">{schoolName}</h2>
                <p className="mb-0" style={{ fontSize: '1rem', opacity: 0.95 }}>
                  Secure Login & Registration
                </p>
              </Card.Header>
              <Card.Body className="p-4 p-md-5">
                {error && (
                  <Alert variant="danger" style={{ borderRadius: '10px', border: 'none' }}>
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {error}
                    {error.includes('missing role information') && (
                      <div className="mt-2">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => {
                            setError('');
                            setIsRedirecting(true);
                          }}
                        >
                          Try Again
                        </Button>
                      </div>
                    )}
                  </Alert>
                )}
                
                <Tabs defaultActiveKey="login" className="mb-4 auth-tabs">
                  <Tab eventKey="login" title={<span><i className="fas fa-sign-in-alt me-2"></i>Login</span>}>
                    <Form onSubmit={handleLogin} className="mt-4">
                      <Form.Group className="mb-4">
                        <Form.Label style={{ fontWeight: 600, color: '#475569' }}>
                          <i className="fas fa-envelope me-2" style={{ color: '#667eea' }}></i>
                          Email
                        </Form.Label>
                        <Form.Control
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="form-control-enhanced"
                          placeholder="Enter your email"
                        />
                      </Form.Group>
                      <Form.Group className="mb-4">
                        <Form.Label style={{ fontWeight: 600, color: '#475569' }}>
                          <i className="fas fa-lock me-2" style={{ color: '#667eea' }}></i>
                          Password
                        </Form.Label>
                        <Form.Control
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="form-control-enhanced"
                          placeholder="Enter your password"
                        />
                      </Form.Group>
                      <Button 
                        variant="primary" 
                        type="submit" 
                        className="w-100 btn-auth-submit"
                        disabled={loading}
                        style={{ 
                          padding: '12px',
                          fontWeight: 600,
                          borderRadius: '10px',
                          fontSize: '1.1rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Signing In...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-sign-in-alt me-2"></i>
                            Sign In
                          </>
                        )}
                      </Button>
                    </Form>
                  </Tab>
                
                  <Tab eventKey="signup" title={<span><i className="fas fa-user-plus me-2"></i>Sign Up</span>}>
                    <Form onSubmit={handleSignup} className="mt-4">
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: 600, color: '#475569' }}>
                          <i className="fas fa-user me-2" style={{ color: '#667eea' }}></i>
                          Full Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="form-control-enhanced"
                          placeholder="Enter your full name"
                        />
                      </Form.Group>
                    
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: 600, color: '#475569' }}>
                          <i className="fas fa-envelope me-2" style={{ color: '#667eea' }}></i>
                          Email
                        </Form.Label>
                        <Form.Control
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="form-control-enhanced"
                          placeholder="Enter your email"
                        />
                      </Form.Group>
                    
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: 600, color: '#475569' }}>
                          <i className="fas fa-lock me-2" style={{ color: '#667eea' }}></i>
                          Password
                        </Form.Label>
                        <Form.Control
                          type="password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setPasswordErrors([]);
                          }}
                          required
                          className="form-control-enhanced"
                          placeholder="Enter your password (min. 8 chars with uppercase, lowercase, number, special char)"
                        />
                        {passwordErrors.length > 0 && (
                          <div className="mt-2" style={{ fontSize: '0.875rem' }}>
                            {passwordErrors.map((err, idx) => (
                              <div key={idx} className="text-danger">
                                <i className="fas fa-exclamation-circle me-1"></i>
                                {err}
                              </div>
                            ))}
                          </div>
                        )}
                        <Form.Text className="text-muted">
                          Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                        </Form.Text>
                      </Form.Group>
                    
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={{ fontWeight: 600, color: '#475569' }}>
                              <i className="fas fa-user-tag me-2" style={{ color: '#667eea' }}></i>
                              Role
                            </Form.Label>
                            <Form.Select
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                              required
                              className="form-control-enhanced"
                            >
                              <option value="student">Student</option>
                              <option value="teacher">Teacher</option>
                              <option value="parent">Parent</option>
                              <option value="admin">Admin</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={{ fontWeight: 600, color: '#475569' }}>
                              <i className="fas fa-user-friends me-2" style={{ color: '#667eea' }}></i>
                              Gender
                            </Form.Label>
                            <Form.Select
                              value={gender}
                              onChange={(e) => setGender(e.target.value)}
                              className="form-control-enhanced"
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: 600, color: '#475569' }}>
                          <i className="fas fa-phone me-2" style={{ color: '#667eea' }}></i>
                          Phone
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="form-control-enhanced"
                          placeholder="Enter phone number"
                        />
                      </Form.Group>
                    
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: 600, color: '#475569' }}>
                          <i className="fas fa-map-marker-alt me-2" style={{ color: '#667eea' }}></i>
                          Address
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="form-control-enhanced"
                          placeholder="Enter your address"
                        />
                      </Form.Group>
                    
                      {role === 'student' && (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label style={{ fontWeight: 600, color: '#475569' }}>
                              <i className="fas fa-id-card me-2" style={{ color: '#667eea' }}></i>
                              Roll Number
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={rollNumber}
                              onChange={(e) => setRollNumber(e.target.value)}
                              className="form-control-enhanced"
                              placeholder="Enter roll number"
                            />
                          </Form.Group>
                          
                          <Form.Group className="mb-3">
                            <Form.Label style={{ fontWeight: 600, color: '#475569' }}>
                              <i className="fas fa-graduation-cap me-2" style={{ color: '#667eea' }}></i>
                              Class *
                            </Form.Label>
                            <Form.Select
                              value={classId}
                              onChange={(e) => setClassId(e.target.value)}
                              required
                              className="form-control-enhanced"
                            >
                              <option value="">Select a Class</option>
                              {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                  {cls.name} - {cls.section} (Grade {cls.grade})
                                </option>
                              ))}
                            </Form.Select>
                            {classes.length === 0 && (
                              <Form.Text className="text-warning">
                                No classes available. Please contact administrator to create classes first.
                              </Form.Text>
                            )}
                          </Form.Group>
                          
                          <Form.Group className="mb-3">
                            <Form.Label style={{ fontWeight: 600, color: '#475569' }}>
                              <i className="fas fa-user-shield me-2" style={{ color: '#667eea' }}></i>
                              Parent Email (Optional)
                            </Form.Label>
                            <Form.Control
                              type="email"
                              value={parentId}
                              onChange={(e) => setParentId(e.target.value)}
                              className="form-control-enhanced"
                              placeholder="parent@example.com"
                            />
                          </Form.Group>
                        </>
                      )}
                    
                      <Button 
                        variant="success" 
                        type="submit" 
                        className="w-100 btn-auth-submit"
                        disabled={loading}
                        style={{ 
                          padding: '12px',
                          fontWeight: 600,
                          borderRadius: '10px',
                          fontSize: '1.1rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-user-plus me-2"></i>
                            Create Account
                          </>
                        )}
                      </Button>
                    </Form>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Auth;
