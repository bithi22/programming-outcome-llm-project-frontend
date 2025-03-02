import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const navItems = [
  { label: 'Signup', path: '/register' },
];
// Data for the dynamic features
const features = [
  {
    title: " AI-Powered Assessment",
    description: "Automates grading and evaluation, reducing manual work by 70%.",
  },
  {
    title: " Real-time Analytics",
    description: "Provides deep insights into student performance and outcomes.",
  },
  {
    title: " Seamless Integration",
    description: "Easily integrates with existing LMS and academic workflows.",
    image: "/assets/integration.png",
  },
  {
    title: " Personalized Learning",
    description: "AI adapts assessments based on student progress and needs.",
    image: "/assets/personalized-learning.png",
  },
];

function Intro() {
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);

  // Auto-switch feature every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center">
      {/* Navbar */}
      <Navbar
        navItems={navItems}
        actionButton={{ label: "Login", path: "/login" }}
        buttonStyle="bg-transparent border-2 border-blue-600 text-blue-600  rounded-full hover:!bg-blue-600 hover:text-white transition-all"
      />

      {/* Main Content */}
      <div className="mt-44  mx-auto flex flex-col md:flex-row justify-between px-6">
        {/* Left Side - Name & Description */}
        <div className="md:w-1/2 text-left self-start mt-28 ml-20">
          <h1 className="text-4xl md:text-6xl font-bold text-blue-900 leading-tight">
            AI-Powered <br /> Outcome-Based Learning
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mt-4">
            Revolutionizing Outcome-Based Education (OBE) with AI-driven automation.  
            Improve efficiency, reduce workload, and enhance student outcomes.
          </p>

          {/* CTA Buttons */}
          <div className="mt-6 flex gap-4">
            
            <button
              onClick={() => navigate("/register")}
              className="bg-blue-600  text-white py-3 px-6 rounded-full hover:!bg-indigo-600 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Right Side - Dynamic Features */}
        <div className="md:w-1/2 flex flex-col items-center">
          {/* Motion Container for smooth transition */}
          <motion.div
            key={features[currentFeature].title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-md"
          >
            <h2 className="text-2xl font-bold text-blue-800">{features[currentFeature].title}</h2>
            <p className="text-gray-600 mt-2">{features[currentFeature].description}</p>

            {/* Image with animation */}
            <motion.img
              src={features[currentFeature].image}
              alt={features[currentFeature].title}
              className="w-64 h-64 object-contain mt-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8 }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Intro;
