import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa"; // <-- Imported icons

axios.defaults.withCredentials = true; // Enables sending cookies with every request

function AllQuestions() {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [questionName, setQuestionName] = useState("");
  const [weight, setWeight] = useState("");
  const [file, setFile] = useState(null);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingError, setMappingError] = useState(false);

  // New state for mobile menu toggling
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const classroom_id = location.state?.classroom_id;

  const navItems = [];

  useEffect(() => {
    if (!classroom_id) {
      setError("Classroom ID is not provided.");
      setLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("You are not logged in. Please log in first.");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `http://localhost:8000/classroom/questions/${classroom_id}`,
          {
            headers: {
              accessToken: token,
            },
          }
        );
        setQuestions(response.data.data || []);
      } catch (err) {
        setError("Failed to fetch questions. Please try again.");
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      }
    };

    fetchQuestions();
  }, [classroom_id]);

  const handleQuestionClick = (question) => {
    navigate("/questiondisplay", {
      state: { classroom_id, question_id: question._id },
    });
  };

  const handleTemplateFileDownload = async (fileType) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("You are not logged in. Please log in first.");
        setLoading(false);
        return;
      }
      const response = await axios.get(
        `http://localhost:8000/question/template`,
        {
          params: { file_type: fileType },
          responseType: "blob",
          headers: {
            accessToken: token,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `downloaded.${fileType}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading file. Please try again.");
    }
  };

  const handleAddQuestion = () => {
    setShowModal(true);
  };

  const handleCancelNewQuestion = () => {
    setQuestionName("");
    setWeight("");
    setFile(null);
    setShowModal(false);
    setMappingError("");
    setMappingLoading(false);
  };

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    // Check if the file type is PDF
    if (uploadedFile.type !== "application/pdf") {
      setMappingError("Only PDF files are allowed.");
      setFile(null);
      return;
    }
    setError(""); // Clear previous errors if any
    setFile(uploadedFile);
  };

  const handleGetCoPoMapping = async () => {
    setMappingError('')
    if (!questionName || !weight || !file) {
      setMappingError("Please fill in all the fields.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("You are not logged in. Please log in first.");
        return;
      }

      setMappingLoading(true); // Start loader

      const formData = new FormData();
      formData.append("classroom_id", classroom_id);
      formData.append("file", file);

      const response = await axios.post(
        "http://localhost:8000/question/co-po-mapping",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            accessToken: token,
          },
        }
      );

      if (response.status === 200) {
        // Force a short wait before navigation to ensure data is ready
        setTimeout(() => {
          setMappingLoading(false);
          navigate("/questioncopomapping", {
            state: {
              classroom_id,
              questionName,
              questionWeight: weight,
              questionData: response.data.data,
            },
          });
        }, 1500);
      }
    } catch (error) {
      setTimeout(() => {
        setMappingError(error.response?.data?.message || "Some error occured. Please try again.");
        setMappingLoading(false);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col bg-white min-h-screen overflow-x-hidden">
      <Navbar navItems={navItems} logout={true} />
      <div className="h-16"></div>

      <div className="flex flex-col ml-2 mr-2 md:mx-20 px-6 mt-8 ">
        <div className="flex items-center justify-between mb-6 ">
          {/* Title with fixed width */}
          <h1 className="text-xl font-semibold font-inter tracking-[-0.04em] w-1/2 lg:w-1/4">
            All Questions
          </h1>

          {/* Desktop inline buttons (visible on large screens) */}
          <div className="hidden lg:flex gap-x-4">
            <button
              onClick={handleAddQuestion}
              disabled={loading}
              className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add a New Question
            </button>
            <button
              onClick={() => handleTemplateFileDownload("docx")}
              disabled={loading}
              className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download DOCX Template
            </button>
            <button
              onClick={() => handleTemplateFileDownload("zip")}
              disabled={loading}
              className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download Latex Template
            </button>
          </div>

          {/* Mobile hamburger menu (visible on small and medium screens) */}
          <div className="lg:hidden relative">
            <button
              onClick={toggleMobileMenu}
              className="text-black focus:outline-none"
            >
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
            {isMobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md border border-gray-300 py-2 px-4 flex flex-col space-y-2">
                <button
                  onClick={() => {
                    handleAddQuestion();
                    toggleMobileMenu();
                  }}
                  className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                >
                  Add a New Question
                </button>
                <button
                  onClick={() => {
                    handleTemplateFileDownload("docx");
                    toggleMobileMenu();
                  }}
                  className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                >
                  Download DOCX Template
                </button>
                <button
                  onClick={() => {
                    handleTemplateFileDownload("zip");
                    toggleMobileMenu();
                  }}
                  className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                >
                  Download Latex Template
                </button>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="container mx-auto px-6">
              <div className="bg-white shadow-md rounded-lg p-6">
                {/* List Skeleton */}
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((_, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-gray-200 rounded-lg animate-pulse"
                    >
                      {/* Icon Placeholder */}
                      <div className="w-10 h-10 bg-gray-300 rounded-full"></div>

                      {/* Text Placeholder */}
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <div className="text-red-500 text-center mt-10">{error}</div>
            </motion.div>
          ) : questions.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <div className="flex flex-col space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg shadow-sm hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleQuestionClick(question)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h11M9 21V3m0 18c6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12S3 4.373 3 11c0 6.627 5.373 12 12 12z"
                          />
                        </svg>
                      </div>
                      <div className="text-lg font-semibold">
                        {question.name}
                      </div>
                      <div className="text-lg font-semibold">
                        {`(${question.weight}%)`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <div className="text-gray-500 text-center mt-10">
                No questions available.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg w-[300px] md:max-w-lg md:w-full pl-4 py-4 pr-2 md:p-6">
              <h2 className="text-lg font-bold mb-4">Upload Your Question</h2>
              <label
                htmlFor="question_name"
                className="block font-bold text-left mb-1 text-black"
              >
                Question Name
              </label>
              <input
                type="text"
                spellCheck={false}
                placeholder="Enter Question Name"
                className="border p-2 w-full rounded mb-4"
                value={questionName}
                onChange={(e) => setQuestionName(e.target.value)}
              />
              <label
                htmlFor="question_weight"
                className="block font-bold text-left mb-1 text-black"
              >
                Question Weight
              </label>
              <input
                type="number"
                placeholder="Enter Weight"
                min={1}
                max={100}
                className="border p-2 w-full rounded mb-4"
                value={weight}
                onChange={(e) => {
                  let newVal = e.target.value.trim();
                  if (newVal === "") {
                    setWeight(newVal);
                    return;
                  }
                  newVal = parseFloat(newVal);
                  if (isNaN(newVal) || newVal < 1) {
                    newVal = 1;
                  }
                  if(newVal>100){
                    newVal = 100
                  }
                  setWeight(newVal);
                }}
                onBlur={(e) => {
                  let newVal = e.target.value.trim();
                  if (newVal === "" || isNaN(parseFloat(newVal))) {
                    setWeight(1);
                  }
                }}
              />
              <label
                htmlFor="pdf_file"
                className="block font-bold text-left mb-1 text-black"
              >
                Question (The PDF file should follow the templates)
              </label>
              <input
                type="file"
                accept="application/pdf"
                className="border p-2 w-full rounded mb-4"
                onChange={handleFileChange}
              />
              {mappingError && (
                <p className="text-red-500 text-sm mb-4 text-center font-bold">
                  {mappingError}
                </p>
              )}

              {/* Loader Spinner */}
              {mappingLoading && (
                <div className="flex justify-center mb-4">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  <div className="mx-2">
                    <span>Please wait...</span>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancelNewQuestion}
                  disabled={mappingLoading}
                  className={`bg-gray-300 text-black py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-gray-400 ${
                    mappingLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGetCoPoMapping}
                  disabled={mappingLoading}
                  className={`bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] ${
                    mappingLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Get CO PO Mapping
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default AllQuestions;
