import React, { useState,useEffect } from "react";
import axios from "axios";
import { useNavigate, NavLink } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import GoogleAuth from "../components/GoogleAuth";

axios.defaults.withCredentials = true; // Enables sending cookies with every request


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const navItems = [];

  const actionButton = { label: "Signup", path: "/register" };

  // Simple email regex for validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // useEffect(() => {
  //   const token = localStorage.getItem("accessToken");
  //   if (token) {
  //     navigate("/dashboard");
  //   }
  // }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    let valid = true;
    if (!email) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Invalid email address.");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    }

    if (!valid) {
      return;
    }

    setLoading(true);
    try {
      const requestBody = { email, password };
      const response = await axios.post(
        "http://localhost:8000/auth/login",
        requestBody
      );

      if (response.status === 200) {
        localStorage.setItem("accessToken", response.headers.accesstoken);
        setTimeout(() => {
          setLoading(false);
          navigate("/dashboard");
        }, 1500);
      }
    } catch (error) {
      if (
        error.response?.status == 400 &&
        error.response?.data?.message
          .toLowerCase()
          .includes("email is not verified".toLowerCase())
      ) {
        setTimeout(() => {
          setError(
            "Your email is not verfied. Re-directing to email verfification..."
          );
        }, 1500);
        setTimeout(() => {
          setLoading(false);
          navigate(`/emailVerification?email=${encodeURIComponent(email)}`);
        }, 3000);
      } else {
        setTimeout(() => {
          setLoading(false);
          setError(error.response?.data?.message);
        }, 1500);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white">
      {/* Navbar */}
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] "
      />
      <div className="h-16"></div>

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        {/* Vector Images (scaled by viewport width) */}
        <img
          src="/assets/Vector1.png"
          alt="Decorative Vector 1"
          className="absolute bottom-0 left-0 w-[25vw] md:w-[20vw] h-auto"
        />
        <img
          src="/assets/vector2.png"
          alt="Decorative Vector 2"
          className="absolute top-[4rem] right-0 w-[25vw] md:w-[20vw] h-auto"
        />

          {/* Login Card */}
          <div className="flex flex-col bg-white shadow-lg rounded-xl p-8 w-11/12 max-w-sm md:max-w-md my-4 z-20">
            <h2 className="text-2xl font-bold mb-2 text-left">
              Welcome back to <span className="font-serif font-bold">OBE<span className="text-blue-500">lytics</span></span>
            </h2>
            <p className="text-black mb-2 text-left">
              A single source platform for Outcome Based Education
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label
                  htmlFor="email"
                  className="block font-bold text-left mb-1 text-black"
                >
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 mb-1 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
                {emailError && (
                  <p className="text-red-500 text-sm mb-1">{emailError}</p>
                )}
              </div>
              <div className="mb-2">
                <label
                  htmlFor="password"
                  className="block font-bold text-left mb-1 text-black"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 mb-1 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#3941FF]"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-red-500 text-sm mb-1">{passwordError}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end mb-4">
                <NavLink
                  to="/forgotpassword"
                  className="text-[#3941FF] hover:text-[#2336CC] hover:font-bold hover:no-underline"
                >
                  Forgot Password?
                </NavLink>
              </div>

              {error && (
                <p className="text-red-500 mb-4 text-center font-bold">
                  {error}
                </p>
              )}
              {loading && (
                <div className="flex justify-center mb-4">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  <div className="mx-2">
                    <span>Please wait...</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Login
              </button>
            </form>

            {/* Divider with "or" */}
            <div className="flex items-center my-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="px-2 text-gray-500">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Google Login Button */}
            <GoogleAuth
              setGlobalError={setError}
              navigate={navigate}
              setLoading={setLoading}
            />

            <p className="mt-4 text-gray-600 text-center">
              Don't have an account?{" "}
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  isActive
                    ? "text-[#3941FF]"
                    : "text-[#3941FF] hover:text-[#2336CC] hover:font-bold hover:no-underline"
                }
              >
                Register
              </NavLink>
            </p>
          </div>
      </div>
    </div>
  );
}

export default Login;
