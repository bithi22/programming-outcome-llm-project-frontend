import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import ErrorPopup from "../components/ErrorPopUp";


const API_URL = process.env.REACT_APP_API_URL

axios.defaults.withCredentials = true; // Enables sending cookies with every request

function QuestionCoPo() {
  const location = useLocation();
  const navigate = useNavigate();

  // Destructure data from location.state
  const initialQuestionName = location.state?.questionName;
  const initialQuestionWeight = location.state?.questionWeight;
  const questionData = location.state?.questionData;
  const [classroom_id, setClassroom_id] = useState(
    location.state?.classroom_id
  );

  const [question, setQuestion] = useState(null);
  const [errorPopup, setErrorPopup] = useState(false);

  // New editable state for question name and weight
  const [editableQuestionName, setEditableQuestionName] =
    useState(initialQuestionName);
  const [editableQuestionWeight, setEditableQuestionWeight] = useState(
    initialQuestionWeight
  );

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [error, setError] = useState("");

  const navItems = [];

  useEffect(() => {
    setQuestion(questionData);
  }, [initialQuestionName, initialQuestionWeight, questionData]);

  // Define dropdown options (no placeholder)
  const cognitiveDomainsOptions = [
    "Knowledge",
    "Understanding",
    "Analyzing",
    "Applying",
    "Creating",
    "Evaluating",
  ];
  const poOptions = Array.from({ length: 12 }, (_, i) => `PO${i + 1}`);

  // Update the co_po_mapping in the state when dropdown values change
  const handleMappingChange = (rowId, field, value) => {
    setQuestion((prev) => {
      const newQuestion = { ...prev };
      if (!newQuestion.co_po_mapping) newQuestion.co_po_mapping = {};

      const idParts = rowId.split(".");
      if (idParts.length === 1) {
        // Top-level mapping
        if (!newQuestion.co_po_mapping[rowId]) {
          newQuestion.co_po_mapping[rowId] = {};
        }
        newQuestion.co_po_mapping[rowId][field] = value;
      } else if (idParts.length === 2) {
        const [key, subKey] = idParts;
        if (!newQuestion.co_po_mapping[key]) {
          newQuestion.co_po_mapping[key] = {};
        }
        if (!newQuestion.co_po_mapping[key]["sub-sections"]) {
          newQuestion.co_po_mapping[key]["sub-sections"] = {};
        }
        if (!newQuestion.co_po_mapping[key]["sub-sections"][subKey]) {
          newQuestion.co_po_mapping[key]["sub-sections"][subKey] = {};
        }
        newQuestion.co_po_mapping[key]["sub-sections"][subKey][field] = value;
      } else if (idParts.length === 3) {
        const [key, subKey, subSubKey] = idParts;
        if (!newQuestion.co_po_mapping[key]) {
          newQuestion.co_po_mapping[key] = {};
        }
        if (!newQuestion.co_po_mapping[key]["sub-sections"]) {
          newQuestion.co_po_mapping[key]["sub-sections"] = {};
        }
        if (!newQuestion.co_po_mapping[key]["sub-sections"][subKey]) {
          newQuestion.co_po_mapping[key]["sub-sections"][subKey] = {};
        }
        if (
          !newQuestion.co_po_mapping[key]["sub-sections"][subKey][
            "sub-sub-sections"
          ]
        ) {
          newQuestion.co_po_mapping[key]["sub-sections"][subKey][
            "sub-sub-sections"
          ] = {};
        }
        if (
          !newQuestion.co_po_mapping[key]["sub-sections"][subKey][
            "sub-sub-sections"
          ][subSubKey]
        ) {
          newQuestion.co_po_mapping[key]["sub-sections"][subKey][
            "sub-sub-sections"
          ][subSubKey] = {};
        }
        newQuestion.co_po_mapping[key]["sub-sections"][subKey][
          "sub-sub-sections"
        ][subSubKey][field] = value;
      }
      return newQuestion;
    });
  };

  // Render rows for the mappings table.
  const renderMappings = () => {
    if (!question || !question.question_details) {
      return null;
    }

    const rows = [];

    Object.entries(question.question_details).forEach(([key, value]) => {
      // If there are no sub-sections:
      if (!value || !value["sub-sections"]) {
        rows.push({
          id: key,
          description: (
            <>
              <strong>{key + ". "}</strong>
              {value?.description || ""}
            </>
          ),
          PO: question?.co_po_mapping?.[key]?.PO || "",
          "Cognitive Domain":
            question?.co_po_mapping?.[key]?.["Cognitive Domain"] || "",
          marks: question?.co_po_mapping?.[key]?.marks || "",
        });
      } else {
        // Parent row (no marks => no dropdown)
        rows.push({
          id: key,
          description: (
            <>
              <strong>{key + ". "}</strong>
              {value?.description || ""}
            </>
          ),
          PO: "",
          "Cognitive Domain": "",
          marks: "",
        });

        Object.entries(value["sub-sections"] || {}).forEach(
          ([subKey, subValue]) => {
            if (!subValue || !subValue["sub-sub-sections"]) {
              rows.push({
                id: `${key}.${subKey}`,
                description: (
                  <>
                    <strong>{subKey + ". "}</strong>
                    {subValue?.description || ""}
                  </>
                ),
                PO:
                  question?.co_po_mapping?.[key]?.["sub-sections"]?.[subKey]
                    ?.PO || "",
                "Cognitive Domain":
                  question?.co_po_mapping?.[key]?.["sub-sections"]?.[subKey]?.[
                    "Cognitive Domain"
                  ] || "",
                marks:
                  question?.co_po_mapping?.[key]?.["sub-sections"]?.[subKey]
                    ?.marks || "",
              });
            } else {
              // Sub-section parent row
              rows.push({
                id: `${key}.${subKey}`,
                description: (
                  <>
                    <strong>{subKey + ". "}</strong>
                    {subValue?.description || ""}
                  </>
                ),
                PO: "",
                "Cognitive Domain": "",
                marks: "",
              });

              Object.entries(subValue["sub-sub-sections"] || {}).forEach(
                ([subSubKey, subSubValue]) => {
                  rows.push({
                    id: `${key}.${subKey}.${subSubKey}`,
                    description: (
                      <>
                        <strong>{subSubKey + ". "}</strong>
                        {subSubValue?.description || ""}
                      </>
                    ),
                    PO:
                      question?.co_po_mapping?.[key]?.["sub-sections"]?.[
                        subKey
                      ]?.["sub-sub-sections"]?.[subSubKey]?.PO || "",
                    "Cognitive Domain":
                      question?.co_po_mapping?.[key]?.["sub-sections"]?.[
                        subKey
                      ]?.["sub-sub-sections"]?.[subSubKey]?.[
                        "Cognitive Domain"
                      ] || "",
                    marks:
                      question?.co_po_mapping?.[key]?.["sub-sections"]?.[
                        subKey
                      ]?.["sub-sub-sections"]?.[subSubKey]?.marks || "",
                  });
                }
              );
            }
          }
        );
      }
    });

    return rows.map((row, index) => {
      const { marks } = row;
      return (
        <tr key={index}>
          <td className="px-4 py-2 border">
            <div className="w-full" style={{ whiteSpace: "pre-wrap" }}>
              {row?.description || ""}
            </div>
          </td>

          {/* PO cell */}
          <td className="px-4 py-2 border text-center">
            {marks ? (
              <select
                value={row.PO}
                onChange={(e) =>
                  handleMappingChange(row.id, "PO", e.target.value)
                }
                className="w-full border rounded p-1"
              >
                {poOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <span></span>
            )}
          </td>

          {/* Cognitive Domain cell */}
          <td className="px-4 py-2 border text-center">
            {marks ? (
              <select
                value={row["Cognitive Domain"]}
                onChange={(e) =>
                  handleMappingChange(
                    row.id,
                    "Cognitive Domain",
                    e.target.value
                  )
                }
                className="w-full border rounded p-1"
              >
                {cognitiveDomainsOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <span></span>
            )}
          </td>

          {/* Marks cell */}
          <td className="px-4 py-2 border text-center">
            <span>{row?.marks || ""}</span>
          </td>
        </tr>
      );
    });
  };

  // Handles the "Create Question" button click
  const handleCreateQuestion = async () => {
    setError("");
    setPopupMessage("");
    if (!question) {
      setError("Failed to load question data. Please try again.");
    }

    if (!editableQuestionName || !editableQuestionWeight) {
      setError("Question name or weight cannot be empty.");
      return;
    }

    const token = localStorage.getItem("accessToken");
      if (!token) {
        setErrorPopup(true);
        setTimeout(() => {
          // Redirect to Home
          navigate("/", { replace: true });

          // Prevent back navigation
          window.history.pushState(null, null, window.location.href);
          window.onpopstate = () => {
            window.history.go(1);
          };
        }, 3000);
        return;
      }

    // Prepare the payload using the editable fields
    const payload = {
      name: editableQuestionName,
      weight: Number(editableQuestionWeight),
      co_po_mapping: question.co_po_mapping || {},
      question_details: question.question_details || {},
      classroom_id: classroom_id,
    };

    try {
      setIsLoading(true);
      // Make your POST request (update the URL as per your backend)
      const response = await axios.post(
        `${API_URL}/question`,
        payload,
        {
          headers: {
            accessToken: token,
          },
        }
      );

      if (response.status === 201) {
        if(response?.headers?.accesstoken){
          localStorage.setItem("accessToken", response.headers.accesstoken);
        }
        // On success, show success message
        setTimeout(() => {
          setIsLoading(false);
          setPopupMessage("Question created successfully!");
        }, 1500);

        // Hide popup after 3 seconds and navigate
        setTimeout(() => {
          setPopupMessage("");
          window.history.replaceState(null, "", "/allquestions"); // Clear forward history
          navigate("/allquestions", {
            state: {
              classroom_id,
            },
            replace : true
          });
        }, 3000);
      } else {
        setTimeout(() => {
          setIsLoading(false);
          setPopupMessage(response.data?.message);
          setPopupMessage("");
        }, 1500);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setIsLoading(false);
        setErrorPopup(true);
        setTimeout(() => {
          // Redirect to Home
          navigate("/", { replace: true });

          // Prevent back navigation
          window.history.pushState(null, null, window.location.href);
          window.onpopstate = () => {
            window.history.go(1);
          };
        }, 3000);
        return ;
      }
      setTimeout(() => {
        setIsLoading(false);
        setError(err.response?.data?.message || "Some error occured. Please try again.");
        setPopupMessage("");
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col bg-white min-h-screen overflow-x-hidden">
      <Navbar navItems={navItems} logout={true} />
      <div className="h-16"></div>
      <ErrorPopup
        visible={errorPopup}
        errorMessage={
          "Your login session has been expired. Please login again."
        }
      ></ErrorPopup>
      {/* Popup Message */}
      {popupMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-blue-500 text-white px-6 py-4 rounded-md shadow-lg">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Question Created Successfully!</span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 mt-8 mb-6">
        {/* Header Section with Editable Question Name, Weight, and Create Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="question_name"
              className="block font-bold text-left text-black"
            >
              Question Name:
            </label>
            <input
              type="text"
              spellCheck={false}
              value={editableQuestionName}
              onChange={(e) => setEditableQuestionName(e.target.value)}
              className="p-2 w-64 border border-black rounded-md focus:outline-none"
            />
            <label
              htmlFor="weight"
              className="block font-bold text-left text-black"
            >
              Weight:
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={editableQuestionWeight}
              className="border p-2 w-24 border-black rounded-md focus:outline-none"
              onChange={(e) => {
                let newVal = e.target.value.trim();
                if (newVal === "") {
                  setEditableQuestionWeight(newVal);
                  return;
                }
                newVal = parseFloat(newVal);
                if (isNaN(newVal) || newVal < 1) {
                  newVal = 1;
                }
                if (newVal > 100) {
                  newVal = 100;
                }
                setEditableQuestionWeight(newVal);
              }}
              onBlur={(e) => {
                let newVal = e.target.value.trim();
                if (newVal === "" || isNaN(parseFloat(newVal))) {
                  setEditableQuestionWeight(1);
                }
              }}
            />
          </div>
        </div>

        <div>
          {error && <p className="text-red-500 mb-4 font-bold">{error}</p>}
          {isLoading && (
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
          <div className="flex flex-row items-center justify-between mb-4">
            <h2 className="text-lg font-semibold ">CO-PO Mappings</h2>

            <button
              onClick={handleCreateQuestion}
              disabled={isLoading}
              className={`bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Create Question
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left border border-gray-300">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-4 py-2 border font-inter font-semibold text-center">
                    Question
                  </th>
                  <th className="px-4 py-2 border font-inter font-semibold text-center">
                    Mapped PO
                  </th>
                  <th className="px-4 py-2 border font-inter font-semibold text-center">
                    Mapped Cognitive Domain
                  </th>
                  <th className="px-4 py-2 border font-inter font-semibold text-center">
                    Marks
                  </th>
                </tr>
              </thead>
              <tbody>{renderMappings()}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionCoPo;
