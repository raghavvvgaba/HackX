import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import { 
  getInstitutionByAdminId, 
  getInstitutionStaff, 
  getConsentRequests,
  getDashboardStats,
  getMockHospitalUser
} from '../../services/mockHospitalService';
import { FaClock, FaBell, FaUsers, FaHeartbeat, FaHospital, FaChartLine, FaUserMd, FaClipboardList, FaCalendar } from 'react-icons/fa';

export default function HospitalDashboardNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalStaff: 0,
    pendingRequests: 0,
    activeDepartments: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // MOCK MODE: Use mock hospital user
    const mockUser = getMockHospitalUser();
    
    try {
      const institutionResult = await getInstitutionByAdminId(mockUser.uid);

      if (!institutionResult.success) {
        navigate('/hospital/onboarding');
        return;
      }

      setInstitution(institutionResult.data);

      const [staffResult, statsResult, requestsResult] = await Promise.all([
        getInstitutionStaff(institutionResult.data.id),
        getDashboardStats(institutionResult.data.id),
        getConsentRequests(institutionResult.data.id, 'pending')
      ]);

      setStats({
        totalPatients: statsResult.success ? statsResult.data.totalPatients : 0,
        totalStaff: staffResult.success ? staffResult.data.length : 0,
        pendingRequests: requestsResult.success ? requestsResult.data.length : 0,
        activeDepartments: institutionResult.data.departments?.length || 0
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center glass-elevated p-8 rounded-3xl">
          <FaHospital className="text-primary text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text mb-2">No Institution Found</h2>
          <p className="text-secondary mb-4">Please register your institution first</p>
          <button
            onClick={() => navigate('/hospital/onboarding')}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all"
          >
            Register Institution
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background aurora-bg">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-primary/25 via-accent/20 to-transparent px-3 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b soft-divider">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl glass flex items-center justify-center shadow-lg">
              <FaHospital className="text-primary text-xl sm:text-2xl" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text leading-tight break-words">
                {getGreeting()}, <span className="text-primary">{institution.name}</span>
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 glass rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-secondary">
                  <FaHeartbeat className="text-accent" />
                  Hospital Portal
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${
                  institution.verified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {institution.verified ? '✓ Verified' : '⏳ Pending Verification'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="glass rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-3 shadow-lg">
              <FaClock className="text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-secondary">Today</div>
                <div className="text-xs sm:text-sm font-semibold text-text truncate">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long', month: 'short', day: 'numeric'
                  })}
                </div>
              </div>
            </div>
            <button className="relative rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-white shadow-xl bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 transition-all">
              <FaBell className="text-base sm:text-lg" />
              {stats.pendingRequests > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {stats.pendingRequests}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="glass-elevated rounded-2xl p-4 hover-glow-primary transition-all cursor-pointer" onClick={() => navigate('/hospital/patients')}>
              <div className="flex items-center justify-between mb-2">
                <FaUsers className="text-primary text-xl" />
                <div className="text-xs text-secondary">Total</div>
              </div>
              <div className="text-2xl font-bold text-text">{stats.totalPatients}</div>
              <div className="text-xs text-secondary mt-1">Patients</div>
            </div>

            <div className="glass-elevated rounded-2xl p-4 hover-glow-primary transition-all cursor-pointer" onClick={() => navigate('/hospital/staff')}>
              <div className="flex items-center justify-between mb-2">
                <FaUserMd className="text-green-500 text-xl" />
                <div className="text-xs text-secondary">Active</div>
              </div>
              <div className="text-2xl font-bold text-text">{stats.totalStaff}</div>
              <div className="text-xs text-secondary mt-1">Staff Members</div>
            </div>

            <div className="glass-elevated rounded-2xl p-4 hover-glow-accent transition-all cursor-pointer" onClick={() => navigate('/hospital/consent-requests')}>
              <div className="flex items-center justify-between mb-2">
                <FaClipboardList className="text-accent text-xl" />
                <div className="text-xs text-secondary">Pending</div>
              </div>
              <div className="text-2xl font-bold text-text">{stats.pendingRequests}</div>
              <div className="text-xs text-secondary mt-1">Requests</div>
            </div>

            <div className="glass-elevated rounded-2xl p-4 hover-glow-primary transition-all cursor-pointer" onClick={() => navigate('/hospital/departments')}>
              <div className="flex items-center justify-between mb-2">
                <FaHospital className="text-blue-500 text-xl" />
                <div className="text-xs text-secondary">Active</div>
              </div>
              <div className="text-2xl font-bold text-text">{stats.activeDepartments}</div>
              <div className="text-xs text-secondary mt-1">Departments</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-elevated rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover-glow-primary">
            <h3 className="text-lg sm:text-xl font-bold text-text mb-4 sm:mb-6 flex items-center gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-primary to-accent text-white flex items-center justify-center">
                <FaChartLine className="text-xs sm:text-sm" />
              </div>
              Quick Actions
            </h3>
            <div className="flex md:grid md:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 -mx-1 px-1">
              <button 
                onClick={() => navigate('/hospital/consent-requests')}
                className="group glass rounded-xl sm:rounded-2xl p-4 sm:p-6 lift-on-hover hover-glow-primary transition-all border soft-divider snap-start min-w-[240px] md:min-w-0"
              >
                <FaClipboardList className="text-primary text-xl sm:text-2xl mb-2" />
                <div className="text-left">
                  <div className="font-semibold text-text text-base sm:text-[1.05rem]">Request Patient Access</div>
                  <div className="text-secondary text-xs sm:text-sm mt-1">Send consent requests</div>
                </div>
              </button>
              <button 
                onClick={() => navigate('/hospital/staff')}
                className="group rounded-xl sm:rounded-2xl p-4 sm:p-6 lift-on-hover hover-glow-accent transition-all border soft-divider bg-gradient-to-br from-accent/25 to-accent/10 snap-start min-w-[240px] md:min-w-0"
              >
                <FaUserMd className="text-accent text-xl sm:text-2xl mb-2" />
                <div className="text-left">
                  <div className="font-semibold text-text text-base sm:text-[1.05rem]">Manage Staff</div>
                  <div className="text-secondary text-xs sm:text-sm mt-1">Add or remove members</div>
                </div>
              </button>
              <button 
                onClick={() => navigate('/hospital/patients')}
                className="group glass rounded-xl sm:rounded-2xl p-4 sm:p-6 lift-on-hover hover-glow-primary transition-all border soft-divider snap-start min-w-[240px] md:min-w-0"
              >
                <FaUsers className="text-secondary text-xl sm:text-2xl mb-2" />
                <div className="text-left">
                  <div className="font-semibold text-text text-base sm:text-[1.05rem]">View Patients</div>
                  <div className="text-secondary text-xs sm:text-sm mt-1">Access patient records</div>
                </div>
              </button>
            </div>
          </div>

          {/* Departments */}
          {institution.departments && institution.departments.length > 0 && (
            <div className="glass-elevated rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-text mb-4 flex items-center gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center">
                  <FaHospital className="text-xs sm:text-sm" />
                </div>
                Departments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {institution.departments.map((dept) => (
                  <div key={dept.id} className="glass rounded-xl p-4 border soft-divider hover:shadow-lg transition-all">
                    <div className="font-semibold text-text">{dept.name}</div>
                    {dept.headDoctorId && (
                      <div className="text-sm text-secondary mt-1">Head: {dept.headDoctorId}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Hospital Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-elevated rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover-glow-primary">
            <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <FaHospital className="text-primary" />
              Hospital Information
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-secondary">Institution ID</div>
                <div className="font-mono text-sm font-semibold text-primary">{institution.institutionId}</div>
              </div>
              <div>
                <div className="text-xs text-secondary">Type</div>
                <div className="text-sm font-medium text-text capitalize">{institution.type}</div>
              </div>
              <div>
                <div className="text-xs text-secondary">Location</div>
                <div className="text-sm text-text">{institution.address.city}, {institution.address.state}</div>
              </div>
              <div>
                <div className="text-xs text-secondary">Contact</div>
                <div className="text-sm text-text">{institution.contact.phone}</div>
                <div className="text-sm text-text">{institution.contact.email}</div>
              </div>
              {institution.metadata && (
                <>
                  {institution.metadata.totalBeds > 0 && (
                    <div>
                      <div className="text-xs text-secondary">Total Beds</div>
                      <div className="text-sm font-medium text-text">{institution.metadata.totalBeds}</div>
                    </div>
                  )}
                  {institution.metadata.establishedYear && (
                    <div>
                      <div className="text-xs text-secondary">Established</div>
                      <div className="text-sm font-medium text-text">{institution.metadata.establishedYear}</div>
                    </div>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => navigate('/hospital/settings')}
              className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-lg transition-all"
            >
              Edit Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
