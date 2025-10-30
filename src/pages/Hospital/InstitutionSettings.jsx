import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { 
  getInstitutionByAdminId, 
  updateInstitution, 
  addDepartment, 
  removeDepartment,
  getMockHospitalUser
} from '../../services/mockHospitalService';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { FaHospital } from 'react-icons/fa';

export default function InstitutionSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [institution, setInstitution] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const [newDepartment, setNewDepartment] = useState('');

  useEffect(() => {
    loadInstitution();
  }, []);

  const loadInstitution = async () => {
    // MOCK MODE: Use mock hospital user
    const mockUser = getMockHospitalUser();

    try {
      const result = await getInstitutionByAdminId(mockUser.uid);
      
      if (result.success) {
        setInstitution(result.data);
        setFormData({
          name: result.data.name || '',
          type: result.data.type || 'hospital',
          address: result.data.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'USA'
          },
          contact: result.data.contact || {
            phone: '',
            email: '',
            website: ''
          },
          metadata: {
            totalBeds: result.data.metadata?.totalBeds || '',
            establishedYear: result.data.metadata?.establishedYear || '',
            specializations: result.data.metadata?.specializations?.join(', ') || ''
          }
        });
      } else {
        navigate('/hospital/onboarding');
      }
    } catch (error) {
      console.error('Error loading institution:', error);
      setError('Failed to load institution data');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddDepartment = async () => {
    if (!newDepartment.trim()) return;

    try {
      const result = await addDepartment(institution.id, {
        name: newDepartment.trim()
      });

      if (result.success) {
        setSuccess('Department added successfully');
        setNewDepartment('');
        await loadInstitution();
      } else {
        setError(result.error || 'Failed to add department');
      }
    } catch (error) {
      setError('Error adding department');
    }
  };

  const handleRemoveDepartment = async (departmentId) => {
    if (!confirm('Are you sure you want to remove this department?')) return;

    try {
      const result = await removeDepartment(institution.id, departmentId);

      if (result.success) {
        setSuccess('Department removed successfully');
        await loadInstitution();
      } else {
        setError(result.error || 'Failed to remove department');
      }
    } catch (error) {
      setError('Error removing department');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        ...formData,
        metadata: {
          totalBeds: parseInt(formData.metadata.totalBeds) || 0,
          establishedYear: parseInt(formData.metadata.establishedYear) || 0,
          specializations: formData.metadata.specializations
            .split(',')
            .map(s => s.trim())
            .filter(s => s)
        }
      };

      const result = await updateInstitution(institution.id, updateData);

      if (result.success) {
        setSuccess('Institution updated successfully!');
        await loadInstitution();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to update institution');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background aurora-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-elevated rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center">
              <FaHospital className="text-xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text">Institution Settings</h1>
              <p className="text-secondary">Update your hospital information</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <section className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-text mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Institution Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="hospital">Hospital</option>
                    <option value="clinic">Clinic</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Address */}
            <section className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-text mb-4">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary mb-2">Street *</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange(e, 'address')}
                    required
                    className="w-full px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange(e, 'address')}
                    required
                    className="w-full px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.address.state}
                    onChange={(e) => handleInputChange(e, 'address')}
                    required
                    className="w-full px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">ZIP Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.address.zipCode}
                    onChange={(e) => handleInputChange(e, 'address')}
                    required
                    className="w-full px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-text mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.contact.phone}
                    onChange={(e) => handleInputChange(e, 'contact')}
                    required
                    className="w-full px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.contact.email}
                    onChange={(e) => handleInputChange(e, 'contact')}
                    required
                    className="w-full px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.contact.website}
                    onChange={(e) => handleInputChange(e, 'contact')}
                    className="w-full px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Departments */}
            <section className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-text mb-4">Departments</h2>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="Department name"
                  className="flex-1 px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddDepartment}
                  className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                  <FiPlus /> Add
                </button>
              </div>
              <div className="space-y-2">
                {institution?.departments?.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between glass border soft-divider rounded-xl p-3">
                    <span className="text-text font-medium">{dept.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDepartment(dept.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Additional Info */}
            <section className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-text mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Total Beds</label>
                  <input
                    type="number"
                    name="totalBeds"
                    value={formData.metadata.totalBeds}
                    onChange={(e) => handleInputChange(e, 'metadata')}
                    className="w-full px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Established Year</label>
                  <input
                    type="number"
                    name="establishedYear"
                    value={formData.metadata.establishedYear}
                    onChange={(e) => handleInputChange(e, 'metadata')}
                    className="w-full px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Specializations (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="specializations"
                    value={formData.metadata.specializations}
                    onChange={(e) => handleInputChange(e, 'metadata')}
                    placeholder="Cardiology, Oncology"
                    className="w-full px-4 py-2 glass border soft-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/hospital/dashboard')}
                className="px-6 py-3 glass border soft-divider rounded-xl hover:shadow-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <FiSave />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
