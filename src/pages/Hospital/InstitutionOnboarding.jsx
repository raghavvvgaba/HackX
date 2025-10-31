import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { updateHospitalData } from '../../services/hospitalService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiPlus, FiTrash2, FiArrowLeft, FiCheck } from 'react-icons/fi';

export default function InstitutionOnboarding() {
  const { user: currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user is authenticated and has hospital role
  useEffect(() => {
    console.log('Auth check:', { authLoading, currentUser, userProfile });

    if (!authLoading) {
      if (!currentUser) {
        console.log('No current user, redirecting to login');
        navigate('/login');
        return;
      }

      if (!userProfile) {
        console.log('No user profile yet, waiting...');
        return;
      }

      console.log('User profile found:', userProfile.role);

      if (userProfile.role !== 'hospital') {
        console.log('Not a hospital user, redirecting to appropriate dashboard');
        // Not a hospital user, redirect to appropriate dashboard
        if (userProfile.role === 'doctor') {
          navigate('/doctor');
        } else if (userProfile.role === 'user') {
          navigate('/user');
        }
        return;
      }

      // Check if hospital already has completed onboarding
      if (userProfile.onboardingCompleted === true) {
        console.log('Onboarding already completed, redirecting to dashboard');
        navigate('/hospital/dashboard');
        return;
      }

      console.log('Hospital onboarding can proceed');
    }
  }, [currentUser, userProfile, authLoading, navigate]);

  if (authLoading || loading || !userProfile) {
    return (
      <div className="min-h-screen bg-background aurora-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    type: 'hospital',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    contact: {
      phone: '',
      email: userProfile?.email || '',
      website: ''
    },
    metadata: {
      totalBeds: '',
      establishedYear: '',
      specializations: ''
    }
  });

  const [departments, setDepartments] = useState([{ name: '' }]);
  const [licenses, setLicenses] = useState([{ type: '', number: '', expiryDate: '' }]);

  const handleInputChange = (e, section = null) => {
    const { name, value } = e.target;

    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const addDepartment = () => {
    setDepartments([...departments, { name: '' }]);
  };

  const removeDepartment = (index) => {
    setDepartments(departments.filter((_, i) => i !== index));
  };

  const updateDepartment = (index, value) => {
    const updated = [...departments];
    updated[index].name = value;
    setDepartments(updated);
  };

  const addLicense = () => {
    setLicenses([...licenses, { type: '', number: '', expiryDate: '' }]);
  };

  const removeLicense = (index) => {
    setLicenses(licenses.filter((_, i) => i !== index));
  };

  const updateLicense = (index, field, value) => {
    const updated = [...licenses];
    updated[index][field] = value;
    setLicenses(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Starting onboarding submission...');
      console.log('Current user:', currentUser);
      console.log('User profile:', userProfile);

      if (!currentUser || !userProfile?.hospitalId) {
        console.error('Missing user or hospitalId');
        throw new Error('Hospital not authenticated');
      }

      const validDepartments = departments
        .filter(dept => dept.name.trim())
        .map((dept, index) => ({
          id: `dept-${Date.now()}-${index}`,
          name: dept.name,
          headDoctorId: null
        }));

      const validLicenses = licenses.filter(
        lic => lic.type.trim() && lic.number.trim()
      );

      const institutionData = {
        ...formData,
        address: formData.address,
        contact: formData.contact,
        departments: validDepartments,
        licenses: validLicenses,
        metadata: {
          totalBeds: parseInt(formData.metadata.totalBeds) || 0,
          establishedYear: parseInt(formData.metadata.establishedYear) || 0,
          specializations: formData.metadata.specializations
            .split(',')
            .map(s => s.trim())
            .filter(s => s)
        },
        onboardingCompleted: true
      };

      // Update hospital data in Firestore
      const result = await updateHospitalData(userProfile.hospitalId, institutionData);

      if (result.success) {
        setSuccess(`Institution updated successfully! Your Hospital ID: ${userProfile.hospitalId}`);

        // Update onboarding status in users collection
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../../config/firebase');
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { onboardingCompleted: true });

        setTimeout(() => {
          navigate('/hospital/dashboard');
        }, 1500);
      } else {
        setError(result.error || 'Failed to update institution');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background aurora-bg px-3 sm:px-6 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="glass rounded-xl border soft-divider px-4 py-2 flex items-center gap-2 text-sm font-medium hover-glow-primary mb-6"
        >
          <FiArrowLeft className="text-primary" />
          <span>Back</span>
        </button>

        <div className="glass rounded-3xl p-6 sm:p-8 border soft-divider hover-glow-primary">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shadow-xl">
              <span className="text-4xl">🏥</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-text mb-2">Complete Your Hospital Profile</h1>
            <p className="text-secondary text-lg">Provide details about your healthcare institution</p>
          </div>

          {error && (
            <div className="mb-6 p-4 glass border-2 border-red-500/40 text-red-400 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="font-semibold text-red-400">Error</div>
                  <div className="text-sm text-red-300">{error}</div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 glass border-2 border-green-500/40 text-green-400 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-semibold text-green-400">Success!</div>
                  <div className="text-sm text-green-300">{success}</div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <section className="glass rounded-2xl p-6 border soft-divider">
              <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-3">
                <span className="text-2xl">📋</span>
                Basic Information
              </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Institution Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 dark:bg-black/20 supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10 backdrop-blur border border-white/20 dark:border-white/10 text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="St. Mary's Hospital"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Institution Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 dark:bg-black/20 supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10 backdrop-blur border border-white/20 dark:border-white/10 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                >
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="diagnostic_center">Diagnostic Center</option>
                  <option value="specialty_hospital">Specialty Hospital</option>
                </select>
              </div>
            </div>
            </section>

          {/* Address */}
          <section className="glass rounded-2xl p-6 border soft-divider">
            <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-3">
              <span className="text-2xl">📍</span>
              Address Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-text mb-2">Street Address *</label>
                <input
                  type="text"
                  name="street"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange(e, 'address')}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 dark:bg-black/20 supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10 backdrop-blur border border-white/20 dark:border-white/10 text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="123 Medical Center Drive"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange(e, 'address')}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 dark:bg-black/20 supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10 backdrop-blur border border-white/20 dark:border-white/10 text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="New York"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange(e, 'address')}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 dark:bg-black/20 supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10 backdrop-blur border border-white/20 dark:border-white/10 text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="NY"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">ZIP Code *</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange(e, 'address')}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 dark:bg-black/20 supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10 backdrop-blur border border-white/20 dark:border-white/10 text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="10001"
                />
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="glass rounded-2xl p-6 border soft-divider">
            <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-3">
              <span className="text-2xl">📞</span>
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-text mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.contact.phone}
                  onChange={(e) => handleInputChange(e, 'contact')}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 dark:bg-black/20 supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10 backdrop-blur border border-white/20 dark:border-white/10 text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.contact.email}
                  onChange={(e) => handleInputChange(e, 'contact')}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 dark:bg-black/20 supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10 backdrop-blur border border-white/20 dark:border-white/10 text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="contact@hospital.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.contact.website}
                  onChange={(e) => handleInputChange(e, 'contact')}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 dark:bg-black/20 supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10 backdrop-blur border border-white/20 dark:border-white/10 text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="https://www.hospital.com"
                />
              </div>
            </div>
          </section>

          {/* Departments */}
          <section className="glass rounded-2xl p-6 border soft-divider">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-text flex items-center gap-3">
                <span className="text-2xl">🏥</span>
                Departments & Specializations
              </h2>
              <button
                type="button"
                onClick={addDepartment}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                <FiPlus /> Add Department
              </button>
            </div>
            <div className="space-y-4">
              {departments.map((dept, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={dept.name}
                    onChange={(e) => updateDepartment(index, e.target.value)}
                    placeholder="e.g., Cardiology, Neurology, Emergency Medicine"
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 dark:bg-black/20 supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10 backdrop-blur border border-white/20 dark:border-white/10 text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                  {departments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDepartment(index)}
                      className="px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Additional Information */}
          <section className="glass rounded-2xl p-6 border soft-divider">
            <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-3">
              <span className="text-2xl">ℹ️</span>
              Additional Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-text mb-2">Total Beds</label>
                <input
                  type="number"
                  name="totalBeds"
                  value={formData.metadata.totalBeds}
                  onChange={(e) => handleInputChange(e, 'metadata')}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 dark:bg-black/20 supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10 backdrop-blur border border-white/20 dark:border-white/10 text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">Established Year</label>
                <input
                  type="number"
                  name="establishedYear"
                  value={formData.metadata.establishedYear}
                  onChange={(e) => handleInputChange(e, 'metadata')}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 dark:bg-black/20 supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10 backdrop-blur border border-white/20 dark:border-white/10 text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="1990"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Specializations (comma-separated)
                </label>
                <input
                  type="text"
                  name="specializations"
                  value={formData.metadata.specializations}
                  onChange={(e) => handleInputChange(e, 'metadata')}
                  placeholder="Cardiology, Oncology, Pediatrics"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 dark:bg-black/20 supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10 backdrop-blur border border-white/20 dark:border-white/10 text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-8 py-3.5 glass border soft-divider rounded-xl hover:shadow-lg transition-all font-medium text-text hover-glow-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-3 font-semibold shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiCheck className="text-xl" />
                  Complete Registration
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
