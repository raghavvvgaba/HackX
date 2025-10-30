import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import { getInstitutionByAdminId } from '../../services/institutionService';
import { getInstitutionStaff } from '../../services/institutionStaffService';
import { getInstitutionPatientConsents } from '../../services/patientConsentService';
import { getInstitutionConsentRequests } from '../../services/patientConsentService';
import { FiUsers, FiActivity, FiUserCheck, FiClock, FiAlertCircle } from 'react-icons/fi';

export default function HospitalDashboard() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState(null);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalStaff: 0,
    pendingRequests: 0,
    activeDepartments: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      const institutionResult = await getInstitutionByAdminId(currentUser.uid);

      if (!institutionResult.success) {
        navigate('/hospital/onboarding');
        return;
      }

      setInstitution(institutionResult.data);

      const [staffResult, patientsResult, requestsResult] = await Promise.all([
        getInstitutionStaff(institutionResult.data.id),
        getInstitutionPatientConsents(institutionResult.data.id),
        getInstitutionConsentRequests(institutionResult.data.id)
      ]);

      const pendingRequests = requestsResult.success
        ? requestsResult.data.filter(req => req.status === 'pending').length
        : 0;

      setStats({
        totalPatients: patientsResult.success ? patientsResult.data.length : 0,
        totalStaff: staffResult.success ? staffResult.data.length : 0,
        pendingRequests,
        activeDepartments: institutionResult.data.departments?.length || 0
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <FiAlertCircle className="mx-auto text-yellow-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Institution Found</h2>
        <p className="text-gray-600 mb-4">You need to register your institution first.</p>
        <button
          onClick={() => navigate('/hospital/onboarding')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Register Institution
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: FiUsers,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      link: '/hospital/patients'
    },
    {
      title: 'Staff Members',
      value: stats.totalStaff,
      icon: FiActivity,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      link: '/hospital/staff'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: FiClock,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      link: '/hospital/consent-requests'
    },
    {
      title: 'Departments',
      value: stats.activeDepartments,
      icon: FiUserCheck,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      link: '/hospital/departments'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{institution.name}</h1>
            <p className="text-gray-600 mt-1">
              {institution.type.charAt(0).toUpperCase() + institution.type.slice(1)} · ID: {institution.institutionId}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <span className={`px-3 py-1 rounded-full text-sm ${
                institution.verified
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {institution.verified ? '✓ Verified' : '⏳ Pending Verification'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                institution.active
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {institution.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>{institution.address.city}, {institution.address.state}</p>
            <p>{institution.contact.phone}</p>
            <p>{institution.contact.email}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.link)}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              </div>
              <div className={`${card.bgColor} p-4 rounded-full`}>
                <card.icon className={card.textColor} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/hospital/consent-requests')}
            className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
          >
            <h3 className="font-semibold text-gray-800 mb-1">Request Patient Access</h3>
            <p className="text-sm text-gray-600">Send consent request to a patient</p>
          </button>

          <button
            onClick={() => navigate('/hospital/staff')}
            className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-left"
          >
            <h3 className="font-semibold text-gray-800 mb-1">Manage Staff</h3>
            <p className="text-sm text-gray-600">Add or remove staff members</p>
          </button>

          <button
            onClick={() => navigate('/hospital/patients')}
            className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
          >
            <h3 className="font-semibold text-gray-800 mb-1">View Patients</h3>
            <p className="text-sm text-gray-600">Access patient medical records</p>
          </button>
        </div>
      </div>

      {/* Departments */}
      {institution.departments && institution.departments.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Departments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {institution.departments.map((dept) => (
              <div key={dept.id} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800">{dept.name}</h3>
                {dept.headDoctorId && (
                  <p className="text-sm text-gray-600 mt-1">Head: {dept.headDoctorId}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
