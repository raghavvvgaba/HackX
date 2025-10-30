import { Outlet } from "react-router-dom";
import UserDashboard from "./UserDashboard";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet /> {/* Child routes like /User/medical-history will render here */}
      </div>
      <Footer />
    </div>
  );
}
