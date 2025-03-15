// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// axios.defaults.withCredentials = true; // Enables sending cookies with every request

// const LogoutButton = () => {
//     const navigate = useNavigate();

//     const handleLogout = () => {
//         // Clear user data (session storage, local storage, or global state)
//         localStorage.removeItem("authToken"); // Example
//         sessionStorage.clear(); // Clear session storage

//         // Redirect to Home and replace history
//         navigate("/", { replace: true });

//         // Additional step: Use history manipulation to clear the stack
//         window.history.pushState(null, null, window.location.href);
//         window.onpopstate = function () {
//             window.history.go(1); // Prevent going back
//         };
//     };

//     return <button

//     onClick={handleLogout}
//     className="border-2 border-red-500 font-inter font-semibold text-[16px] tracking-[-0.04em] text-center text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white transition easeInOut"
//     >Logout</button>;
// };

// export default LogoutButton;

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

axios.defaults.withCredentials = true; // Enables sending cookies with every request

const LogoutButton = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("You are not logged in. Please log in first.");
      return;
    }

    try {
      // Send logout request
      await axios.post(
        "http://localhost:8000/auth/logout",
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
      className="border-2 border-red-500 font-inter font-semibold text-[16px] tracking-[-0.04em] text-center text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white transition ease-in-out"
    >
      Logout
    </button>
  );
};

export default LogoutButton;
