import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import Navbar from "../components/Navbar";

function AllQuestions() {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [questionName, setQuestionName] = useState("");
  const [weight, setWeight] = useState("");
  const [file, setFile] = useState(null);
  const [mappingLoading, setMappingLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const classroom_id = location.state?.classroom_id;

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Classroom", path: "/classroom" },
  ];
  const actionButton = { label: "Logout", path: "/logout" };

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
          `http://127.0.0.1:8000/classroom/questions/${classroom_id}`,
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
        setLoading(false);
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
        `http://127.0.0.1:8000/question/template`,
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

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;
    
    // Check if the file type is PDF
    if (uploadedFile.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      setFile(null);
      return;
    }
    setError(""); // Clear previous errors if any
    setFile(uploadedFile);
  };

  const handleGetCoPoMapping = async () => {
    if (!file) {
      setError("Please upload a file before proceeding.");
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
        "http://127.0.0.1:8000/question/co-po-mapping",
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
        }, 500);
      }
    } catch (err) {
      setError("Failed to get CO PO Mapping. Please try again.");
      setMappingLoading(false);
    }
  };

  return (
    <div>
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />

      <div className="container mx-auto px-6 mt-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">All Questions</h1>
          <button
            onClick={handleAddQuestion}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Add a New Question
          </button>
          <button
            onClick={() => handleTemplateFileDownload("docx")}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Download DOCX Template
          </button>
          <button
            onClick={() => handleTemplateFileDownload("zip")}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Download Latex Template
          </button>
        </div>

        {loading ? (
          <div className="text-center mt-10">Loading questions...</div>
        ) : error ? (
          <div className="text-red-500 text-center mt-10">{error}</div>
        ) : questions.length > 0 ? (
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
                  <div className="text-lg font-semibold">{question.name}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-10">
            No questions available.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Upload Your Question</h2>
            <input
              type="text"
              placeholder="Enter Question Name"
              className="border p-2 w-full rounded mb-2"
              value={questionName}
              onChange={(e) => setQuestionName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Enter Weight"
              className="border p-2 w-full rounded mb-2"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <input
              type="file"
              accept="application/pdf"
              className="border p-2 w-full rounded mb-4"
              onChange={handleFileChange}
            />
            <button
              onClick={handleGetCoPoMapping}
              disabled={mappingLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-md w-full hover:bg-blue-600 disabled:opacity-50"
            >
              Get CO PO Mapping
            </button>
            {mappingLoading && (
              <div className="flex items-center justify-center mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-blue-500">
                  Please wait, this may take a while.
                </span>
              </div>
            )}
            <button
              className="mt-2 w-full text-red-500 hover:underline"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllQuestions;
