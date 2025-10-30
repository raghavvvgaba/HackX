import { Navigate } from "react-router";
import { useAuth } from "../context/authContext";

export default function PrivateRoute({ children, requiredRole }) {
    const { user, userRole, loading } = useAuth();
    
    if (loading) return <div className="text-center py-10">Loading...</div>;
    
    if (!user) return <Navigate to='/login' />;
    
    // If a specific role is required, check if user has that role
    if (requiredRole && userRole !== requiredRole) {
        // Redirect based on their actual role
        if (userRole === "doctor") {
            return <Navigate to='/doctor' />;
        } else if (userRole === "hospital_admin") {
            return <Navigate to='/hospital' />;
        } else if (userRole === "user") {
            return <Navigate to='/user' />;
        } else {
            // If role is not set or unknown, redirect to home
            return <Navigate to='/' />;
        }
    }
    
    return children;
}