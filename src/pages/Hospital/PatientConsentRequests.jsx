import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { 
  getInstitutionByAdminId, 
  searchPatientByIdentifier,
  createConsentRequest, 
  getConsentRequests,
  getMockHospitalUser
} from '../../services/mockHospitalService';
import { FiSearch, FiSend, FiCheck, FiX, FiClock } from 'react-icons/fi';

export default function PatientConsentRequests() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [requests, setRequests] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const [requestForm, setRequestForm] = useState({
    department: '',
    reason: '',
    accessType: 'full',
    duration: 'permanent'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // MOCK MODE: Use mock hospital user
      const mockUser = getMockHospitalUser();
      const instResult = await getInstitutionByAdminId(mockUser.uid);
      
      if (instResult.success) {
        setInstitution(instResult.data);

        const requestsResult = await getConsentRequests(instResult.data.id);
        if (requestsResult.success) {
          setRequests(requestsResult.data.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          ));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setSearchResult(null);

    try {
      const result = await searchPatientByIdentifier(searchTerm);
      if (result.success) {
        setSearchResult(result.data);
        setShowRequestForm(true);
      } else {
        alert('Patient not found. Please check the email or ID.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching for patient');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();

    try {
      const result = await createConsentRequest(
        searchResult.id,
        institution.id,
        currentUser.uid,
        {
          requestedByName: currentUser.displayName || currentUser.email,
          ...requestForm
        }
      );

      if (result.success) {
        alert('Consent request sent successfully!');
        setSearchResult(null);
        setShowRequestForm(false);
        setSearchTerm('');
        setRequestForm({
          department: '',
          reason: '',
          accessType: 'full',
          duration: 'permanent'
        });
        loadData();
      } else {
        alert(result.error || 'Failed to send request');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      alert('Error sending consent request');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      denied: 'bg-red-100 text-red-700'
    };

    const icons = {
      pending: <FiClock size={14} />,
      approved: <FiCheck size={14} />,
      denied: <FiX size={14} />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Patient Consent Requests</h1>

        {/* Search Patient */}
        <form onSubmit={handleSearch} className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Patient (Email or ID)
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter patient email address"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <FiSearch /> {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Search Result & Request Form */}
        {searchResult && showRequestForm && (
          <div className="border-t pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-1">Patient Found</h3>
              <p className="text-sm text-gray-600">Name: {searchResult.name}</p>
              <p className="text-sm text-gray-600">Email: {searchResult.email}</p>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={requestForm.department}
                    onChange={(e) => setRequestForm({ ...requestForm, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {institution.departments?.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Duration
                  </label>
                  <select
                    value={requestForm.duration}
                    onChange={(e) => setRequestForm({ ...requestForm, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="30_days">30 Days</option>
                    <option value="90_days">90 Days</option>
                    <option value="1_year">1 Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Access *
                </label>
                <textarea
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  placeholder="Please explain why you need access to this patient's records"
                  rows="3"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <FiSend /> Send Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchResult(null);
                    setShowRequestForm(false);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">All Requests</h2>

        {requests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No consent requests yet</p>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{request.patientName}</h3>
                    <p className="text-sm text-gray-600">{request.patientEmail}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Department: {request.department || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">Reason: {request.reason}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(request.status)}
                    <p className="text-xs text-gray-500 mt-2">
                      {request.createdAt && new Date(request.createdAt.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
