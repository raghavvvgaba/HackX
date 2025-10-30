import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function HospitalLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if mock mode is active
    const mockMode = localStorage.getItem('mockMode');
    const mockHospitalUser = localStorage.getItem('mockHospitalUser');
    
    // If not in mock mode or no mock user, redirect to login
    if (mockMode !== 'true' || !mockHospitalUser) {
      console.log('No mock mode detected, redirecting to login');
      navigate('/login');
    } else {
      console.log('Mock mode active, hospital pages accessible');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 p-4">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
