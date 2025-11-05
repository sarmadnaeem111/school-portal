import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Alert, Tab, Tabs, Image } from 'react-bootstrap';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../firebase/config';

const SchoolProfile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  // School profile data state
  const [profileData, setProfileData] = useState({
    // Basic Information
    schoolName: '',
    schoolCode: '',
    establishedYear: '',
    schoolType: '',
    board: '',
    medium: '',
    address: '',
    campus: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    
    // Contact Information
    phone: '',
    email: '',
    website: '',
    principalName: '',
    principalPhone: '',
    principalEmail: '',
    
    // Academic Information
    academicYear: '',
    totalStudents: '',
    totalTeachers: '',
    totalClasses: '',
    totalSubjects: '',
    
    // Facilities
    library: false,
    computerLab: false,
    scienceLab: false,
    playground: false,
    canteen: false,
    transport: false,
    wifi: false,
    security: false,
    
    // Additional Information
    vision: '',
    mission: '',
    motto: '',
    description: '',
    
    // Images
    logo: '',
    schoolImage: '',
    principalImage: '',
    
    // Social Media
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    
    // Timings
    schoolStartTime: '',
    schoolEndTime: '',
    officeStartTime: '',
    officeEndTime: '',
    
    // Holidays
    holidays: [],
    
    // Policies
    admissionPolicy: '',
    attendancePolicy: '',
    disciplinePolicy: '',
    feeStructure: '',
    
    // Achievements
    achievements: [],
    
    // Awards
    awards: []
  });

  useEffect(() => {
    fetchSchoolProfile();
    // Live updates to ensure images/fields appear immediately after save or refresh
    const profileRef = doc(db, 'schoolProfile', 'main');
    const unsubscribe = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfileData(prev => ({ ...prev, ...data }));
      }
    }, (err) => {
      console.error('Error listening to school profile:', err);
    });
    return () => unsubscribe();
  }, []);

  const fetchSchoolProfile = async () => {
    try {
      setLoading(true);
      const profileRef = doc(db, 'schoolProfile', 'main');
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        setProfileData({ ...profileData, ...profileSnap.data() });
      }
    } catch (error) {
      console.error('Error fetching school profile:', error);
      setMessage('Error loading school profile');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field, index, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setProfileData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (file, field) => {
    try {
      if (!file) return;
      
      // Prefer Cloudinary if configured via env
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

      let imageUrl = '';

      if (cloudName && uploadPreset) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        // Optional: organize by folder
        formData.append('folder', `schoolProfile/${field}`);

        const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        const response = await fetch(cloudinaryEndpoint, { method: 'POST', body: formData });
        if (!response.ok) {
          const txt = await response.text();
          throw new Error(`Cloudinary upload failed: ${txt}`);
        }
        const data = await response.json();
        imageUrl = data.secure_url || data.url;
      } else {
        // Fallback to Firebase Storage if Cloudinary is not configured
        const imageRef = ref(storage, `schoolProfile/${field}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(imageRef, file);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      
      // Update local state for immediate preview
      handleInputChange(field, imageUrl);

      // Persist immediately so image is saved even if user doesn't click Save Profile
      try {
        const profileRef = doc(db, 'schoolProfile', 'main');
        await setDoc(profileRef, { [field]: imageUrl }, { merge: true });
      } catch (persistError) {
        console.error('Error saving image URL to profile:', persistError);
      }

      setMessage('Image uploaded and saved successfully');
      setMessageType('success');
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('Error uploading image');
      setMessageType('danger');
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const profileRef = doc(db, 'schoolProfile', 'main');
      await setDoc(profileRef, profileData, { merge: true });
      
      setMessage('School profile saved successfully!');
      setMessageType('success');
    } catch (error) {
      console.error('Error saving school profile:', error);
      setMessage('Error saving school profile');
      setMessageType('danger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading school profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            <i className="fas fa-school me-3"></i>
            School Profile Management
          </h2>
          <p className="text-muted mb-0">Manage your school's information and branding</p>
        </div>
        <Button 
          variant="primary btn-enhanced" 
          onClick={saveProfile}
          disabled={saving}
          className="animate-pulse"
        >
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save me-2"></i>
              Save Profile
            </>
          )}
        </Button>
      </div>

      {message && (
        <Alert variant={messageType} className={`alert-enhanced alert-${messageType}`} onClose={() => setMessage('')} dismissible>
          <i className={`fas fa-${messageType === 'success' ? 'check-circle' : messageType === 'danger' ? 'exclamation-circle' : messageType === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2`}></i>
          {message}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 nav-tabs-enhanced"
      >
        {/* Basic Information Tab */}
        <Tab eventKey="basic" title="Basic Information">
          <Card className="card-enhanced">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Basic School Information
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-enhanced">School Name *</Form.Label>
                    <Form.Control
                      type="text"
                      className="form-control-enhanced"
                      value={profileData.schoolName}
                      onChange={(e) => handleInputChange('schoolName', e.target.value)}
                      placeholder="Enter school name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>School Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={profileData.schoolCode}
                      onChange={(e) => handleInputChange('schoolCode', e.target.value)}
                      placeholder="Enter school code"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Established Year</Form.Label>
                    <Form.Control
                      type="number"
                      value={profileData.establishedYear}
                      onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                      placeholder="e.g., 1995"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>School Type</Form.Label>
                    <Form.Select
                      value={profileData.schoolType}
                      onChange={(e) => handleInputChange('schoolType', e.target.value)}
                    >
                      <option value="">Select type</option>
                      <option value="Public">Public</option>
                      <option value="Private">Private</option>
                      <option value="Government">Government</option>
                      <option value="International">International</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Board</Form.Label>
                    <Form.Select
                      value={profileData.board}
                      onChange={(e) => handleInputChange('board', e.target.value)}
                    >
                      <option value="">Select board</option>
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State Board">State Board</option>
                      <option value="IB">IB</option>
                      <option value="IGCSE">IGCSE</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Medium of Instruction</Form.Label>
                    <Form.Select
                      value={profileData.medium}
                      onChange={(e) => handleInputChange('medium', e.target.value)}
                    >
                      <option value="">Select medium</option>
                      <option value="English">English</option>
                      <option value="Urdu">Urdu</option>
                      {/* <option value="Regional">Regional</option>
                      <option value="Bilingual">Bilingual</option> */}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Academic Year</Form.Label>
                    <Form.Control
                      type="text"
                      value={profileData.academicYear}
                      onChange={(e) => handleInputChange('academicYear', e.target.value)}
                      placeholder="e.g., 2024-2025"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>

        {/* Address Information Tab */}
        <Tab eventKey="address" title="Address & Location">
          <Card>
            <Card.Header>
              <h5>Address Information</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Address *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={profileData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter complete address"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Campus</Form.Label>
                <Form.Control
                  type="text"
                  value={profileData.campus}
                  onChange={(e) => handleInputChange('campus', e.target.value)}
                  placeholder="Enter campus name (e.g., Main Campus, North Campus, etc.)"
                />
              </Form.Group>
              
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>City *</Form.Label>
                    <Form.Control
                      type="text"
                      value={profileData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Enter city"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>State *</Form.Label>
                    <Form.Control
                      type="text"
                      value={profileData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Enter state"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pincode *</Form.Label>
                    <Form.Control
                      type="text"
                      value={profileData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      placeholder="Enter pincode"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Country</Form.Label>
                <Form.Control
                  type="text"
                  value={profileData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Enter country"
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Tab>

        {/* Contact Information Tab */}
        <Tab eventKey="contact" title="Contact Information">
          <Card>
            <Card.Header>
              <h5>Contact Details</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>School Phone *</Form.Label>
                    <Form.Control
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>School Email *</Form.Label>
                    <Form.Control
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Website</Form.Label>
                <Form.Control
                  type="url"
                  value={profileData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="Enter website URL"
                />
              </Form.Group>

              <h6 className="mt-4 mb-3">Principal Information</h6>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Principal Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={profileData.principalName}
                      onChange={(e) => handleInputChange('principalName', e.target.value)}
                      placeholder="Enter principal name"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Principal Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={profileData.principalPhone}
                      onChange={(e) => handleInputChange('principalPhone', e.target.value)}
                      placeholder="Enter principal phone"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Principal Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={profileData.principalEmail}
                      onChange={(e) => handleInputChange('principalEmail', e.target.value)}
                      placeholder="Enter principal email"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>

        {/* Statistics Tab */}
        <Tab eventKey="statistics" title="Statistics">
          <Card>
            <Card.Header>
              <h5>School Statistics</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Total Students</Form.Label>
                    <Form.Control
                      type="number"
                      value={profileData.totalStudents}
                      onChange={(e) => handleInputChange('totalStudents', e.target.value)}
                      placeholder="Enter total students"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Total Teachers</Form.Label>
                    <Form.Control
                      type="number"
                      value={profileData.totalTeachers}
                      onChange={(e) => handleInputChange('totalTeachers', e.target.value)}
                      placeholder="Enter total teachers"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Total Classes</Form.Label>
                    <Form.Control
                      type="number"
                      value={profileData.totalClasses}
                      onChange={(e) => handleInputChange('totalClasses', e.target.value)}
                      placeholder="Enter total classes"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Total Subjects</Form.Label>
                    <Form.Control
                      type="number"
                      value={profileData.totalSubjects}
                      onChange={(e) => handleInputChange('totalSubjects', e.target.value)}
                      placeholder="Enter total subjects"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>

        {/* Facilities Tab */}
        <Tab eventKey="facilities" title="Facilities">
          <Card>
            <Card.Header>
              <h5>School Facilities</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Library"
                      checked={profileData.library}
                      onChange={(e) => handleInputChange('library', e.target.checked)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Computer Lab"
                      checked={profileData.computerLab}
                      onChange={(e) => handleInputChange('computerLab', e.target.checked)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Science Lab"
                      checked={profileData.scienceLab}
                      onChange={(e) => handleInputChange('scienceLab', e.target.checked)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Playground"
                      checked={profileData.playground}
                      onChange={(e) => handleInputChange('playground', e.target.checked)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Canteen"
                      checked={profileData.canteen}
                      onChange={(e) => handleInputChange('canteen', e.target.checked)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Transport"
                      checked={profileData.transport}
                      onChange={(e) => handleInputChange('transport', e.target.checked)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="WiFi"
                      checked={profileData.wifi}
                      onChange={(e) => handleInputChange('wifi', e.target.checked)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Security"
                      checked={profileData.security}
                      onChange={(e) => handleInputChange('security', e.target.checked)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>

        {/* Vision & Mission Tab */}
        <Tab eventKey="vision" title="Vision & Mission">
          <Card>
            <Card.Header>
              <h5>School Vision, Mission & Values</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Vision</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={profileData.vision}
                  onChange={(e) => handleInputChange('vision', e.target.value)}
                  placeholder="Enter school vision"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Mission</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={profileData.mission}
                  onChange={(e) => handleInputChange('mission', e.target.value)}
                  placeholder="Enter school mission"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Motto</Form.Label>
                <Form.Control
                  type="text"
                  value={profileData.motto}
                  onChange={(e) => handleInputChange('motto', e.target.value)}
                  placeholder="Enter school motto"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={profileData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter school description"
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Tab>

        {/* Images Tab */}
        <Tab eventKey="images" title="Images">
          <Card>
            <Card.Header>
              <h5>School Images</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>School Logo</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'logo')}
                    />
                    {profileData.logo && (
                      <div className="mt-2">
                        <Image src={profileData.logo} thumbnail style={{ maxWidth: '100px', maxHeight: '100px' }} />
                      </div>
                    )}
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>School Image</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'schoolImage')}
                    />
                    {profileData.schoolImage && (
                      <div className="mt-2">
                        <Image src={profileData.schoolImage} thumbnail style={{ maxWidth: '100px', maxHeight: '100px' }} />
                      </div>
                    )}
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Principal Image</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'principalImage')}
                    />
                    {profileData.principalImage && (
                      <div className="mt-2">
                        <Image src={profileData.principalImage} thumbnail style={{ maxWidth: '100px', maxHeight: '100px' }} />
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>

        {/* Social Media Tab */}
        <Tab eventKey="social" title="Social Media">
          <Card>
            <Card.Header>
              <h5>Social Media Links</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Facebook</Form.Label>
                    <Form.Control
                      type="url"
                      value={profileData.facebook}
                      onChange={(e) => handleInputChange('facebook', e.target.value)}
                      placeholder="Enter Facebook URL"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Twitter</Form.Label>
                    <Form.Control
                      type="url"
                      value={profileData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      placeholder="Enter Twitter URL"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Instagram</Form.Label>
                    <Form.Control
                      type="url"
                      value={profileData.instagram}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      placeholder="Enter Instagram URL"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>LinkedIn</Form.Label>
                    <Form.Control
                      type="url"
                      value={profileData.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      placeholder="Enter LinkedIn URL"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>

        {/* Timings Tab */}
        <Tab eventKey="timings" title="School Timings">
          <Card>
            <Card.Header>
              <h5>School & Office Timings</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>School Start Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={profileData.schoolStartTime}
                      onChange={(e) => handleInputChange('schoolStartTime', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>School End Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={profileData.schoolEndTime}
                      onChange={(e) => handleInputChange('schoolEndTime', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Office Start Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={profileData.officeStartTime}
                      onChange={(e) => handleInputChange('officeStartTime', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Office End Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={profileData.officeEndTime}
                      onChange={(e) => handleInputChange('officeEndTime', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default SchoolProfile;
