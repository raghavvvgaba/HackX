import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaUserCircle, FaHeart, FaRunning, FaUtensils, FaSave, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { GiBodyHeight } from 'react-icons/gi';
import { MdBloodtype, MdSick, MdPhone, MdCalendarToday, MdAccessibility } from 'react-icons/md';
import { BsCapsulePill, BsEyeFill, BsEarFill } from 'react-icons/bs';
import { AiOutlineWarning } from 'react-icons/ai';
import { Link, useNavigate } from 'react-router-dom';
import { Listbox } from '@headlessui/react';
import { getUserProfile, addUserProfile, editUserProfile } from '../../utils/firestoreService';
import { useAuth } from '../../context/authContext';

// Steps for editing profile
const steps = [
  { id: 1, name: 'Basic Information', description: 'Personal and contact details' },
  { id: 2, name: 'Emergency Contact', description: 'Emergency contact information' },
  { id: 3, name: 'Medical Information', description: 'Your medical history and conditions' },
  { id: 4, name: 'Lifestyle', description: 'Your habits and preferences' },
];

// Options from Onboarding
const genderOptions = [
  { value: '', label: 'Select Gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const bloodGroupOptions = [
  { value: '', label: 'Select Blood Group' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
];

const habitOptions = [
  'Regular Exercise',
  'Smoking',
  'Drinking Alcohol',
  'Meditation',
  'Yoga',
  'Running/Jogging',
  'Swimming',
  'Cycling',
  'Weight Training',
  'Walking',
  'Late Night Sleep',
  'Early Morning Routine',
  'Screen Time (High)',
  'Reading',
  'Gaming'
];

const preferenceOptions = [
  'Vegetarian',
  'Vegan',
  'Non-Vegetarian',
  'Gluten-Free',
  'Low Sugar',
  'No Dairy',
  'Organic Food',
  'Home Cooked Meals',
  'Fast Food',
  'Spicy Food',
  'Low Sodium',
  'High Protein Diet'
];

const chronicConditionsOptions = [
  'High Blood Pressure',
  'Diabetes Type 1',
  'Diabetes Type 2',
  'Asthma',
  'Heart Disease',
  'Cancer',
  'Stroke',
  'Arthritis',
  'Depression',
  'Anxiety',
  'COPD',
  'Kidney Disease',
  'Liver Disease',
  'Thyroid Disorder',
  'Migraine',
  'Epilepsy',
  'Fibromyalgia',
  'Chronic Fatigue Syndrome',
  'Osteoporosis',
  'Bipolar Disorder',
  'Schizophrenia',
  'Multiple Sclerosis',
  'Parkinson\'s Disease',
  'Alzheimer\'s Disease',
  'IBS',
  'Crohn\'s Disease',
  'Ulcerative Colitis',
  'Celiac Disease'
];

const allergiesOptions = [
  'Penicillin',
  'Sulfa Drugs',
  'NSAIDs',
  'Aspirin',
  'Latex',
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Pollen',
  'Dust Mites',
  'Pet Dander',
  'Mold',
  'Bee Stings',
  'Contrast Dye'
];

const medicationsOptions = [
  'Lisinopril',
  'Atorvastatin',
  'Levothyroxine',
  'Metformin',
  'Amlodipine',
  'Metoprolol',
  'Omeprazole',
  'Simvastatin',
  'Losartan',
  'Albuterol',
  'Gabapentin',
  'Hydrochlorothiazide',
  'Sertraline',
  'Acetaminophen',
  'Ibuprofen',
  'Fluoxetine',
  'Amoxicillin',
  'Prednisone',
  'Escitalopram',
  'Tramadol',
  'Furosemide',
  'Antihypertensives',
  'Antidiabetics',
  'Statins',
  'Anticoagulants',
  'Beta Blockers',
  'Antidepressants',
  'Antibiotics',
  'Pain Relievers',
  'Anti-inflammatories',
  'Antihistamines',
  'Inhalers',
  'Thyroid Medications',
  'Vitamins & Supplements'
];

const disabilitiesOptions = [
  'Mobility Impairment',
  'Visual Impairment',
  'Hearing Impairment',
  'Speech Impairment',
  'Cognitive Disability',
  'Intellectual Disability',
  'Learning Disability',
  'Neurological Disability',
  'Psychiatric Disability',
  'Developmental Disability',
  'Wheelchair User',
  'Prosthetic User',
  'Amputee',
  'Multiple Sclerosis',
  'Cerebral Palsy',
  'Spinal Cord Injury',
  'Neurological Disorder',
  'Chronic Pain',
  'Missing Limb'
];

// Shared Components
const inputClassName = `
  mt-2 block w-full rounded-xl 
  bg-white dark:bg-gray-800 
  border-2 border-gray-200 dark:border-gray-700
  shadow-sm 
  focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900
  px-4 py-3
  text-sm font-medium
  transition-all duration-200
  placeholder-gray-400 dark:placeholder-gray-500
`.trim();

const InputField = React.memo(({ label, type = "text", value, onChange, placeholder, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={inputClassName}
    />
  </div>
));

const selectableItemClassName = (isSelected) => `
  px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200
  text-sm font-medium text-center
  ${isSelected 
    ? 'bg-blue-500 border-blue-500 text-white shadow-lg transform scale-105' 
    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700'
  }
`.trim();

const MultiSelectField = React.memo(({ label, options, selectedItems, onToggle, className = "" }) => {
  const handleToggle = useCallback((option) => {
    onToggle(option);
  }, [onToggle]);

  return (
    <div className={className}>
      <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">{label}</label>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Select all that apply. Click to toggle selection.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => handleToggle(option)}
            className={selectableItemClassName(selectedItems.includes(option))}
          >
            {option}
          </button>
        ))}
      </div>
      {selectedItems.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            Selected ({selectedItems.length}):
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedItems.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
              >
                {item}
                <button
                  type="button"
                  onClick={() => handleToggle(item)}
                  className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Step Components - Defined outside to prevent recreation
const BasicInformationStep = React.memo(({ basicData, onBasicChange, onNestedChange }) => {
  const handleFullNameChange = useCallback((e) => onBasicChange('fullName', e.target.value), [onBasicChange]);
  const handleDobChange = useCallback((e) => onBasicChange('dob', e.target.value), [onBasicChange]);
  const handleGenderChange = useCallback((val) => onBasicChange('gender', val), [onBasicChange]);
  const handleBloodGroupChange = useCallback((val) => onBasicChange('bloodGroup', val), [onBasicChange]);
  const handleHeightValueChange = useCallback((e) => onNestedChange('basic', 'height', 'value', e.target.value), [onNestedChange]);
  const handleHeightUnitChange = useCallback((e) => onNestedChange('basic', 'height', 'unit', e.target.value), [onNestedChange]);
  const handleWeightValueChange = useCallback((e) => onNestedChange('basic', 'weight', 'value', e.target.value), [onNestedChange]);
  const handleWeightUnitChange = useCallback((e) => onNestedChange('basic', 'weight', 'unit', e.target.value), [onNestedChange]);
  const handleContactChange = useCallback((e) => onBasicChange('contactNumber', e.target.value), [onBasicChange]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <InputField
          label="Full Name"
          value={basicData?.fullName || ''}
          onChange={handleFullNameChange}
          placeholder="Enter your full name"
          className="sm:col-span-2"
        />
        
        <InputField
          label="Date of Birth"
          type="date"
          value={basicData?.dob || ''}
          onChange={handleDobChange}
        />

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Gender</label>
          <Listbox value={basicData?.gender || ''} onChange={handleGenderChange}>
            <div className="relative">
              <Listbox.Button className={`w-full rounded-xl border-2 bg-white dark:bg-gray-800 px-4 py-3 text-left shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm font-medium transition-all duration-200 border-gray-200 dark:border-gray-700`}>
                <span className={basicData?.gender ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                  {genderOptions.find(opt => opt.value === basicData?.gender)?.label || 'Select Gender'}
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-xl">
                {genderOptions.slice(1).map(option => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active, selected }) =>
                      `cursor-pointer select-none px-4 py-3 text-sm font-medium ${
                        active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-white'
                      } ${selected ? 'bg-blue-100 dark:bg-blue-900' : ''}`
                    }
                  >
                    {option.label}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Blood Group</label>
          <Listbox value={basicData?.bloodGroup || ''} onChange={handleBloodGroupChange}>
            <div className="relative">
              <Listbox.Button className={`w-full rounded-xl border-2 bg-white dark:bg-gray-800 px-4 py-3 text-left shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm font-medium transition-all duration-200 border-gray-200 dark:border-gray-700`}>
                <span className={basicData?.bloodGroup ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                  {bloodGroupOptions.find(opt => opt.value === basicData?.bloodGroup)?.label || 'Select Blood Group'}
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-xl">
                {bloodGroupOptions.slice(1).map(option => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active, selected }) =>
                      `cursor-pointer select-none px-4 py-3 text-sm font-medium ${
                        active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-white'
                      } ${selected ? 'bg-blue-100 dark:bg-blue-900' : ''}`
                    }
                  >
                    {option.label}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Height</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={basicData?.height?.value || ''}
              onChange={handleHeightValueChange}
              placeholder="170"
              className={`${inputClassName} flex-1`}
            />
            <select
              value={basicData?.height?.unit || 'cm'}
              onChange={handleHeightUnitChange}
              className="rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium w-20"
            >
              <option value="cm">cm</option>
              <option value="ft">ft</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Weight</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={basicData?.weight?.value || ''}
              onChange={handleWeightValueChange}
              placeholder="70"
              className={`${inputClassName} flex-1`}
            />
            <select
              value={basicData?.weight?.unit || 'kg'}
              onChange={handleWeightUnitChange}
              className="rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium w-20"
            >
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
          </div>
        </div>

        <InputField
          label="Contact Number"
          value={basicData?.contactNumber || ''}
          onChange={handleContactChange}
          placeholder="Enter your phone number"
          className="sm:col-span-2"
        />
      </div>
    </div>
  );
});

const EmergencyContactStep = React.memo(({ basicData, onNestedChange }) => {
  const handleNameChange = useCallback((e) => onNestedChange('basic', 'emergencyContact', 'name', e.target.value), [onNestedChange]);
  const handleNumberChange = useCallback((e) => onNestedChange('basic', 'emergencyContact', 'number', e.target.value), [onNestedChange]);
  const handleRelationChange = useCallback((e) => onNestedChange('basic', 'emergencyContact', 'relation', e.target.value), [onNestedChange]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Name"
          value={basicData?.emergencyContact?.name || ''}
          onChange={handleNameChange}
          placeholder="Emergency contact name"
        />

        <InputField
          label="Phone Number"
          value={basicData?.emergencyContact?.number || ''}
          onChange={handleNumberChange}
          placeholder="Emergency contact phone"
        />

        <InputField
          label="Relation"
          value={basicData?.emergencyContact?.relation || ''}
          onChange={handleRelationChange}
          placeholder="Relationship (e.g., Mother, Father, Spouse)"
          className="md:col-span-2"
        />
      </div>
    </div>
  );
});

const MedicalInformationStep = React.memo(({ medicalData, onMultiSelectToggle, onNestedChange, setProfileData }) => {
  const handleChronicConditionsToggle = useCallback((value) => onMultiSelectToggle('medical', 'chronicConditions', value), [onMultiSelectToggle]);
  const handleAllergiesToggle = useCallback((value) => onMultiSelectToggle('medical', 'allergies', value), [onMultiSelectToggle]);
  const handleMedicationsToggle = useCallback((value) => onMultiSelectToggle('medical', 'currentMedications', value), [onMultiSelectToggle]);
  const handleDisabilitiesToggle = useCallback((value) => onMultiSelectToggle('medical', 'disabilities', value), [onMultiSelectToggle]);
  
  const handleGlassesChange = useCallback((e) => onNestedChange('medical', 'vision', 'wearsGlasses', e.target.checked), [onNestedChange]);
  const handleLeftEyeChange = useCallback((e) => onNestedChange('medical', 'vision', 'leftEye', e.target.value), [onNestedChange]);
  const handleRightEyeChange = useCallback((e) => onNestedChange('medical', 'vision', 'rightEye', e.target.value), [onNestedChange]);
  
  const handleHearingAidsChange = useCallback((e) => {
    setProfileData(prev => ({
      ...prev,
      medical: {
        ...prev.medical,
        hearingAids: e.target.checked
      }
    }));
  }, [setProfileData]);

  return (
    <div className="space-y-8">
      <MultiSelectField
        label="🩺 Chronic Conditions"
        options={chronicConditionsOptions}
        selectedItems={medicalData?.chronicConditions || []}
        onToggle={handleChronicConditionsToggle}
      />

      <MultiSelectField
        label="⚠️ Allergies"
        options={allergiesOptions}
        selectedItems={medicalData?.allergies || []}
        onToggle={handleAllergiesToggle}
      />

      <MultiSelectField
        label="💊 Current Medications"
        options={medicationsOptions}
        selectedItems={medicalData?.currentMedications || []}
        onToggle={handleMedicationsToggle}
      />

      <MultiSelectField
        label="♿ Disabilities"
        options={disabilitiesOptions}
        selectedItems={medicalData?.disabilities || []}
        onToggle={handleDisabilitiesToggle}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BsEyeFill className="text-blue-500" />
            Vision
          </h4>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={medicalData?.vision?.wearsGlasses || false}
              onChange={handleGlassesChange}
              className="w-5 h-5 text-blue-500"
            />
            <span className="text-gray-900 dark:text-white">Wears Glasses</span>
          </label>
          {medicalData?.vision?.wearsGlasses && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <InputField
                label="Left Eye"
                value={medicalData?.vision?.leftEye || ''}
                onChange={handleLeftEyeChange}
                placeholder="e.g., -2.5"
              />
              <InputField
                label="Right Eye"
                value={medicalData?.vision?.rightEye || ''}
                onChange={handleRightEyeChange}
                placeholder="e.g., -3.0"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BsEarFill className="text-blue-500" />
            Hearing
          </h4>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={medicalData?.hearingAids || false}
              onChange={handleHearingAidsChange}
              className="w-5 h-5 text-blue-500"
            />
            <span className="text-gray-900 dark:text-white">Uses Hearing Aids</span>
          </label>
        </div>
      </div>
    </div>
  );
});

const LifestyleStep = React.memo(({ lifestyleData, onMultiSelectToggle }) => {
  const handleHabitsToggle = useCallback((value) => onMultiSelectToggle('lifestyle', 'habits', value), [onMultiSelectToggle]);
  const handlePreferencesToggle = useCallback((value) => onMultiSelectToggle('lifestyle', 'preferences', value), [onMultiSelectToggle]);

  return (
    <div className="space-y-8">
      <MultiSelectField
        label="🏃‍♂️ Your Habits"
        options={habitOptions}
        selectedItems={lifestyleData?.habits || []}
        onToggle={handleHabitsToggle}
      />

      <MultiSelectField
        label="🍽️ Dietary Preferences"
        options={preferenceOptions}
        selectedItems={lifestyleData?.preferences || []}
        onToggle={handlePreferencesToggle}
      />
    </div>
  );
});

function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [profileData, setProfileData] = useState({
    basic: {
      fullName: '',
      dob: '',
      gender: '',
      bloodGroup: '',
      height: { value: '', unit: 'cm' },
      weight: { value: '', unit: 'kg' },
      contactNumber: '',
      emergencyContact: {
        name: '',
        number: '',
        relation: ''
      }
    },
    medical: {
      chronicConditions: [],
      allergies: [],
      currentMedications: [],
      disabilities: [],
      vision: {
        leftEye: '',
        rightEye: '',
        wearsGlasses: false
      },
      hearingAids: false
    },
    lifestyle: {
      habits: [],
      preferences: []
    }
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user?.uid) {
        try {
          const result = await getUserProfile(user.uid);
          if (result.success) {
            setProfileData(prev => ({
              ...prev,
              ...result.data
            }));
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfileData();
  }, [user]);

  const handleBasicChange = useCallback((field, value) => {
    setProfileData(prev => ({
      ...prev,
      basic: {
        ...prev.basic,
        [field]: value
      }
    }));
  }, []);

  const handleNestedChange = useCallback((section, field, nestedField, value) => {
    setProfileData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: {
          ...prev[section][field],
          [nestedField]: value
        }
      }
    }));
  }, []);

  const handleMultiSelectToggle = useCallback((section, field, value) => {
    setProfileData(prev => {
      const currentArray = prev[section][field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      };
    });
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSave = useCallback(async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const result = await editUserProfile(user.uid, profileData);
      if (result.success) {
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          navigate('../view-profile');
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  }, [user?.uid, profileData, navigate]);

  const currentStepComponent = useMemo(() => {
    const { basic, medical, lifestyle } = profileData;
    
    switch (currentStep) {
      case 1:
        return (
          <BasicInformationStep 
            basicData={basic} 
            onBasicChange={handleBasicChange} 
            onNestedChange={handleNestedChange} 
          />
        );
      case 2:
        return (
          <EmergencyContactStep 
            basicData={basic} 
            onNestedChange={handleNestedChange} 
          />
        );
      case 3:
        return (
          <MedicalInformationStep 
            medicalData={medical} 
            onMultiSelectToggle={handleMultiSelectToggle} 
            onNestedChange={handleNestedChange} 
            setProfileData={setProfileData} 
          />
        );
      case 4:
        return (
          <LifestyleStep 
            lifestyleData={lifestyle} 
            onMultiSelectToggle={handleMultiSelectToggle} 
          />
        );
      default:
        return null;
    }
  }, [currentStep, profileData, handleBasicChange, handleNestedChange, handleMultiSelectToggle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, stepIdx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`${
                      currentStep >= step.id
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-800 text-gray-400 shadow-md'
                    } rounded-full border-4 ${
                      currentStep >= step.id ? 'border-blue-200' : 'border-gray-200 dark:border-gray-700'
                    } flex items-center justify-center h-16 w-16 font-bold text-lg transition-all duration-300`}
                  >
                    {currentStep > step.id ? (
                      <span className="text-2xl">✓</span>
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className={`text-sm font-bold ${
                      currentStep >= step.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.name}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 rounded-full ${
                    currentStep > step.id ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                  } transition-all duration-300`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 rounded-3xl p-8 md:p-12">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Edit {steps[currentStep - 1].name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {steps[currentStep - 1].description}
                </p>
              </div>
              <Link
                to="../view-profile"
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl">
              {successMessage}
            </div>
          )}

          {/* Step Content */}
          {currentStepComponent}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8">
            {currentStep > 1 ? (
              <button
                onClick={handlePrev}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                <FaArrowLeft />
                Previous
              </button>
            ) : (
              <div></div>
            )}
            
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Next
                <FaArrowRight />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:transform-none"
              >
                <FaSave />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
