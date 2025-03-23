import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL
axios.defaults.withCredentials = true; // Enables sending cookies with every request

const LogoutButton = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    console.log("Logout button pressed.")
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("You are not logged in. Please log in first.");
      return;
    }
    setLoggingOut(true)
    try {
      // Send logout request
      await axios.post(
        `${API_URL}/auth/logout`,
        {},
        {
          headers: { accessToken: token },
        }
      );
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Remove token regardless of API response
      localStorage.removeItem("accessToken");
      sessionStorage.clear();

      // Redirect to Home
      navigate("/", { replace: true });

      // Prevent back navigation
      window.history.pushState(null, null, window.location.href);
      window.onpopstate = () => {
        window.history.go(1);
      };
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`border-2 border-red-500 font-inter font-semibold text-[16px] tracking-[-0.04em] text-center text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white transition ease-in-out
        ${loggingOut ? "opacity-50 cursor-not-allowed" : ""}
        `}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
