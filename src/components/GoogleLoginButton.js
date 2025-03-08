import React from "react";
import { GoogleLogin } from "@react-oauth/google";

const GoogleLoginButton = ({ onSuccess, onFailure }) => {
    return (
        <div>
            <GoogleLogin
                onSuccess={(credentialResponse) => {
                    const tokenId = credentialResponse.credential;
                    onSuccess({ tokenId });
                }}
                onError={() => {
                    onFailure("Login Failed");
                }}
            />
        </div>
    );
};

export default GoogleLoginButton;

