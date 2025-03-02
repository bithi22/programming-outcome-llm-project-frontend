import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, NavLink } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Contact Us', path: '/contactus' },
  ];

  const actionButton = { label: 'Login', path: '/login' };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      // Build the request body
      const requestBody = { email, password };

      // Send a POST request to the backend
      const response = await axios.post('http://127.0.0.1:8000/auth/register', requestBody);

      // If sign-up is successful, navigate to the login page
      if (response.status === 201) {
        setError('');
        setSuccess(true);
        navigate(`/emailVerification?email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      console.error('Error during sign-up:', error);
      // Handle error response from backend
      if (error.response) {
        const { data, status } = error.response;
        if (status === 400 && data.message) {
          setError(data.message); // Use the message from the backend response
        } else {
          setError('An unexpected error occurred.');
        }
      } else {
        setError('Network error. Please try again.');
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col items-center">
      {/* Navbar */}
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="bg-blue-500 text-white py-2 px-4 rounded-md no-underline hover:bg-indigo-500 transition-all"
      />



      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Registration Card */}
        <div className="relative z-10 bg-white shadow-lg rounded-xl p-8 w-11/12 max-w-sm md:max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-left">
            Register to Shamik<span className="text-blue-500">LLM</span>
          </h2>
          <p className="text-black mb-6 text-left">
            Register to ShamikLLM and Unleash the Power of Ajke Thak.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block font-bold text-left mb-1 text-black"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block font-bold text-left mb-1 text-black"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>

            {/* Confirm Password Field */}
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block font-bold text-left mb-1 text-black"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Re-enter your password"
              />
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Success Message */}
            {success && (
              <p className="text-green-500 text-sm mb-4">
                User registered successfully! Redirecting to login...
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-indigo-500"
            >
              Register
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-4 text-gray-600 text-center">
            Already have an account?{' '}
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive
                  ? 'text-blue-600 no-underline font-bold'
                  : 'text-blue-500 hover:text-blue-700'
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
