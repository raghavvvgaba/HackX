import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaUserCircle, FaHeart, FaRunning, FaUtensils, FaSave, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { GiBodyHeight } from 'react-icons/gi';
import { MdBloodtype, MdSick, MdPhone, MdCalendarToday, MdAccessibility } from 'react-icons/md';
import { BsCapsulePill, BsEyeFill, BsEarFill } from 'react-icons/bs';
import { AiOutlineWarning } from 'react-icons/ai';
import { Link, useNavigate } from 'react-router-dom';
import { Listbox } from '@headlessui/react';
import { getUserProfile, editUserProfile } from '../../utils/firestoreService';
import { useAuth } from '../../context/authContext';

// Steps ---------------------------------------------------------------------
const steps = [
  { id: 1, name: 'Basic Information', description: 'Personal and contact details' },
  { id: 2, name: 'Emergency Contact', description: 'Emergency contact information' },
  { id: 3, name: 'Medical Information', description: 'Your medical history and conditions' },
  { id: 4, name: 'Lifestyle', description: 'Your habits and preferences' },
];

// Options -------------------------------------------------------------------
const genderOptions = [
  { value: '', label: 'Select Gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];
const bloodGroupOptions = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const habitOptions = ['Regular Exercise','Smoking','Drinking Alcohol','Meditation','Yoga','Running/Jogging','Swimming','Cycling','Weight Training','Walking','Late Night Sleep','Early Morning Routine','Screen Time (High)','Reading','Gaming'];
const preferenceOptions = ['Vegetarian','Vegan','Non-Vegetarian','Gluten-Free','Low Sugar','No Dairy','Organic Food','Home Cooked Meals','Fast Food','Spicy Food','Low Sodium','High Protein Diet'];
const chronicConditionsOptions = ['High Blood Pressure','Diabetes Type 1','Diabetes Type 2','Asthma','Heart Disease','Cancer','Stroke','Arthritis','Depression','Anxiety','COPD','Kidney Disease','Liver Disease','Thyroid Disorder','Migraine','Epilepsy','Fibromyalgia','Chronic Fatigue Syndrome','Osteoporosis','Bipolar Disorder','Schizophrenia','Multiple Sclerosis','Parkinson\'s Disease','Alzheimer\'s Disease','IBS','Crohn\'s Disease','Ulcerative Colitis','Celiac Disease'];
const allergiesOptions = ['Penicillin','Sulfa Drugs','NSAIDs','Aspirin','Latex','Peanuts','Tree Nuts','Milk','Eggs','Wheat','Soy','Fish','Shellfish','Pollen','Dust Mites','Pet Dander','Mold','Bee Stings','Contrast Dye'];
const medicationsOptions = ['Lisinopril','Atorvastatin','Levothyroxine','Metformin','Amlodipine','Metoprolol','Omeprazole','Simvastatin','Losartan','Albuterol','Gabapentin','Hydrochlorothiazide','Sertraline','Acetaminophen','Ibuprofen','Fluoxetine','Amoxicillin','Prednisone','Escitalopram','Tramadol','Furosemide','Antihypertensives','Antidiabetics','Statins','Anticoagulants','Beta Blockers','Antidepressants','Antibiotics','Pain Relievers','Anti-inflammatories','Antihistamines','Inhalers','Thyroid Medications','Vitamins & Supplements'];
const disabilitiesOptions = ['Mobility Impairment','Visual Impairment','Hearing Impairment','Speech Impairment','Cognitive Disability','Intellectual Disability','Learning Disability','Neurological Disability','Psychiatric Disability','Developmental Disability','Wheelchair User','Prosthetic User','Amputee','Multiple Sclerosis','Cerebral Palsy','Spinal Cord Injury','Neurological Disorder','Chronic Pain','Missing Limb'];

// Shared styling helpers (glass theme) --------------------------------------
const inputClass = `w-full rounded-xl glass border soft-divider px-4 py-3 text-sm font-medium text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all`;
const selectButtonClass = `w-full rounded-xl glass border soft-divider px-4 py-3 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40`;
const listboxOptionClass = (active, selected) => `cursor-pointer select-none px-4 py-3 text-sm rounded-lg mx-1 my-0.5 ${active ? 'bg-white/10' : ''} ${selected ? 'text-primary font-semibold' : 'text-text'}`;
const multiselectChip = (selected) => `px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all border soft-divider ${selected ? 'glass-cta text-white shadow-lg scale-[1.02]' : 'glass text-text hover-glow-primary'}`;

// Components -----------------------------------------------------------------
const InputField = React.memo(({ label, type = 'text', value, onChange, placeholder, className = '' }) => (
  <div className={className}>
    <label className="block text-xs font-semibold uppercase tracking-wide text-secondary mb-1">{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={inputClass} />
  </div>
));

const MultiSelectField = React.memo(({ label, options, selectedItems, onToggle, helper }) => (
  <div className="space-y-3">
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-text">{label}</label>
        {selectedItems.length > 0 && <span className="text-[11px] glass px-2 py-0.5 rounded-full border soft-divider text-secondary">{selectedItems.length} selected</span>}
      </div>
      {helper && <p className="text-xs text-secondary mt-1">{helper}</p>}
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
      {options.map(opt => {
        const sel = selectedItems.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => onToggle(opt)} className={multiselectChip(sel)}>
            {opt}
          </button>
        );
      })}
    </div>
  </div>
));

// Steps ---------------------------------------------------------------------
const BasicInformationStep = React.memo(({ basicData, onBasicChange, onNestedChange }) => {
  const h = (field, v) => onBasicChange(field, v.target ? v.target.value : v);
  const hn = (parent, field) => (e) => onNestedChange('basic', parent, field, e.target.value);
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <InputField label="Full Name" value={basicData.fullName} onChange={(e)=>h('fullName',e)} placeholder="Enter your full name" className="sm:col-span-2" />
        <InputField label="Date of Birth" type="date" value={basicData.dob} onChange={(e)=>h('dob',e)} />
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-secondary mb-1">Gender</label>
          <Listbox value={basicData.gender} onChange={(val)=>h('gender',val)}>
            <div className="relative">
              <Listbox.Button className={selectButtonClass}>
                <span className={basicData.gender ? 'text-text' : 'text-secondary'}>
                  {genderOptions.find(g=>g.value===basicData.gender)?.label || 'Select Gender'}
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl glass-elevated border soft-divider shadow-xl p-1">
                {genderOptions.slice(1).map(opt => (
                  <Listbox.Option key={opt.value} value={opt.value} className={({active,selected})=>listboxOptionClass(active,selected)}>
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-secondary mb-1">Blood Group</label>
          <Listbox value={basicData.bloodGroup} onChange={(val)=>h('bloodGroup',val)}>
            <div className="relative">
              <Listbox.Button className={selectButtonClass}>
                <span className={basicData.bloodGroup ? 'text-text' : 'text-secondary'}>
                  {basicData.bloodGroup || 'Select Blood Group'}
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl glass-elevated border soft-divider shadow-xl p-1">
                {bloodGroupOptions.map(opt => (
                  <Listbox.Option key={opt} value={opt} className={({active,selected})=>listboxOptionClass(active,selected)}>
                    {opt}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-secondary mb-1">Height</label>
          <div className="flex gap-2">
            <input type="number" value={basicData.height.value} onChange={hn('height','value')} placeholder="170" className={`${inputClass} flex-1`} />
            <select value={basicData.height.unit} onChange={hn('height','unit')} className="glass border soft-divider rounded-xl px-3 py-3 text-sm font-medium w-20">
              <option value="cm">cm</option><option value="ft">ft</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-secondary mb-1">Weight</label>
          <div className="flex gap-2">
            <input type="number" value={basicData.weight.value} onChange={hn('weight','value')} placeholder="70" className={`${inputClass} flex-1`} />
            <select value={basicData.weight.unit} onChange={hn('weight','unit')} className="glass border soft-divider rounded-xl px-3 py-3 text-sm font-medium w-20">
              <option value="kg">kg</option><option value="lbs">lbs</option>
            </select>
          </div>
        </div>
        <InputField label="Contact Number" value={basicData.contactNumber} onChange={(e)=>h('contactNumber',e)} placeholder="Enter your phone number" className="sm:col-span-2" />
      </div>
    </div>
  );
});

const EmergencyContactStep = React.memo(({ basicData, onNestedChange }) => {
  const h = (field) => (e) => onNestedChange('basic','emergencyContact',field,e.target.value);
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Name" value={basicData.emergencyContact.name} onChange={h('name')} placeholder="Contact name" />
        <InputField label="Phone" value={basicData.emergencyContact.number} onChange={h('number')} placeholder="Contact number" />
        <InputField label="Relation" value={basicData.emergencyContact.relation} onChange={h('relation')} placeholder="Relationship (e.g., Mother)" className="md:col-span-2" />
      </div>
    </div>
  );
});

const MedicalInformationStep = React.memo(({ medicalData, onMultiSelectToggle, onNestedChange, setProfileData }) => {
  const toggle = (field,value) => onMultiSelectToggle('medical',field,value);
  const setVision = (prop) => (e) => onNestedChange('medical','vision',prop, prop==='wearsGlasses'? e.target.checked : e.target.value);
  const setHearing = (e) => setProfileData(prev=>({...prev, medical:{...prev.medical, hearingAids:e.target.checked}}));
  return (
    <div className="space-y-10">
      <MultiSelectField label="🩺 Chronic Conditions" options={chronicConditionsOptions} selectedItems={medicalData.chronicConditions} onToggle={(v)=>toggle('chronicConditions',v)} />
      <MultiSelectField label="⚠️ Allergies" options={allergiesOptions} selectedItems={medicalData.allergies} onToggle={(v)=>toggle('allergies',v)} />
      <MultiSelectField label="💊 Current Medications" options={medicationsOptions} selectedItems={medicalData.currentMedications} onToggle={(v)=>toggle('currentMedications',v)} />
      <MultiSelectField label="♿ Disabilities" options={disabilitiesOptions} selectedItems={medicalData.disabilities} onToggle={(v)=>toggle('disabilities',v)} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-text tracking-wide">Vision</h4>
          <label className="flex items-center gap-3 text-sm text-text">
            <input type="checkbox" checked={medicalData.vision.wearsGlasses} onChange={setVision('wearsGlasses')} className="w-4 h-4 rounded border soft-divider focus:ring-primary/40" /> Wears Glasses
          </label>
          {medicalData.vision.wearsGlasses && (
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Left Eye" value={medicalData.vision.leftEye} onChange={setVision('leftEye')} placeholder="-2.5" />
              <InputField label="Right Eye" value={medicalData.vision.rightEye} onChange={setVision('rightEye')} placeholder="-3.0" />
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-text tracking-wide">Hearing</h4>
          <label className="flex items-center gap-3 text-sm text-text">
            <input type="checkbox" checked={medicalData.hearingAids} onChange={setHearing} className="w-4 h-4 rounded border soft-divider focus:ring-primary/40" /> Uses Hearing Aids
          </label>
        </div>
      </div>
    </div>
  );
});

const LifestyleStep = React.memo(({ lifestyleData, onMultiSelectToggle }) => (
  <div className="space-y-10">
    <MultiSelectField label="🏃‍♂️ Your Habits" options={habitOptions} selectedItems={lifestyleData.habits} onToggle={(v)=>onMultiSelectToggle('lifestyle','habits',v)} />
    <MultiSelectField label="🍽️ Dietary Preferences" options={preferenceOptions} selectedItems={lifestyleData.preferences} onToggle={(v)=>onMultiSelectToggle('lifestyle','preferences',v)} />
  </div>
));

// Main Component ------------------------------------------------------------
function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [profileData, setProfileData] = useState({
    basic: { fullName:'', dob:'', gender:'', bloodGroup:'', height:{value:'',unit:'cm'}, weight:{value:'',unit:'kg'}, contactNumber:'', emergencyContact:{name:'',number:'',relation:''} },
    medical: { chronicConditions:[], allergies:[], currentMedications:[], disabilities:[], vision:{leftEye:'', rightEye:'', wearsGlasses:false}, hearingAids:false },
    lifestyle: { habits:[], preferences:[] }
  });

  // Fetch existing profile
  useEffect(()=>{ (async()=>{ if(!user?.uid) return; try{ const res=await getUserProfile(user.uid); if(res.success){ setProfileData(prev=>({...prev,...res.data})); } } finally { setLoading(false); } })(); },[user?.uid]);

  // Handlers ----------------------------------------------------------------
  const handleBasicChange = useCallback((field,value)=>{ setProfileData(p=>({...p,basic:{...p.basic,[field]: value}})); },[]);
  const handleNestedChange = useCallback((section,field,nested,value)=>{ setProfileData(p=>({...p,[section]:{...p[section],[field]:{...p[section][field],[nested]:value}}})); },[]);
  const handleMultiSelectToggle = useCallback((section,field,val)=>{ setProfileData(p=>{ const cur=p[section][field]||[]; return {...p,[section]:{...p[section],[field]: cur.includes(val)? cur.filter(i=>i!==val): [...cur,val]}}}); },[]);
  const handleNext = ()=> currentStep < steps.length && setCurrentStep(s=>s+1);
  const handlePrev = ()=> currentStep > 1 && setCurrentStep(s=>s-1);
  const handleSave = async ()=>{ if(!user?.uid) return; setSaving(true); try{ const r=await editUserProfile(user.uid, profileData); if(r.success){ setSuccessMessage('Profile updated'); setTimeout(()=>{ setSuccessMessage(''); navigate('../view-profile'); },1500);} } finally { setSaving(false);} };

  // Step component memo -----------------------------------------------------
  const currentStepComponent = useMemo(()=>{ const {basic,medical,lifestyle}=profileData; switch(currentStep){ case 1: return <BasicInformationStep basicData={basic} onBasicChange={handleBasicChange} onNestedChange={handleNestedChange}/>; case 2: return <EmergencyContactStep basicData={basic} onNestedChange={handleNestedChange}/>; case 3: return <MedicalInformationStep medicalData={medical} onMultiSelectToggle={handleMultiSelectToggle} onNestedChange={handleNestedChange} setProfileData={setProfileData}/>; case 4: return <LifestyleStep lifestyleData={lifestyle} onMultiSelectToggle={handleMultiSelectToggle}/>; default: return null;} },[currentStep, profileData, handleBasicChange, handleNestedChange, handleMultiSelectToggle]);

  // Loading skeleton --------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen aurora-bg px-4 sm:px-8 py-10">
        <div className="max-w-5xl mx-auto animate-pulse space-y-8">
          <div className="h-10 w-60 glass rounded-xl" />
          <div className="glass rounded-3xl p-6 border soft-divider space-y-4">
            {Array.from({length:4}).map((_,i)=>(<div key={i} className="h-14 glass rounded-xl border soft-divider" />))}
          </div>
        </div>
      </div>
    );
  }

  // Render ------------------------------------------------------------------
  return (
    <div className="min-h-screen aurora-bg px-3 sm:px-6 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Progress Steps (desktop/tablet) */}
        <div className="hidden sm:block glass rounded-2xl p-5 sm:p-6 border soft-divider">
          <div className="flex items-center justify-between gap-2">
            {steps.map((step, idx)=>(
              <div key={step.id} className="flex items-center flex-1 min-w-0">
                <button
                  type="button"
                  onClick={()=>setCurrentStep(step.id)}
                  onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); setCurrentStep(step.id);} }}
                  aria-current={currentStep===step.id? 'step': undefined}
                  aria-label={`Go to step ${step.id}: ${step.name}`}
                  className="group flex flex-col items-center w-full focus:outline-none"
                >
                  <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center font-bold shadow-lg transition-all cursor-pointer ring-offset-2 ring-primary/40 focus-visible:ring-2 ${currentStep>=step.id? 'bg-blue-500 text-white':'glass text-secondary border soft-divider group-hover:text-text'}`}>{currentStep>step.id? '✓': step.id}</div>
                  <div className="mt-2 text-center px-1 min-w-0">
                    <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide truncate transition-colors ${currentStep===step.id? 'text-text':'group-hover:text-text text-secondary'}`}>{step.name}</p>
                  </div>
                </button>
                {idx !== steps.length-1 && (<div className={`flex-1 h-1 mx-1 sm:mx-3 rounded-full transition-colors ${currentStep>step.id? 'bg-primary/60':'bg-white/15 dark:bg-black/20 group-hover:bg-primary/40'}`} />)}
              </div>
            ))}
          </div>
        </div>

        {/* Condensed Mobile Stepper */}
        <div className="sm:hidden glass rounded-2xl p-4 border soft-divider">
          <div className="relative">
            {/* Connector lines */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/15" aria-hidden="true" />
            <div
              className="absolute top-1/2 left-0 h-px bg-primary/60 transition-all duration-300"
              style={{width: `${(currentStep-1)/(steps.length-1)*100}%`}}
              aria-hidden="true"
            />
            <div className="flex justify-between items-center">
              {steps.map(step => (
                <button
                  key={step.id}
                  type="button"
                  onClick={()=>setCurrentStep(step.id)}
                  aria-label={`Go to step ${step.id}: ${step.name}`}
                  className={`relative z-10 h-11 w-11 rounded-full flex items-center justify-center text-sm font-semibold transition-all ring-offset-2 ring-primary/40 focus:outline-none focus-visible:ring-2 ${currentStep>=step.id? 'bg-blue-500 text-white shadow-lg':'glass text-secondary border soft-divider active:scale-95'}`}
                >
                  {currentStep>step.id? '✓': step.id}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-[11px] font-semibold tracking-wide text-text uppercase">{steps[currentStep-1].name}</p>
            <p className="text-[10px] mt-1 text-secondary line-clamp-2">{steps[currentStep-1].description}</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-elevated rounded-3xl p-6 sm:p-10 border soft-divider">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Edit {steps[currentStep-1].name}</h1>
              <p className="text-secondary text-sm">{steps[currentStep-1].description}</p>
            </div>
            <div className="flex gap-2">
              <Link to="../view-profile" className="glass rounded-xl border soft-divider px-5 py-3 text-sm font-semibold text-text hover-glow-primary">Cancel</Link>
            </div>
          </div>

          {successMessage && <div className="mb-6 glass border soft-divider rounded-xl p-4 text-green-400 text-sm font-semibold">{successMessage}</div>}

          {currentStepComponent}

          <div className="flex justify-between pt-10">
            {currentStep>1? (
              <button onClick={handlePrev} className="glass rounded-xl border soft-divider px-6 py-3 text-sm font-semibold flex items-center gap-2 hover-glow-primary">
                <FaArrowLeft className="text-primary" /> Previous
              </button>
            ) : <div />}
            {currentStep<steps.length ? (
              <button onClick={handleNext} className="glass-cta rounded-xl px-8 py-3 text-sm font-semibold flex items-center gap-2">
                Next <FaArrowRight />
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving} className="glass-cta rounded-xl px-8 py-3 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                <FaSave /> {saving? 'Saving...':'Save Profile'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
