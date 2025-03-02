import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Contact Us', path: '/contactus' },
  ];

  const actionButton = { label: 'Signup', path: '/signup' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Both email and password are required.');
      setLoading(false);
      return;
    }

    try {
      const requestBody = { email, password };
      const response = await axios.post('http://127.0.0.1:8000/auth/login', requestBody);

      if (response.status === 200) {
        localStorage.setItem('accessToken', response.headers.accesstoken);
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white flex flex-col items-center">
      {/* Navbar */}
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="bg-blue-500 text-white no-underline py-2 px-4 rounded-md hover:bg-blue-600"
      />

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

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Login Card */}
        <div className="relative z-10 bg-white shadow-lg rounded-xl p-8 w-11/12 max-w-sm md:max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-left">
            Welcome back to Shamik
            <span className="text-blue-500">LLM</span>
          </h2>
          <p className="text-black mb-6 text-left">
            Register to ShamikLLM and Unleash the Power of Ajke Thak.
          </p>

          <form onSubmit={handleSubmit}>
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
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 flex justify-center items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <p className="mt-4 text-gray-600 text-center">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-500 hover:underline">
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
