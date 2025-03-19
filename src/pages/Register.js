import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, NavLink } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import GoogleAuth from "../components/GoogleAuth";

const API_URL = process.env.REACT_APP_API_URL
axios.defaults.withCredentials = true; // Enables sending cookies with every request

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Field error states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  // Global error from backend
  const [globalError, setGlobalError] = useState("");

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const navItems = [];

  const actionButton = { label: "Login", path: "/login" };

  // Simple email regex for validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(()=>{
    const token = localStorage.getItem('accessToken');
        if (token) {
          navigate("/dashboard")
        }

  },[])

  const handleSubmit = async (e) => {
    console.log(API_URL)
    e.preventDefault();

    // Reset errors on each click to reflect current field status
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setGlobalError("");

    let valid = true;

    // Validate email
    if (!email) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Invalid email address.");
      valid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be minimum of 6 characters.");
      valid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError("Confirm Password is required.");
      valid = false;
    }

    // Check if passwords match
    if (password && confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      console.log(`${API_URL}/auth/register`)
      return
      const requestBody = { email, password };
      const response = await axios.post(
        `${API_URL}/auth/register`,
        requestBody
      );

      if (response.status === 201) {
        setLoading(false);
        setSuccess(true);
        // Show success message for 3 seconds before redirecting
        setTimeout(() => {
          navigate(`/emailVerification?email=${encodeURIComponent(email)}`);
        }, 3000);
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setTimeout(() => {
          setGlobalError(error.response.data.message);
          setLoading(false);
        }, 1500);
      } else {
        setTimeout(() => {
          console.log(error)
          setGlobalError("An unexpected error occurred. Please try again.");
          setLoading(false);
        }, 1500);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white">
      {/* Fixed Navbar with high z-index */}
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC]"
      />
      <div className="h-16"></div>
      {/* Padding top equal to Navbar height (e.g., pt-16 for 4rem) */}
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

        {/* Card container with margin-top to maintain spacing */}
        <div className="flex flex-col bg-white shadow-lg rounded-xl p-8 w-11/12 max-w-sm md:max-w-md mt-4 mb-4 z-20">
          <h2 className="text-2xl font-bold mb-2 text-left">
            Register to <span className="font-serif font-bold">OBE<span className="text-blue-500">lytics</span></span>
          </h2>
          <p className="text-black mb-2 text-left">
            Register to automate Outcome Based Education.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
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

            {/* Password Field with eye icon toggle */}
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
                  placeholder="Enter your password (minimum 6 characters)"
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

            {/* Confirm Password Field with eye icon toggle */}
            <div className="mb-4">
              <label
                htmlFor="confirmPassword"
                className="block font-bold text-left mb-1 text-black"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 mb-1 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#3941FF]"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-red-500 text-sm mb-1">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Global Error Message */}
            {globalError && (
              <p className="text-red-500 mb-4 text-center font-bold">
                {globalError}
              </p>
            )}

            {/* Loader Spinner */}
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

            {/* Success Message */}
            {success && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-blue-500 text-white px-6 py-4 rounded-md shadow-lg">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-white mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Registration Successful.</span>
                  </div>
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
              Register
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
            setGlobalError={setGlobalError}
            navigate={navigate}
            setLoading={setLoading}
          />

          <p className="mt-4 text-gray-600 text-center">
            Already have an account?{" "}
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive
                  ? "text-[#3941FF]"
                  : "text-[#3941FF] hover:text-[#2336CC] hover:font-bold hover:no-underline"
              }
            >
              Signin
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
