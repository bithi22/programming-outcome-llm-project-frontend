import React from "react";
import GoogleLoginButton from "./GoogleLoginButton";
import { GoogleOAuthProvider } from "@react-oauth/google";
import axios from "axios";

axios.defaults.withCredentials = true; // Enables sending cookies with every request

const clientId = "671187382467-fr9vb86hkcm0ef47thik8bj2gu3ul74b.apps.googleusercontent.com"

const GoogleAuth = ({ setGlobalError, navigate, setLoading }) => {
  const handleSuccess = async (response) => {
    setLoading(true)
    const tokenId = response.tokenId;
    console.log(tokenId)

    // Send the tokenId to the backend for validation
    try {
      const result = await axios.post("http://localhost:8000/auth/google", {
        token: tokenId,
      });

      if(result.data.success){
        localStorage.setItem("accessToken", result.headers.accesstoken);
        setLoading(false);
        navigate("/dashboard");
      }
      else{
        setGlobalError(result.data.message)
        setLoading(false)
      }
    } catch (error) {
      setGlobalError(error.response?.data?.message);
      setLoading(false)
    }
  };

  const handleFailure = (error) => {
    setGlobalError("Google Login Failed. Please try again.");
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div>
        <GoogleLoginButton
          onSuccess={handleSuccess}
          onFailure={handleFailure}
        />
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleAuth;
