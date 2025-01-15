import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const navItems = [
    { label: 'Create Class', path: '/createclass' },
    { label: 'Invite Members', path: '/invitemembers' },
    { label: 'Generate CO-PO Table', path: '/generatecopo' },
    { label: 'Generate Report', path: '/generatereport' },
  ];

  const actionButton = { label: 'Signup', path: '/signup' };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Both email and password are required.');
      return;
    }

    try {
      const requestBody = { email, password };

      // Send POST request to login endpoint
      const response = await axios.post('http://127.0.0.1:8000/auth/login', requestBody);

      if (response.status === 200) {
        // Save the access token to localStorage
        localStorage.setItem('accessToken', response.headers.accesstoken);
        console.log(response)
        setError('');
        navigate('/dashboard'); // Navigate to the dashboard on success
      }
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message || 'Invalid email or password.');
      } else {
        setError('Network error. Please try again.');
      }
    }
  };

  return (
    <div className="relative h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col items-center justify-center">
      {/* Navbar */}
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="bg-blue-500 text-white no-underline py-2 px-4 rounded-md hover:bg-blue-600"
      />

      {/* Login Card */}
      <div className="bg-white shadow-lg rounded-xl p-8 w-[400px]">
        <h2 className="text-2xl font-bold mb-4 text-left">
          Welcome back to Shamik<span className="text-blue-500">LLM</span>
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

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Login
          </button>
        </form>

        {/* Sign In Link */}
        <p className="mt-4 text-gray-600 text-center">
          Don't have an account?{' '}
          <a href="/" className="text-blue-500 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
