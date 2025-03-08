import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const navItems = [];

const features = [
  {
    title: "AI-Powered Assessment",
    description: "Automates grading and evaluation, reducing manual work by 70%.",
    image: "/assets/teacher.jpg",
  },
  {
    title: "Real-time Analytics",
    description: "Provides deep insights into student performance and outcomes.",
    image: "/assets/student.jpg",
  },
  {
    title: "Personalized Learning",
    description: "AI adapts assessments based on student progress and needs.",
    image: "/assets/thinking.jpg",
  },
];

function Intro() {
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Auto-switch feature every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Move to next feature
      setCurrentFeature((prev) => (prev + 1) % features.length);
      // Reset image loading state so skeleton shows for next feature
      setImageLoaded(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const activeFeature = features[currentFeature] || features[0];

  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center">
      {/* Navbar */}
      <Navbar
        navItems={navItems}
        actionButton={{ label: "Login", path: "/login" }}        
        buttonStyle = "bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC]"        
      />

      {/* Main Content */}
      <div className="mt-44 mx-auto flex flex-col md:flex-row justify-between px-6 w-full">
        {/* Left Side - Static Name & Description */}
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
              onClick={() => navigate("/login")}
              className= "bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC]"
            
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Right Side - Dynamic Features with Crossfade */}
        <div className="md:w-1/2 flex flex-col items-center justify-center h-[60vh] pb-[10vh]">
  <AnimatePresence mode="wait">
    {activeFeature && (
      <motion.div
        key={activeFeature.title}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="text-center flex flex-col items-center w-full max-w-lg h-full"
      >
        {/* Image Container */}
        <div className="w-full flex-1 flex justify-center items-center">
          {/* {!imageLoaded && (
            <div className="w-full h-full bg-gray-200 animate-pulse rounded-md"></div>
          )} */}

          <motion.img
            src={activeFeature.image}
            alt={activeFeature.title}
            className={`w-auto max-w-full max-h-full object-contain ${
              !imageLoaded ? "hidden" : "block"
            }`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Feature Text */}
        {imageLoaded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mt-4"
          >
            <h2 className="text-2xl font-bold text-blue-800">
              {activeFeature.title}
            </h2>
            <p className="text-gray-600 mt-2">{activeFeature.description}</p>
          </motion.div>
        )}
      </motion.div>
    )}
  </AnimatePresence>
</div>


      </div>
    </div>
  );
}

export default Intro;
