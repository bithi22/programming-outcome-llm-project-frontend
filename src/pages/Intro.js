import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const navItems = [{ label: "Signup", path: "/register" }];

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
        buttonStyle="bg-transparent border-2 border-blue-600 text-blue-600 rounded-full hover:!bg-blue-600 hover:text-white transition-all"
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
              onClick={() => navigate("/register")}
              className="bg-blue-600 text-white py-3 px-6 rounded-full hover:!bg-indigo-600 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Right Side - Dynamic Features with Crossfade */}
        <div className="md:w-1/2 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {/* Only render the feature container if we have a valid feature */}
            {activeFeature && (
              <motion.div
                key={activeFeature.title /* triggers re-animation */}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="text-center max-w-2xl flex flex-col items-center"
              >
                {/* Larger, Responsive Image */}
                <div className="w-full relative">
                  {!imageLoaded && (
                    /* Skeleton loader until image is loaded */
                    <div className="w-full h-64 bg-gray-200 animate-pulse rounded-md mt-4"></div>
                  )}

                  <motion.img
                    src={activeFeature.image}
                    alt={activeFeature.title}
                    className={`w-full max-w-2xl h-auto object-contain mt-4 ${
                      !imageLoaded ? "hidden" : "block"
                    }`}
                    onLoad={() => setImageLoaded(true)}
                  />
                </div>

                {/* Title and Description Below the Image */}
                {imageLoaded && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                  >
                    <h2 className="text-2xl font-bold text-blue-800 mt-4">
                      {activeFeature.title}
                    </h2>
                    <p className="text-gray-600 mt-2">
                      {activeFeature.description}
                    </p>
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
