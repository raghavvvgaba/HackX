import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaHeart, FaRunning, FaUtensils, FaEdit, FaArrowLeft, FaTransgender } from 'react-icons/fa';
import { GiBodyHeight } from 'react-icons/gi';
import { MdBloodtype, MdSick, MdPhone, MdCalendarToday, MdAccessibility } from 'react-icons/md';
import { BsCapsulePill, BsEyeFill, BsEarFill } from 'react-icons/bs';
import { AiOutlineWarning } from 'react-icons/ai';
import { getUserProfile } from '../../utils/firestoreService';
import { useAuth } from '../../context/authContext';
import ShareButton from '../../components/ShareButton';

export function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.uid) return;
      try {
        const result = await getUserProfile(user.uid);
        if (result.success) setProfileData(result.data); else setError(result.error || 'Failed to load profile');
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally { setLoading(false); }
    };
    fetchProfileData();
  }, [user]);

  // Skeleton (unchanged) -----------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-background aurora-bg px-4 sm:px-8 py-8">
        <div className="max-w-7xl mx-auto animate-pulse space-y-8">
          <div className="h-10 w-56 glass rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-52 glass rounded-2xl border soft-divider" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background aurora-bg flex items-center justify-center px-4">
        <div className="glass rounded-3xl p-10 border soft-divider max-w-md w-full text-center space-y-6">
          <h2 className="text-2xl font-bold text-text">Profile Error</h2>
          <p className="text-secondary text-sm">{error}</p>
          <Link to="/user" className="glass-cta px-6 py-3 rounded-xl font-semibold inline-block">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background aurora-bg flex items-center justify-center px-4">
        <div className="glass rounded-3xl p-10 border soft-divider max-w-md w-full text-center space-y-6">
          <h2 className="text-2xl font-bold text-text">Profile Not Found</h2>
          <p className="text-secondary text-sm">We couldn't find your profile data.</p>
          <Link to="/user" className="glass-cta px-6 py-3 rounded-xl font-semibold inline-block">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const { basic = {}, medical = {}, lifestyle = {} } = profileData;

  // Reusable components (compact styling like PatientProfilePage) ------------
  const Card = ({ title, icon: Icon, children, className = '' }) => (
    <div className={`glass rounded-2xl p-5 border soft-divider hover-glow-primary transition-all ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-[rgba(var(--primary-rgb)/0.15)] text-primary flex items-center justify-center">
          <Icon className="text-base" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-text">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value, icon: Icon }) => (
    <div className="flex items-center justify-between p-3 rounded-lg border soft-divider glass">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="text-primary text-sm shrink-0" />}
        <span className="text-sm font-medium text-text truncate">{label}</span>
      </div>
      <span className="text-sm text-secondary font-medium max-w-[60%] text-right truncate">{value || 'Not specified'}</span>
    </div>
  );

  const Chips = ({ items }) => (
    <div className="flex flex-wrap gap-2">
      {items && items.length > 0 ? (
        items.map((item, i) => (
          <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary/90 dark:text-primary/80">
            {item}
          </span>
        ))
      ) : (
        <span className="text-sm text-secondary italic">None specified</span>
      )}
    </div>
  );

  const yesNoPill = (val) => (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${val ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-secondary'}`}>{val ? 'Yes' : 'No'}</span>
  );

  // Layout -------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background aurora-bg px-3 sm:px-6 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link to="/user" className="glass rounded-xl border soft-divider px-4 py-2 flex items-center gap-2 text-sm font-medium hover-glow-primary">
              <FaArrowLeft className="text-primary" />
              <span>Back</span>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text leading-tight">Complete Profile</h1>
              <p className="text-secondary text-sm">Overview of your health data</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShareButton />
            <Link to="../edit-profile" className="glass-cta flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-primary/30 transition-shadow">
              <FaEdit /> Edit Profile
            </Link>
          </div>
        </div>

        {/* Grid (reduced gaps & tighter cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <Card title="Basic Information" icon={FaUserCircle}>
            <div className="space-y-2.5">
              <Field label="Full Name" value={basic.fullName} icon={FaUserCircle} />
              <Field label="Gender" value={basic.gender} icon={FaTransgender} />
              <Field label="Date of Birth" value={basic.dob ? new Date(basic.dob).toLocaleDateString() : null} icon={MdCalendarToday} />
              <Field label="Contact Number" value={basic.contactNumber} icon={MdPhone} />
            </div>
          </Card>

          <Card title="Physical Details" icon={GiBodyHeight}>
            <div className="space-y-2.5">
              <Field label="Height" value={basic?.height ? `${basic.height.value} ${basic.height.unit}` : null} icon={GiBodyHeight} />
              <Field label="Weight" value={basic?.weight ? `${basic.weight.value} ${basic.weight.unit}` : null} icon={MdSick} />
              <Field label="Blood Group" value={basic.bloodGroup} icon={MdBloodtype} />
            </div>
          </Card>

          <Card title="Emergency Contact" icon={MdPhone}>
            <div className="space-y-2.5">
              <Field label="Name" value={basic?.emergencyContact?.name} icon={FaUserCircle} />
              <Field label="Phone" value={basic?.emergencyContact?.number} icon={MdPhone} />
              <Field label="Relation" value={basic?.emergencyContact?.relation} />
            </div>
          </Card>

          <Card title="Chronic Conditions" icon={FaHeart}>
            <Chips items={medical?.chronicConditions} />
          </Card>

          <Card title="Allergies" icon={AiOutlineWarning}>
            <Chips items={medical?.allergies} />
          </Card>

          <Card title="Current Medications" icon={BsCapsulePill}>
            <Chips items={medical?.currentMedications} />
          </Card>

          <Card title="Disabilities" icon={MdAccessibility}>
            <Chips items={medical?.disabilities} />
          </Card>

          <Card title="Vision & Hearing" icon={BsEyeFill}>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 p-3 rounded-lg border soft-divider glass flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-text flex items-center gap-2"><BsEyeFill className="text-primary" />Wears Glasses</span>
                  {yesNoPill(medical?.vision?.wearsGlasses)}
                </div>
                <div className="flex-1 p-3 rounded-lg border soft-divider glass flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-text flex items-center gap-2"><BsEarFill className="text-primary" />Hearing Aids</span>
                  {yesNoPill(medical?.hearingAids)}
                </div>
              </div>
              {medical?.vision?.wearsGlasses && (
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Left Eye" value={medical?.vision?.leftEye} />
                  <Field label="Right Eye" value={medical?.vision?.rightEye} />
                </div>
              )}
            </div>
          </Card>

          <Card title="Lifestyle Habits" icon={FaRunning}>
            <Chips items={lifestyle?.habits} />
          </Card>

          <Card title="Dietary Preferences" icon={FaUtensils}>
            <Chips items={lifestyle?.preferences} />
          </Card>
        </div>

        <div className="mt-10 text-center">
          <p className="text-[11px] text-secondary tracking-wide uppercase">End of Profile • Keep your information up to date</p>
        </div>
      </div>
    </div>
  );
}
