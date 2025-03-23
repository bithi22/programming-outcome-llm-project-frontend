import React from 'react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';

const API_URL = process.env.REACT_APP_API_URL

function JoinClass() {
  return (
    <div className="position-relative vh-100 d-flex flex-column align-items-center justify-content-center bg-white">
      <Navbar />
      <Card />
    </div>
  );
}

export default JoinClass;
