import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { Listbox } from '@headlessui/react';
import { addUserProfile } from '../utils/firestoreService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Progress steps
const steps = [
	{ id: 1, name: 'Basic Information', description: 'Personal and contact details' },
	{ id: 2, name: 'Medical Context', description: 'Your medical history and conditions' },
	{ id: 3, name: 'Lifestyle', description: 'Your habits and preferences' },
];

// Option sets
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
	'Regular Exercise', 'Smoking', 'Drinking Alcohol', 'Meditation', 'Yoga', 'Running/Jogging', 'Swimming', 'Cycling', 'Weight Training', 'Walking', 'Late Night Sleep', 'Early Morning Routine', 'Screen Time (High)', 'Reading', 'Gaming'
];

const preferenceOptions = [
	'Vegetarian','Vegan','Non-Vegetarian','Gluten-Free','Low Sugar','No Dairy','Organic Food','Home Cooked Meals','Fast Food','Spicy Food','Low Sodium','High Protein Diet'
];

const chronicConditionsOptions = [
	'High Blood Pressure','Diabetes Type 1','Diabetes Type 2','Asthma','Heart Disease','Cancer','Stroke','Arthritis','Depression','Anxiety','COPD','Kidney Disease','Liver Disease','Thyroid Disorder','Migraine','Epilepsy','Fibromyalgia','Chronic Fatigue Syndrome','Osteoporosis','Bipolar Disorder','Schizophrenia','Multiple Sclerosis','Parkinson\'s Disease','Alzheimer\'s Disease','IBS','Crohn\'s Disease','Ulcerative Colitis','Celiac Disease','Other'
];

const allergiesOptions = [
	'Penicillin','Sulfa Drugs','NSAIDs','Aspirin','Latex','Peanuts','Tree Nuts','Milk','Eggs','Wheat','Soy','Fish','Shellfish','Pollen','Dust Mites','Pet Dander','Mold','Bee Stings','Contrast Dye','Changing Weather','Other',
];

const medicationsOptions = [
	'Lisinopril','Atorvastatin','Levothyroxine','Metformin','Amlodipine','Metoprolol','Omeprazole','Simvastatin','Losartan','Albuterol','Gabapentin','Hydrochlorothiazide','Sertraline','Acetaminophen','Ibuprofen','Fluoxetine','Amoxicillin','Prednisone','Escitalopram','Tramadol','Furosemide','Antihypertensives','Antidiabetics','Statins','Anticoagulants','Beta Blockers','Antidepressants','Antibiotics','Pain Relievers','Anti-inflammatories','Antihistamines','Inhalers','Thyroid Medications','Vitamins & Supplements','Other'
];

const disabilitiesOptions = [
	'Visual Impairment','Hearing Impairment','Speech Impairment','Physical Disability','Cognitive Disability','Learning Disability','Autism Spectrum Disorder','ADHD','Dyslexia','Mobility Impairment','Chronic Pain','Chronic Fatigue','Mental Health Condition','Memory Impairment','Other'
];

// Shared UI helpers (consistent mobile-friendly + opaque backgrounds)
const inputClassName = (error) => `
	mt-2 block w-full rounded-xl px-3 py-3 text-sm font-medium placeholder-secondary
	bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 text-text
	focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 shadow-sm
	transition-all duration-150
	${error ? 'border-red-500 focus:ring-red-400 focus:border-red-500' : ''}
`.replace(/\s+/g,' ').trim();

const selectableItemClassName = (isSelected) => `
	px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 text-xs sm:text-sm font-medium text-center
	${isSelected ? 'bg-primary text-white shadow-md' : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 text-text hover:border-primary/50'}
`.replace(/\s+/g,' ').trim();

const selectClassName = (error) => `
	mt-2 block w-full rounded-xl px-3 py-3 text-sm text-left
	bg-white dark:bg-neutral-900 border border-primary/30 dark:border-primary/30
	focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 shadow-[0_0_0_1px_var(--color-primary)]
	transition-all duration-150 text-text
	${error ? 'border-red-500 focus:ring-red-400 focus:border-red-500 shadow-none' : ''}
`.replace(/\s+/g,' ').trim();

// Compact select (for units) matching input height
const compactUnitSelectClass = `
	mt-2 rounded-xl px-3 py-3 text-sm font-medium
	bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10
	focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 shadow-sm
	transition-all duration-150
	h-[46px] leading-none min-w-[70px] text-text
`.replace(/\s+/g,' ').trim();

// Themed Listbox (dropdown) styling (solid background + brand accents)
const listboxMenuClass = `absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-xl
 bg-white dark:bg-neutral-900 border border-primary/40 dark:border-primary/40 shadow-xl ring-1 ring-primary/10 dark:ring-primary/20`;
const listboxOptionClass = (active, selected) => `cursor-pointer select-none px-4 py-2.5 text-sm transition-all duration-150 rounded-lg
	${selected ? 'bg-primary text-white font-semibold shadow-md' : active ? 'bg-primary/10 dark:bg-primary/20 text-text' : 'text-text'}`;

function Onboarding() {
	const navigate = useNavigate();
	const { user, userProfile, refreshUserProfile, loading: authLoading } = useAuth();
	const [currentStep, setCurrentStep] = useState(1);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState({});
	const [showSuccess, setShowSuccess] = useState(false);

	const [formData, setFormData] = useState({
		basic: {
			fullName: '', dob: '', gender: '', bloodGroup: '',
			height: { value: '', unit: 'cm' }, weight: { value: '', unit: 'kg' },
			contactNumber: '', emergencyContact: { name: '', number: '', relation: '' }
		},
		medical: {
			chronicConditions: [], allergies: [], currentMedications: [], disabilities: [],
			customChronicCondition: '', customAllergy: '', customMedication: '', customDisability: '',
			vision: { leftEye: '', rightEye: '', wearsGlasses: false }, hearingAids: false
		},
		lifestyle: { habits: [], preferences: [] },
		onboardingCompleted: false,
	});

	useEffect(() => {
		// Only redirect if userProfile is loaded and onboarding is completed
		if (userProfile && userProfile.onboardingCompleted === true && !showSuccess) {
			navigate('/user');
		}
	}, [userProfile, navigate, showSuccess]);

	// Show loading while auth is loading
	if (authLoading) {
		return (
			<div className="min-h-screen bg-background aurora-bg flex items-center justify-center">
				<div className="text-center">
					<div className="text-primary text-lg">Loading...</div>
				</div>
			</div>
		);
	}

	// Success Screen Component
	const SuccessScreen = () => (
		<div className="min-h-screen bg-background aurora-bg flex items-center justify-center px-3 sm:px-6 py-6">
			<div className="max-w-md mx-auto text-center">
				<div className="glass-elevated rounded-3xl p-8 border soft-divider">
					{/* Success Animation */}
					<div className="mb-6 relative">
						<div className="w-24 h-24 mx-auto rounded-full bg-green-500 flex items-center justify-center shadow-xl">
							<svg className="w-12 h-12 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						{/* Celebration sparkles */}
						<div className="absolute -top-2 -right-2 text-yellow-400 text-2xl animate-bounce">*</div>
						<div className="absolute -bottom-2 -left-2 text-yellow-400 text-xl animate-bounce" style={{ animationDelay: '0.5s' }}>*</div>
						<div className="absolute top-4 -left-4 text-yellow-400 text-lg animate-bounce" style={{ animationDelay: '1s' }}>*</div>
					</div>

					{/* Success Message */}
					<h1 className="text-3xl font-bold text-text mb-3">Welcome to VitalLink!</h1>
					<p className="text-secondary text-lg mb-6">
						Your health profile has been created successfully. You're all set to start managing your health records securely.
					</p>

					{/* Features Preview */}
					<div className="space-y-3 mb-8">
						<div className="flex items-center gap-3 text-sm text-text">
							<div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
								<span className="text-primary">✓</span>
							</div>
							<span>Health profile created</span>
						</div>
						<div className="flex items-center gap-3 text-sm text-text">
							<div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
								<span className="text-primary">✓</span>
							</div>
							<span>Medical history saved</span>
						</div>
						<div className="flex items-center gap-3 text-sm text-text">
							<div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
								<span className="text-primary">✓</span>
							</div>
							<span>Ready to share with doctors</span>
						</div>
					</div>

					{/* Action Button */}
					<button
						onClick={() => {
							setShowSuccess(false);
							navigate('/user');
						}}
						className="glass-cta px-8 py-3 rounded-xl font-semibold w-full hover:scale-105 transition-transform duration-200"
					>
						Go to Dashboard
					</button>
				</div>
			</div>
		</div>
	);

	// Show success screen if onboarding is completed
	if (showSuccess) {
		return <SuccessScreen />;
	}

	// Handlers
	const handleBasicInfoChange = (e) => {
		const { name, value } = e.target;
		if (name.includes('.')) {
			const [parent, child] = name.split('.');
			setFormData((prev) => ({ ...prev, basic: { ...prev.basic, [parent]: { ...prev.basic[parent], [child]: value } } }));
		} else {
			setFormData((prev) => ({ ...prev, basic: { ...prev.basic, [name]: value } }));
		}
	};

	const handleArrayFieldChange = (section, field, value) => {
		setFormData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
	};

	const handleCustomInputChange = (section, field, value) => {
		setFormData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
	};

	const handleLifestyleChange = (field, value) => {
		setFormData((prev) => ({ ...prev, lifestyle: { ...prev.lifestyle, [field]: value } }));
	};

	const handleVisionChange = (field, value) => {
		setFormData((prev) => ({ 
			...prev, 
			medical: { 
				...prev.medical, 
				vision: { ...prev.medical.vision, [field]: value } 
			} 
		}));
	};

	const handleHearingAidsChange = (value) => {
		setFormData((prev) => ({ 
			...prev, 
			medical: { 
				...prev.medical, 
				hearingAids: value 
			} 
		}));
	};

	// Validation
	const validateBasicInfo = () => {
		const newErrors = {};
		const { basic } = formData;
		if (!basic.fullName) newErrors.fullName = 'Full name is required';
		if (!basic.dob) newErrors.dob = 'Date of birth is required';
		if (!basic.gender) newErrors.gender = 'Gender is required';
		if (!basic.bloodGroup) newErrors.bloodGroup = 'Blood group is required';
		if (!basic.height.value) newErrors.height = 'Height is required';
		if (!basic.weight.value) newErrors.weight = 'Weight is required';
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};
	
	const validateMedicalInfo = () => {
		const newErrors = {};
		const { medical } = formData;
		
		// Check if "Other" is selected for chronic conditions but no custom input provided
		if (medical.chronicConditions.includes('Other') && !medical.customChronicCondition.trim()) {
			newErrors.customChronicCondition = 'Please specify your chronic condition';
		}
		
		// Check if "Other" is selected for allergies but no custom input provided
		if (medical.allergies.includes('Other') && !medical.customAllergy.trim()) {
			newErrors.customAllergy = 'Please specify your allergy';
		}
		
		// Check if "Other" is selected for medications but no custom input provided
		if (medical.currentMedications.includes('Other') && !medical.customMedication.trim()) {
			newErrors.customMedication = 'Please specify your medication';
		}
		
		// Check if "Other" is selected for disabilities but no custom input provided
		if (medical.disabilities.includes('Other') && !medical.customDisability.trim()) {
			newErrors.customDisability = 'Please specify your disability';
		}
		
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};
	
	const validateLifestyleInfo = () => { setErrors({}); return true; };

	// Next step + save
	const handleNext = async () => {
		if (currentStep === 1 && !validateBasicInfo()) return;
		if (currentStep === 2 && !validateMedicalInfo()) return;
		if (currentStep === 3 && !validateLifestyleInfo()) return;

		try {
			setLoading(true);
			
		// Save profile data to userProfile collection
		const profilePayload =
			currentStep === 1 ? { basic: formData.basic } :
			currentStep === 2 ? {
				medical: {
					...formData.medical,
					// Add custom conditions/allergies to arrays if they exist
					chronicConditions: formData.medical.customChronicCondition
						? [...formData.medical.chronicConditions.filter(c => c !== 'Other'), formData.medical.customChronicCondition]
						: formData.medical.chronicConditions.filter(c => c !== 'Other'),
					allergies: formData.medical.customAllergy
						? [...formData.medical.allergies.filter(a => a !== 'Other'), formData.medical.customAllergy]
						: formData.medical.allergies.filter(a => a !== 'Other'),
					currentMedications: formData.medical.customMedication
						? [...formData.medical.currentMedications.filter(m => m !== 'Other'), formData.medical.customMedication]
						: formData.medical.currentMedications.filter(m => m !== 'Other'),
					disabilities: formData.medical.customDisability
						? [...formData.medical.disabilities.filter(d => d !== 'Other'), formData.medical.customDisability]
						: formData.medical.disabilities.filter(d => d !== 'Other')
				}
			} :
			currentStep === 3 ? { lifestyle: formData.lifestyle } : {};

			if (user?.uid && Object.keys(profilePayload).length > 0) {
				const res = await addUserProfile(user.uid, profilePayload);
				if (!res.success) throw new Error(res.error || 'Failed to save profile');
			}

			// For step 1, also update onboardingCompleted status in users collection
			if (currentStep === 1 && user?.uid) {
				const userDocRef = doc(db, "users", user.uid);
				await updateDoc(userDocRef, { onboardingCompleted: true });
			}

			if (currentStep === 3) {
				// Show success screen first
				setShowSuccess(true);
				// Refresh user profile in background
				await refreshUserProfile();
				return;
			}
			setCurrentStep((prev) => prev + 1);
		} catch (error) {
			console.error('Error saving data:', error);
			setErrors({ submit: error.message });
		} finally {
			setLoading(false);
		}
	};

	// Step renderers
	const renderStepContent = () => {
		switch (currentStep) {
			case 1:
				return (
					<div className="space-y-8">
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<div className="sm:col-span-2">
								<label className="block text-sm font-semibold text-text mb-1">Full Name *</label>
								<input type="text" name="fullName" value={formData.basic.fullName} onChange={handleBasicInfoChange} placeholder="Enter your full name" className={inputClassName(errors.fullName)} />
								{errors.fullName && <p className="mt-2 text-sm text-red-500">{errors.fullName}</p>}
							</div>

							<div>
								<label className="block text-sm font-semibold text-text mb-1">Date of Birth *</label>
								<input type="date" name="dob" value={formData.basic.dob} onChange={handleBasicInfoChange} className={inputClassName(errors.dob)} />
								{errors.dob && <p className="mt-2 text-sm text-red-500">{errors.dob}</p>}
							</div>

							<div>
								<label className="block text-sm font-semibold text-text mb-1">Gender *</label>
								<Listbox value={formData.basic.gender} onChange={(val) => handleBasicInfoChange({ target: { name: 'gender', value: val } })}>
									<div className="relative">
										<Listbox.Button className={selectClassName(errors.gender)}>
											<span className={formData.basic.gender ? 'text-text' : 'text-secondary'}>
												{genderOptions.find((opt) => opt.value === formData.basic.gender)?.label || 'Select Gender'}
											</span>
										</Listbox.Button>
										<Listbox.Options className={listboxMenuClass}>
											{genderOptions.slice(1).map((option) => (
												<Listbox.Option key={option.value} value={option.value} className={({ active, selected }) => listboxOptionClass(active, selected)}>
													{option.label}
												</Listbox.Option>
											))}
										</Listbox.Options>
									</div>
								</Listbox>
								{errors.gender && <p className="mt-2 text-sm text-red-500">{errors.gender}</p>}
							</div>

							<div>
								<label className="block text-sm font-semibold text-text mb-1">Blood Group *</label>
								<Listbox value={formData.basic.bloodGroup} onChange={(val) => handleBasicInfoChange({ target: { name: 'bloodGroup', value: val } })}>
									<div className="relative">
										<Listbox.Button className={selectClassName(errors.bloodGroup)}>
											<span className={formData.basic.bloodGroup ? 'text-text' : 'text-secondary'}>
												{bloodGroupOptions.find((opt) => opt.value === formData.basic.bloodGroup)?.label || 'Select Blood Group'}
											</span>
										</Listbox.Button>
										<Listbox.Options className={listboxMenuClass}>
											{bloodGroupOptions.slice(1).map((option) => (
												<Listbox.Option key={option.value} value={option.value} className={({ active, selected }) => listboxOptionClass(active, selected)}>
													{option.label}
												</Listbox.Option>
											))}
										</Listbox.Options>
									</div>
								</Listbox>
								{errors.bloodGroup && <p className="mt-2 text-sm text-red-500">{errors.bloodGroup}</p>}
							</div>

							<div>
								<label className="block text-sm font-semibold text-text mb-1">Height *</label>
								<div className="flex gap-2">
									<input type="number" name="height.value" value={formData.basic.height.value} onChange={handleBasicInfoChange} placeholder="165" className={`${inputClassName(errors.height)} flex-1`} />
									<select name="height.unit" value={formData.basic.height.unit} onChange={handleBasicInfoChange} className={compactUnitSelectClass}>
										<option value="cm">cm</option>
										<option value="ft">ft</option>
									</select>
								</div>
								{errors.height && <p className="mt-2 text-sm text-red-500">{errors.height}</p>}
							</div>

							<div>
								<label className="block text-sm font-semibold text-text mb-1">Weight *</label>
								<div className="flex gap-2">
									<input type="number" name="weight.value" value={formData.basic.weight.value} onChange={handleBasicInfoChange} placeholder="70" className={`${inputClassName(errors.weight)} flex-1`} />
									<select name="weight.unit" value={formData.basic.weight.unit} onChange={handleBasicInfoChange} className={compactUnitSelectClass}>
										<option value="kg">kg</option>
										<option value="lbs">lbs</option>
									</select>
								</div>
								{errors.weight && <p className="mt-2 text-sm text-red-500">{errors.weight}</p>}
							</div>
						</div>

						{errors.submit && (
							<div className="glass rounded-xl p-4 border border-red-500/40">
								<p className="text-sm text-red-500">{errors.submit}</p>
							</div>
						)}

						<div className="flex justify-end pt-4">
							<button type="button" onClick={handleNext} disabled={loading} className="glass-cta px-6 py-3 rounded-xl disabled:opacity-50">
								{loading ? 'Saving...' : 'Next Step'}
							</button>
						</div>
					</div>
				);

			case 2:
				return (
					<div className="space-y-8">
						{/* Chronic Conditions */}
						<div>
							<label className="block text-lg font-bold text-text mb-3">Chronic Conditions</label>
							<Listbox value={formData.medical.chronicConditions} onChange={(selected) => handleArrayFieldChange('medical','chronicConditions', selected)} multiple>
								<div className="relative">
									<Listbox.Button className={selectClassName(false)}>
										<span className={formData.medical.chronicConditions.length ? 'text-text' : 'text-secondary'}>
											{formData.medical.chronicConditions.length ? formData.medical.chronicConditions.join(', ') : 'Select chronic conditions'}
										</span>
									</Listbox.Button>
									<Listbox.Options className={listboxMenuClass}>
										{chronicConditionsOptions.map((item) => (
											<Listbox.Option key={item} value={item} className={({ active, selected }) => listboxOptionClass(active, selected)}>
												{item}
											</Listbox.Option>
										))}
									</Listbox.Options>
								</div>
							</Listbox>
							{formData.medical.chronicConditions.includes('Other') && (
								<div className="mt-3">
									<input 
										type="text" 
										placeholder="Please specify your condition" 
										value={formData.medical.customChronicCondition}
										onChange={(e) => handleCustomInputChange('medical', 'customChronicCondition', e.target.value)}
										className={inputClassName(errors.customChronicCondition)}
									/>
									{errors.customChronicCondition && <p className="mt-2 text-sm text-red-500">{errors.customChronicCondition}</p>}
								</div>
							)}
							{formData.medical.chronicConditions.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-3">
									{formData.medical.chronicConditions.map((cond, idx) => (
										<span key={idx} className="px-3 py-1.5 rounded-lg text-xs glass border soft-divider">
											{cond === 'Other' && formData.medical.customChronicCondition 
												? formData.medical.customChronicCondition 
												: cond}
										</span>
									))}
								</div>
							)}
						</div>

						{/* Allergies */}
						<div>
							<label className="block text-lg font-bold text-text mb-3">Allergies</label>
							<Listbox value={formData.medical.allergies} onChange={(selected) => handleArrayFieldChange('medical','allergies', selected)} multiple>
								<div className="relative">
									<Listbox.Button className={selectClassName(false)}>
										<span className={formData.medical.allergies.length ? 'text-text' : 'text-secondary'}>
											{formData.medical.allergies.length ? formData.medical.allergies.join(', ') : 'Select allergies'}
										</span>
									</Listbox.Button>
									<Listbox.Options className={listboxMenuClass}>
										{allergiesOptions.map((item) => (
											<Listbox.Option key={item} value={item} className={({ active, selected }) => listboxOptionClass(active, selected)}>
												{item}
											</Listbox.Option>
										))}
									</Listbox.Options>
								</div>
							</Listbox>
							{formData.medical.allergies.includes('Other') && (
								<div className="mt-3">
									<input 
										type="text" 
										placeholder="Please specify your allergy" 
										value={formData.medical.customAllergy}
										onChange={(e) => handleCustomInputChange('medical', 'customAllergy', e.target.value)}
										className={inputClassName(errors.customAllergy)}
									/>
									{errors.customAllergy && <p className="mt-2 text-sm text-red-500">{errors.customAllergy}</p>}
								</div>
							)}
							{formData.medical.allergies.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-3">
									{formData.medical.allergies.map((alg, idx) => (
										<span key={idx} className="px-3 py-1.5 rounded-lg text-xs glass border soft-divider">
											{alg === 'Other' && formData.medical.customAllergy 
												? formData.medical.customAllergy 
												: alg}
										</span>
									))}
								</div>
							)}
						</div>

						{/* Medications */}
						<div>
							<label className="block text-lg font-bold text-text mb-3">Current Medications</label>
							<Listbox value={formData.medical.currentMedications} onChange={(selected) => handleArrayFieldChange('medical','currentMedications', selected)} multiple>
								<div className="relative">
									<Listbox.Button className={selectClassName(false)}>
										<span className={formData.medical.currentMedications.length ? 'text-text' : 'text-secondary'}>
											{formData.medical.currentMedications.length ? formData.medical.currentMedications.join(', ') : 'Select medications'}
										</span>
									</Listbox.Button>
									<Listbox.Options className={listboxMenuClass}>
										{medicationsOptions.map((item) => (
											<Listbox.Option key={item} value={item} className={({ active, selected }) => listboxOptionClass(active, selected)}>
												{item}
											</Listbox.Option>
										))}
									</Listbox.Options>
								</div>
							</Listbox>
							{formData.medical.currentMedications.includes('Other') && (
								<div className="mt-3">
									<input 
										type="text" 
										placeholder="Please specify your medication" 
										value={formData.medical.customMedication}
										onChange={(e) => handleCustomInputChange('medical', 'customMedication', e.target.value)}
										className={inputClassName(errors.customMedication)}
									/>
									{errors.customMedication && <p className="mt-2 text-sm text-red-500">{errors.customMedication}</p>}
								</div>
							)}
							{formData.medical.currentMedications.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-3">
									{formData.medical.currentMedications.map((med, idx) => (
										<span key={idx} className="px-3 py-1.5 rounded-lg text-xs glass border soft-divider">
											{med === 'Other' && formData.medical.customMedication 
												? formData.medical.customMedication 
												: med}
										</span>
									))}
								</div>
							)}
						</div>

						{/* Disabilities */}
						<div>
							<label className="block text-lg font-bold text-text mb-3">Disabilities or Accessibility Needs</label>
							<Listbox value={formData.medical.disabilities} onChange={(selected) => handleArrayFieldChange('medical','disabilities', selected)} multiple>
								<div className="relative">
									<Listbox.Button className={selectClassName(false)}>
										<span className={formData.medical.disabilities.length ? 'text-text' : 'text-secondary'}>
											{formData.medical.disabilities.length ? formData.medical.disabilities.join(', ') : 'Select disabilities or accessibility needs'}
										</span>
									</Listbox.Button>
									<Listbox.Options className={listboxMenuClass}>
										{disabilitiesOptions.map((item) => (
											<Listbox.Option key={item} value={item} className={({ active, selected }) => listboxOptionClass(active, selected)}>
												{item}
											</Listbox.Option>
										))}
									</Listbox.Options>
								</div>
							</Listbox>
							{formData.medical.disabilities.includes('Other') && (
								<div className="mt-3">
									<input 
										type="text" 
										placeholder="Please specify your disability or accessibility need" 
										value={formData.medical.customDisability}
										onChange={(e) => handleCustomInputChange('medical', 'customDisability', e.target.value)}
										className={inputClassName(errors.customDisability)}
									/>
									{errors.customDisability && <p className="mt-2 text-sm text-red-500">{errors.customDisability}</p>}
								</div>
							)}
							{formData.medical.disabilities.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-3">
									{formData.medical.disabilities.map((disability, idx) => (
										<span key={idx} className="px-3 py-1.5 rounded-lg text-xs glass border soft-divider">
											{disability === 'Other' && formData.medical.customDisability 
												? formData.medical.customDisability 
												: disability}
										</span>
									))}
								</div>
							)}
						</div>

						{/* Vision & Hearing */}
						<div>
							<label className="block text-lg font-bold text-text mb-3">Vision & Hearing</label>
							
							{/* Glasses Section */}
							<div className="space-y-4">
								<div className="flex items-center gap-4">
									<span className="text-sm font-medium text-text">Do you wear glasses?</span>
									<div className="flex gap-3">
										<button
											type="button"
											onClick={() => handleVisionChange('wearsGlasses', true)}
											className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
												formData.medical.vision.wearsGlasses 
													? 'bg-primary text-white shadow-md' 
													: 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 text-text hover:border-primary/50'
											}`}
										>
											Yes
										</button>
										<button
											type="button"
											onClick={() => handleVisionChange('wearsGlasses', false)}
											className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
												!formData.medical.vision.wearsGlasses 
													? 'bg-primary text-white shadow-md' 
													: 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 text-text hover:border-primary/50'
											}`}
										>
											No
										</button>
									</div>
								</div>

								{/* Eye Power Fields - Only show if wears glasses */}
								{formData.medical.vision.wearsGlasses && (
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-text mb-1">Left Eye Power</label>
											<input
												type="text"
												placeholder="e.g., -2.5"
												value={formData.medical.vision.leftEye}
												onChange={(e) => handleVisionChange('leftEye', e.target.value)}
												className={inputClassName(false)}
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-text mb-1">Right Eye Power</label>
											<input
												type="text"
												placeholder="e.g., -1.5"
												value={formData.medical.vision.rightEye}
												onChange={(e) => handleVisionChange('rightEye', e.target.value)}
												className={inputClassName(false)}
											/>
										</div>
									</div>
								)}

								{/* Hearing Aids Section */}
								<div className="flex items-center gap-4 pt-2">
									<span className="text-sm font-medium text-text">Do you use hearing aids?</span>
									<div className="flex gap-3">
										<button
											type="button"
											onClick={() => handleHearingAidsChange(true)}
											className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
												formData.medical.hearingAids 
													? 'bg-primary text-white shadow-md' 
													: 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 text-text hover:border-primary/50'
											}`}
										>
											Yes
										</button>
										<button
											type="button"
											onClick={() => handleHearingAidsChange(false)}
											className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
												!formData.medical.hearingAids 
													? 'bg-primary text-white shadow-md' 
													: 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 text-text hover:border-primary/50'
											}`}
										>
											No
										</button>
									</div>
								</div>
							</div>
						</div>

						{errors.submit && <div className="glass rounded-xl p-4 border border-red-500/40 text-sm text-red-500">{errors.submit}</div>}

						<div className="flex justify-between pt-4">
							<button type="button" onClick={() => setCurrentStep((s) => s - 1)} className="glass rounded-xl px-5 py-3 text-text border soft-divider">Back</button>
							<button type="button" onClick={handleNext} disabled={loading} className="glass-cta px-6 py-3 rounded-xl disabled:opacity-50">{loading ? 'Saving...' : 'Next Step'}</button>
						</div>
					</div>
				);

			case 3:
				return (
					<div className="space-y-8">
						<div>
							<label className="block text-lg font-bold text-text mb-3">Your Habits</label>
							<p className="text-sm text-secondary mb-4">Select all that apply</p>
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
								{habitOptions.map((habit) => {
									const selected = formData.lifestyle.habits.includes(habit);
									return (
										<button key={habit} type="button" onClick={() => {
											const cur = formData.lifestyle.habits;
											handleLifestyleChange('habits', selected ? cur.filter((h) => h !== habit) : [...cur, habit]);
										}} className={selectableItemClassName(selected)}>
											{habit}
										</button>
									);
								})}
							</div>
						</div>

						<div>
							<label className="block text-lg font-bold text-text mb-3">Dietary Preferences</label>
							<p className="text-sm text-secondary mb-4">Select your dietary preferences and restrictions</p>
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
								{preferenceOptions.map((pref) => {
									const selected = formData.lifestyle.preferences.includes(pref);
									return (
										<button key={pref} type="button" onClick={() => {
											const cur = formData.lifestyle.preferences;
											handleLifestyleChange('preferences', selected ? cur.filter((p) => p !== pref) : [...cur, pref]);
										}} className={selectableItemClassName(selected)}>
											{pref}
										</button>
									);
								})}
							</div>
						</div>

						{errors.submit && <div className="glass rounded-xl p-4 border border-red-500/40 text-sm text-red-500">{errors.submit}</div>}

						<div className="flex justify-between pt-4">
							<button type="button" onClick={() => setCurrentStep((s) => s - 1)} className="glass rounded-xl px-5 py-3 text-text border soft-divider">Back</button>
							<button type="button" onClick={handleNext} disabled={loading} className="glass-cta px-6 py-3 rounded-xl disabled:opacity-50">{loading ? 'Saving...' : 'Finish'}</button>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div className="min-h-screen bg-background aurora-bg px-3 sm:px-6 py-6 sm:py-8">
			<div className="max-w-5xl mx-auto">
				{/* Progress Steps */}
				<div className="mb-8 sm:mb-10">
					<div className="glass rounded-2xl p-4 sm:p-6 border soft-divider">
						<div className="flex items-center justify-between gap-2">
							{steps.map((step, stepIdx) => (
								<div key={step.id} className="flex items-center flex-1 min-w-0">
									<div className="flex flex-col items-center w-full">
										<div className={`rounded-full h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center font-bold text-base sm:text-lg shadow-lg ${currentStep >= step.id ? 'bg-blue-500 text-white' : 'glass border soft-divider text-secondary'}`}>
											{currentStep > step.id ? <span className="text-xl">✓</span> : <span>{step.id}</span>}
										</div>
										<div className="mt-2 text-center min-w-0">
											<h3 className={`text-[11px] sm:text-sm font-bold truncate ${currentStep >= step.id ? 'text-text' : 'text-secondary'}`}>{step.name}</h3>
											<p className="hidden sm:block text-xs text-secondary mt-1">{step.description}</p>
										</div>
									</div>
									{stepIdx !== steps.length - 1 && (
										<div className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full ${currentStep > step.id ? 'bg-primary/60' : 'bg-white/20 dark:bg-black/20'}`} />
									)}
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Form Card */}
				<div className="glass-elevated rounded-3xl p-5 sm:p-8 border soft-divider">
					<div className="mb-6 sm:mb-8">
						<h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">{steps[currentStep - 1].name}</h1>
						<p className="text-secondary">{steps[currentStep - 1].description}</p>
					</div>
					{renderStepContent()}
				</div>
			</div>
		</div>
	);
}

export default Onboarding;