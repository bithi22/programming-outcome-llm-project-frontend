import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function EmailVerification() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  console.log("Email :" ,email)
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

   

  const handleVerify = async (e) => {
    e.preventDefault();
    
    
  console.log('Email:', email);
  console.log('Token:', token);

    if (!email || !token) {
      setError('Both email and token are required.');
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/auth/verifyEmail', { email, token });

      if (response.status === 200) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000); // Redirect to login after 3 seconds
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid token. Please try again.');
    }
  };

  return (
    <div className="relative h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col items-center justify-center">
      <div className="bg-white shadow-lg rounded-xl p-8 w-[400px]">
        <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
        <p className="mb-4">
          A verification token has been sent to <strong>{email}</strong>. Enter the token below to verify your email.
        </p>

        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <label htmlFor="token" className="block font-bold mb-1">
              Verification Token
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Enter the token"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">Email verified successfully!</p>}

          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md">
            Verify Email
          </button>
        </form>
      </div>
    </div>
  );
}

export default EmailVerification;
