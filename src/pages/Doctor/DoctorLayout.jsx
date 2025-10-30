import { Outlet } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function DoctorLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 p-4">
        <Outlet /> {/* Child routes like /Doctor/medical-history will render here */}
      </div>
      <Footer />
    </div>
  );
}
