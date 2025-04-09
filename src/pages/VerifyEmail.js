import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;
axios.defaults.withCredentials = true; // Enables sending cookies with every request

function EmailVerification() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccessTokenValidity = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          await axios.get(`${API_URL}/auth/`, {
            headers: { accessToken: token },
          });
          navigate("/dashboard");
        }
      } catch (err) {}
    };
    checkAccessTokenValidity();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setTokenError("");
    setError("");

    if (!token) {
      setTokenError("Token is required.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/verifyEmail`, {
        email,
        token,
      });

      if (response.status === 200) {
        setTimeout(() => {
          setLoading(false);
          setSuccess(true);
        }, 1000);

        setTimeout(() => navigate("/login"), 3000); // Redirect to login after 3 seconds
      }
    } catch (error) {
      setTimeout(() => {
        setLoading(false);
        setError(error.response?.data?.message);
      }, 1000);
    }
  };

  return (
    <>
      {email && (
        <div className="relative min-h-screen bg-white">
          <Navbar />
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
            <div className="flex flex-col bg-white shadow-lg rounded-xl p-8 w-11/12 max-w-lg md:max-w-lg my-4 z-20">
              <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
              <p className="mb-4">
                A verification token has been sent to <strong>{email}</strong>.
                Enter the token below to verify your email.
              </p>

              <form onSubmit={handleVerify}>
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

                {/* Global Error Message */}
                {error && (
                  <p className="text-red-500 mb-4 text-center font-bold">
                    {error}
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
                        <span>Email verified successfully!</span>
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
                  Verify Email
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EmailVerification;
