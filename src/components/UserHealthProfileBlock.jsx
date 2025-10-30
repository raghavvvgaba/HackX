import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { getUserProfile } from '../utils/firestoreService';
import { FaUserCircle, FaHeartbeat, FaWeight, FaRulerVertical, FaTint, FaCalendarAlt, FaEdit, FaEye } from 'react-icons/fa';
import { MdBloodtype, MdSick } from 'react-icons/md';
import { Link } from 'react-router-dom';

const UserHealthProfileBlock = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user?.uid) {
        try {
          setLoading(true);
          const result = await getUserProfile(user.uid);
          if (result.success) {
            setProfileData(result.data);
          } else {
            setError('Failed to load profile data');
          }
        } catch (error) {
          setError('An error occurred while loading data');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfileData();
  }, [user]);

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate BMI
  const calculateBMI = (weight, height) => {
    if (!weight?.value || !height?.value) return null;
    const weightInKg = weight.unit === 'lbs' ? weight.value * 0.453592 : weight.value;
    const heightInM = height.unit === 'ft' ? height.value * 0.3048 : height.value / 100;
    return (weightInKg / (heightInM * heightInM)).toFixed(1);
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border soft-divider">
        <div className="animate-pulse h-7 bg-white/10 rounded w-1/2 mb-2"></div>
        <div className="animate-pulse h-4 bg-white/10 rounded w-1/3"></div>
      </div>
    );
  }

  if (error || !profileData?.basic) {
    return (
      <div className="glass rounded-2xl p-6 border soft-divider">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[rgba(var(--primary-rgb)/0.15)] text-primary flex items-center justify-center">
            <FaUserCircle />
          </div>
          <h2 className="text-lg font-bold text-text">Profile data not available</h2>
        </div>
        <p className="text-secondary mb-4">{error || 'Complete your profile to see your health overview.'}</p>
        <Link to="edit-profile" className="glass-cta inline-flex items-center gap-2 px-4 py-2">
          <FaEdit /> Complete Profile
        </Link>
      </div>
    );
  }

  const { basic, medical } = profileData;
  const age = calculateAge(basic.dob);
  const bmi = calculateBMI(basic.weight, basic.height);

  return (
    <div className="glass rounded-2xl p-6 border soft-divider hover-glow-primary">
      {/* Header */}
      <div className="flex items-center gap-4 mb-3">
        <div className="w-14 h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg">
          <FaUserCircle className="text-xl" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-text truncate">{basic.fullName || 'Unknown User'}</h2>
          <p className="text-xs sm:text-sm text-secondary truncate">Patient ID: {user?.uid?.substring(0, 8).toUpperCase() || 'N/A'}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2">
        <div className="p-4 glass rounded-xl border soft-divider">
          <div className="flex items-center gap-2 mb-1"><FaRulerVertical className="text-primary" /><span className="text-xs font-medium text-secondary">Height</span></div>
          <span className="text-lg font-bold text-text">{basic.height?.value} {basic.height?.unit || 'cm'}</span>
        </div>
        <div className="p-4 glass rounded-xl border soft-divider">
          <div className="flex items-center gap-2 mb-1"><FaWeight className="text-accent" /><span className="text-xs font-medium text-secondary">Weight</span></div>
          <span className="text-lg font-bold text-text">{basic.weight?.value} {basic.weight?.unit || 'kg'}</span>
        </div>
        <div className="p-4 glass rounded-xl border soft-divider">
          <div className="flex items-center gap-2 mb-1"><FaTint className="text-red-400" /><span className="text-xs font-medium text-secondary">Blood Group</span></div>
          <span className="text-lg font-bold text-text">{basic.bloodGroup || 'Not set'}</span>
        </div>
        <div className="p-4 glass rounded-xl border soft-divider">
          <div className="flex items-center gap-2 mb-1"><FaCalendarAlt className="text-orange-400" /><span className="text-xs font-medium text-secondary">Age</span></div>
          <span className="text-lg font-bold text-text">{age ? `${age} years` : 'Not set'}</span>
        </div>
        <div className="p-4 glass rounded-xl border soft-divider">
          <div className="flex items-center gap-2 mb-1"><MdBloodtype className="text-red-400" /><span className="text-xs font-medium text-secondary">Blood Type</span></div>
          <span className="text-lg font-bold text-text">{basic.bloodGroup || 'Not set'}</span>
        </div>
        <div className="p-4 glass rounded-xl border soft-divider">
          <div className="flex items-center gap-2 mb-1"><MdSick className="text-green-400" /><span className="text-xs font-medium text-secondary">Gender</span></div>
          <span className="text-lg font-bold text-text">{basic.gender || 'Not set'}</span>
        </div>
      </div>

      {/* BMI Section */}
      {bmi && (
        <div className="p-4 glass rounded-xl border soft-divider mt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FaHeartbeat className="text-green-400" />
              <span className="font-medium text-text">Body Mass Index (BMI)</span>
            </div>
            <span className="text-2xl font-bold text-green-400">{bmi}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full ${
                bmi < 18.5 ? 'bg-blue-500' :
                bmi < 25 ? 'bg-green-500' :
                bmi < 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min((bmi / 35) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-secondary">
            {bmi < 18.5 ? 'Underweight' :
             bmi < 25 ? 'Normal weight' :
             bmi < 30 ? 'Overweight' : 'Obese'}
          </p>
        </div>
      )}

      {/* Medical Conditions */}
      {medical?.conditions && medical.conditions.length > 0 && (
        <div className="p-4 glass rounded-xl border soft-divider mt-2">
          <h3 className="font-semibold text-text mb-3">Medical Conditions</h3>
          <div className="flex flex-wrap gap-2">
            {medical.conditions.slice(0, 4).map((condition, index) => (
              <span 
                key={index}
                className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
              >
                {condition}
              </span>
            ))}
            {medical.conditions.length > 4 && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-secondary">
                +{medical.conditions.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t soft-divider">
        <Link
          to="edit-profile"
          className="flex-1 glass-cta flex items-center justify-center gap-2 px-4 py-3"
        >
          <FaEdit className="text-sm" />
          <span className="font-medium">Edit</span>
        </Link>
        <Link
          to="view-profile"
          className="flex-1 glass rounded-lg border soft-divider text-text flex items-center justify-center gap-2 px-4 py-3 hover-glow-primary"
        >
          <FaEye className="text-sm" />
          <span className="font-medium">View Full</span>
        </Link>
      </div>
      <div className="pt-2">
        <p className="text-xs text-secondary text-center">
          Keep your health information updated for better care
        </p>
      </div>
    </div>
  );
};

export default UserHealthProfileBlock;
