import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function ForgetPassword() {
  // State for input fields and error messages
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [token, setToken] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // step === "getToken" shows only email; step === "resetPassword" shows extra fields
  const [step, setStep] = useState("getToken");
  const navigate = useNavigate();


  useEffect(()=>{
      const token = localStorage.getItem('accessToken');
          if (token) {
            navigate("/dashboard")
          }
  
    },[])

  // First step: request a verification token by providing the email
  const handleGetToken = async (e) => {
    e.preventDefault();
    // Clear any previous errors
    setEmailError("");
    setGlobalError("");

    if (!email) {
      setEmailError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      // Call your API to get the verification token
      const response = await axios.post(
        "http://127.0.0.1:8000/auth/forget_password/initiate",
        { email }
      );
      if (response.status === 200) {
        // On success, reveal the extra fields
        setTimeout(() => {
          setStep("resetPassword");
          setLoading(false);
        }, 1500);
      } else {
        setTimeout(() => {
          setLoading(false);
          setGlobalError(
            response?.data?.message || "Something went wrong. Please try again."
          );
        }, 1500);
      }
    } catch (error) {
      setTimeout(() => {
        setLoading(false);
        setGlobalError(
          error.response?.data?.message ||
            "Something went wrong. Please try again."
        );
      }, 1500);
    }
  };

  // Second step: reset the password using the new password and the token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    // Clear previous error messages
    setPasswordError("");
    setTokenError("");
    setGlobalError("");

    let value = true;
    if (!newPassword) {
      setPasswordError("New password is required.");
      value = false;
    } else if (newPassword.length < 6) {
      setPasswordError("Password must be minimum of 6 characters.");
      value = false;
    }

    if (!token) {
      setTokenError("Token is required.");
      value = false;
    }
    if (!value) {
      return;
    }
    setLoading(true);
    try {
      // Call your API to set the new password
      const response = await axios.put(
        "http://127.0.0.1:8000/auth/forget_password/confirm",
        { email, password : newPassword, token }
      );
      if (response.status === 200) {
        // Delay navigation to /dashboard by 3 seconds
        setTimeout(() => {
          setSuccess(true);
          setLoading(false);
        }, 1000);
        setTimeout(() => {
          setSuccess(false);
          navigate("/login");
        }, 3000);
      } else {
        setTimeout(() => {
          setLoading(false);
          setGlobalError(
            response?.data?.message || "Something went wrong. Please try again."
          );
        }, 1500);
      }
    } catch (error) {
      setTimeout(() => {
        setLoading(false);
        setGlobalError(
          error.response?.data?.message ||
            "Something went wrong. Please try again."
        );
      }, 1500);
    }
  };

  // The form submission handler will delegate to the appropriate function based on the current step
  const handleSubmit = (e) => {
    if (step === "getToken") {
      handleGetToken(e);
    } else {
      handleResetPassword(e);
    }
  };

  return (
    <div className="relative min-h-screen bg-white">
      <Navbar className="fixed top-0 left-0 w-full z-50" />
      <div className="pt-4 items-center justify-center">
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
        <div className="flex flex-col items-center justify-center w-full min-h-screen">
          <div className="relative bg-white shadow-lg rounded-xl p-8 w-11/12 max-w-lg md:max-w-lg">
            <h2 className="text-2xl font-bold mb-2">Forgot Password</h2>
            {step === "resetPassword" && (
              <p className="mb-4">
                A verfication code has been sent to your email.
              </p>
            )}
            <form onSubmit={handleSubmit}>
              {/* Email Field (always visible) */}
              <div className="mb-4">
                <label htmlFor="email" className="block font-bold mb-1">
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md"
                  placeholder="Enter your email"
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>

              {/* Extra Fields: Shown only after the verification token is successfully requested */}
              {step === "resetPassword" && (
                <>
                  <div className="relative mb-4">
                    <label
                      htmlFor="newPassword"
                      className="block font-bold mb-1"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"} // Toggle between password and text
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded-md pr-10"
                        placeholder="Enter your new password (minimum 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#3941FF]"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-red-500 text-sm mt-1">
                        {passwordError}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="token" className="block font-bold mb-1">
                      Verification Token
                    </label>
                    <input
                      type="text"
                      id="token"
                      spellCheck={false}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md"
                      placeholder="Enter the token"
                    />
                    {tokenError && (
                      <p className="text-red-500 text-sm mt-1">{tokenError}</p>
                    )}
                  </div>
                </>
              )}

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
                      <span>Password Reset Successfully!</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button: Text changes based on current step */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {step === "getToken"
                  ? "Get Verification Token"
                  : "Set New Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgetPassword;
