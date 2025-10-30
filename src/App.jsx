import { Routes, Route, useLocation } from 'react-router-dom';
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import PrivateRoute from './components/PrivateRoute';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/User/UserDashboard';
import MedicalHistoryPage from './components/MedicalHistoryPage';
import Signup from './pages/Signup';
import Login from './pages/Login';
import UserLayout from './pages/User/UserLayout';
import DoctorLayout from './pages/Doctor/DoctorLayout';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import PatientProfilePage from './pages/Doctor/PatientProfilePage';
import EditProfile from './pages/User/EditProfile';
import Onboarding from './components/Onboarding';
import { Profile } from './pages/User/Profile';

// https://www.hover.dev/components/navigation Use this for prebuilt components

// Scroll to top on route change to avoid preserved scroll positions between pages
const ScrollToTop = () => {
  const location = useLocation();
  useLayoutEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Multiple scroll reset attempts
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Force another reset after micro-task
    Promise.resolve().then(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    
  }, [location.pathname]);
  return null;
};

const App = () => {
  const location = useLocation();

  // Direction logic
  const [direction, setDirection] = useState(1);
  const prevPathRef = useRef(location.pathname); 

  useEffect(() => {
    const prev = prevPathRef.current;
    const next = location.pathname;

    setDirection(next.length > prev.length ? 1 : -1);
    prevPathRef.current = next;
  }, [location]);

  return (
    <div className="relative min-h-screen w-full bg-background text-text">
      <ScrollToTop />
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user" element={<PrivateRoute><UserLayout /></PrivateRoute>} >
          <Route index element={<UserDashboard />} />
          <Route path='onboarding' element={<Onboarding/>} />
          <Route path='medical-history' element={<MedicalHistoryPage />} />
          <Route path='edit-profile' element={<EditProfile />} />
          <Route path='view-profile' element={<Profile />} />
        </Route>
        <Route path="/doctor" element={<PrivateRoute><DoctorLayout /></PrivateRoute>} >
          <Route index element={<DoctorDashboard />} />
          <Route path="shared-profile/:shareId" element={<PatientProfilePage />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
