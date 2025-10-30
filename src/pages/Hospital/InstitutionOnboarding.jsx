import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { createInstitution, getInstitutionByAdminId, getMockHospitalUser } from '../../services/mockHospitalService';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function InstitutionOnboarding() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // MOCK MODE: Check if institution already exists and redirect
  useEffect(() => {
    const checkExistingInstitution = async () => {
      const mockUser = getMockHospitalUser();
      const result = await getInstitutionByAdminId(mockUser.uid);
      
      if (result.success) {
        // Institution already exists, redirect to dashboard
        navigate('/hospital/dashboard');
      }
    };
    
    checkExistingInstitution();
  }, [navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    name: '',
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
      email: '',
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
      // MOCK MODE: Use mock user
      const mockUser = getMockHospitalUser();
      
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
        departments: validDepartments,
        licenses: validLicenses,
        metadata: {
          totalBeds: parseInt(formData.metadata.totalBeds) || 0,
          establishedYear: parseInt(formData.metadata.establishedYear) || 0,
          specializations: formData.metadata.specializations
            .split(',')
            .map(s => s.trim())
            .filter(s => s)
        }
      };

      const result = await createInstitution(mockUser.uid, institutionData);

      if (result.success) {
        setSuccess(`Institution created successfully! Your ID: ${result.institutionCode} (Mock Mode)`);
        setTimeout(() => {
          navigate('/hospital/dashboard');
        }, 1500);
      } else {
        setError(result.error || 'Failed to create institution');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background aurora-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-elevated rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center">
              <span className="text-3xl">🏥</span>
            </div>
            <h1 className="text-3xl font-bold text-text mb-2">Register Your Institution</h1>
            <p className="text-secondary">Complete the form to register your hospital or clinic</p>
          </div>

          {error && (
            <div className="mb-6 p-4 glass border-2 border-red-300 text-red-700 rounded-xl animate-shake">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="font-semibold">Error</div>
                  <div className="text-sm">{error}</div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 glass border-2 border-green-300 text-green-700 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <div>
                  <div className="font-semibold">Success!</div>
                  <div className="text-sm">{success}</div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <section className="glass rounded-2xl p-6 border soft-divider">
              <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Basic Information
              </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="St. Mary's Hospital"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                </select>
              </div>
            </div>
            </section>

          {/* Address */}
          <section className="glass rounded-2xl p-6 border soft-divider">
            <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
              <span className="text-2xl">📍</span>
              Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Street *</label>
                <input
                  type="text"
                  name="street"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange(e, 'address')}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange(e, 'address')}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange(e, 'address')}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange(e, 'address')}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="glass rounded-2xl p-6 border soft-divider">
            <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
              <span className="text-2xl">📞</span>
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.contact.phone}
                  onChange={(e) => handleInputChange(e, 'contact')}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.contact.email}
                  onChange={(e) => handleInputChange(e, 'contact')}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.contact.website}
                  onChange={(e) => handleInputChange(e, 'contact')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Departments */}
          <section className="glass rounded-2xl p-6 border soft-divider">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-text flex items-center gap-2">
                <span className="text-2xl">🏥</span>
                Departments
              </h2>
              <button
                type="button"
                onClick={addDepartment}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-lg transition-all"
              >
                <FiPlus /> Add
              </button>
            </div>
            <div className="space-y-3">
              {departments.map((dept, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={dept.name}
                    onChange={(e) => updateDepartment(index, e.target.value)}
                    placeholder="e.g., Cardiology, Neurology"
                    className="flex-1 px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {departments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDepartment(index)}
                      className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Additional Metadata */}
          <section className="glass rounded-2xl p-6 border soft-divider">
            <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
              <span className="text-2xl">ℹ️</span>
              Additional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Beds</label>
                <input
                  type="number"
                  name="totalBeds"
                  value={formData.metadata.totalBeds}
                  onChange={(e) => handleInputChange(e, 'metadata')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Established Year</label>
                <input
                  type="number"
                  name="establishedYear"
                  value={formData.metadata.establishedYear}
                  onChange={(e) => handleInputChange(e, 'metadata')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specializations (comma-separated)
                </label>
                <input
                  type="text"
                  name="specializations"
                  value={formData.metadata.specializations}
                  onChange={(e) => handleInputChange(e, 'metadata')}
                  placeholder="Cardiology, Oncology"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 glass border soft-divider rounded-xl hover:shadow-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <span>🏥</span>
                  Create Institution
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
