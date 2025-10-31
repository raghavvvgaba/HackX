import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/authContext";

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showShareBox, setShowShareBox] = useState(false);
  const shareBoxRef = useRef(null);
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareBoxRef.current && !shareBoxRef.current.contains(e.target)) {
        setShowShareBox(false);
      }
    };

    if (showShareBox) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShareBox]);

  const handleLogout = async () => {
    try {
      await logout();
      console.log("Logged out");
      navigate("/login");
    } catch (err) {
      console.log("Logout failed", err);
    }
  };

  return (
    <nav className="w-full px-4 sm:px-6 sticky top-0 z-50 bg-white dark:bg-black text-text dark:text-white border-b border-neutral-200 dark:border-neutral-900">
      <div className="max-w-7xl mx-auto">
        <div className="relative flex flex-row justify-between items-center py-4 sm:py-5">
          {/* Logo */}
          <Link to="/">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-brand">
                VitalLink
              </span>
            </motion.div>
          </Link>

          {/* Right section */}
          <motion.div
            className="flex flex-row items-center gap-3 sm:gap-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {user ? (
              <div className="flex flex-row items-center gap-3">
                {/* Avatar Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setShowMenu(true)}
                  onMouseLeave={() => setShowMenu(false)}
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-darkBlue text-white font-bold text-sm cursor-pointer hover:bg-opacity-90 transition">
                    {user?.displayName?.charAt(0).toUpperCase()}
                  </div>

                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-48 rounded-lg shadow-2xl z-[100] p-3 sm:p-4 text-sm pointer-events-auto bg-black/80 backdrop-blur border border-white/10"
                      >
                        <div className="font-semibold text-white mb-1 truncate">
                          {user?.displayName}
                        </div>
                        <div className="text-xs text-gray-400 mb-3 capitalize truncate">
                          {userRole || "Loading..."}
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 rounded-md bg-darkBlue text-white hover:bg-opacity-90 transition font-medium"
                        >
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex flex-row items-center gap-2 sm:gap-3">
                <Link
                  to="/signup"
                  className="text-xs sm:text-sm px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg bg-darkBlue text-white hover:bg-opacity-90 transition text-center font-medium whitespace-nowrap"
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="text-xs sm:text-sm px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg border text-white border-white/30 hover:bg-white/5 transition text-center font-medium whitespace-nowrap"
                >
                  Login
                </Link>
              </div>
            )}


          </motion.div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;