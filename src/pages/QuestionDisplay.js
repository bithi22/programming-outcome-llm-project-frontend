import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";

axios.defaults.withCredentials = true; // Enables sending cookies with every request

function QuestionDisplay() {
  const location = useLocation();
  const navigate = useNavigate();

  const classroom_id = location.state?.classroom_id;
  const question_id = location.state?.question_id;

  const [question, setQuestion] = useState(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedWeight, setEditedWeight] = useState("");
  const [editedMapping, setEditedMapping] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingUpdateError, setLoadingUpdateError] = useState("");

  // New state for mobile hamburger menus
  const [mobileMenuGroup1Open, setMobileMenuGroup1Open] = useState(false);
  const [mobileMenuGroup2Open, setMobileMenuGroup2Open] = useState(false);

  const navItems = [];

  // Options for the dropdowns
  const poOptions = Array.from({ length: 12 }, (_, i) => `PO${i + 1}`);
  const cogDomainOptions = [
    "Knowledge",
    "Understanding",
    "Analyzing",
    "Applying",
    "Creating",
    "Evaluating",
  ];

  useEffect(() => {
    setIsLoading(true);
    if (!classroom_id || !question_id) {
      setError("Classroom ID or Question ID not provided.");
      return;
    }

    const fetchQuestionDetails = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("You are not logged in. Please log in first.");
          return;
        }

        const response = await axios.get(
          `http://localhost:8000/question/${question_id}`,
          {
            headers: {
              accessToken: token,
            },
          }
        );
        setTimeout(() => {
          setIsLoading(false);
          setQuestion(response.data.data);
        }, 1500);
      } catch (error) {
        setTimeout(() => {
          setIsLoading(false);
          setError(error.response?.data?.message);
        }, 1500);
      }
    };

    fetchQuestionDetails();
  }, [classroom_id, question_id]);

  // Initialize edit fields when question loads or changes.
  useEffect(() => {
    if (question) {
      setEditedName(question.name);
      setEditedWeight(question.weight);
      // Create a deep copy to avoid mutating the original
      setEditedMapping(
        JSON.parse(JSON.stringify(question.co_po_mapping || {}))
      );
    }
  }, [question]);

  const handleGenerateResult = () => {
    navigate("/questionresult", {
      state: { classroom_id, question, question_id },
    });
  };

  const handleShowResult = () => {
    navigate("/showquestionreport", {
      state: { question_id, classroom_id, question_name: question.name },
    });
  };

  // Helper functions for getting and updating mapping values from editedMapping based on the row id (e.g. "1" or "1.2" or "1.2.3")
  const getMappingValue = (path, field) => {
    let value = "";
    if (!editedMapping) return value;
    if (path.length === 1) {
      value = editedMapping[path[0]]?.[field] || "";
    } else if (path.length === 2) {
      value =
        editedMapping[path[0]]?.["sub-sections"]?.[path[1]]?.[field] || "";
    } else if (path.length === 3) {
      value =
        editedMapping[path[0]]?.["sub-sections"]?.[path[1]]?.[
          "sub-sub-sections"
        ]?.[path[2]]?.[field] || "";
    }
    return value;
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditedName(question.name);
    setEditedWeight(question.weight);
    setEditedMapping(JSON.parse(JSON.stringify(question.co_po_mapping || {})));
    setLoadingUpdateError("");
    setLoadingUpdate(false);
  };

  const updateMappingValue = (path, field, newValue) => {
    setEditedMapping((prevMapping) => {
      const newMapping = { ...prevMapping };
      if (path.length === 1) {
        newMapping[path[0]] = {
          ...(newMapping[path[0]] || {}),
          [field]: newValue,
        };
      } else if (path.length === 2) {
        newMapping[path[0]] = {
          ...newMapping[path[0]],
          "sub-sections": {
            ...((newMapping[path[0]] && newMapping[path[0]]["sub-sections"]) ||
              {}),
            [path[1]]: {
              ...((newMapping[path[0]] &&
                newMapping[path[0]]["sub-sections"] &&
                newMapping[path[0]]["sub-sections"][path[1]]) ||
                {}),
              [field]: newValue,
            },
          },
        };
      } else if (path.length === 3) {
        newMapping[path[0]] = {
          ...newMapping[path[0]],
          "sub-sections": {
            ...((newMapping[path[0]] && newMapping[path[0]]["sub-sections"]) ||
              {}),
            [path[1]]: {
              ...((newMapping[path[0]] &&
                newMapping[path[0]]["sub-sections"] &&
                newMapping[path[0]]["sub-sections"][path[1]]) ||
                {}),
              "sub-sub-sections": {
                ...((newMapping[path[0]] &&
                  newMapping[path[0]]["sub-sections"] &&
                  newMapping[path[0]]["sub-sections"][path[1]] &&
                  newMapping[path[0]]["sub-sections"][path[1]][
                    "sub-sub-sections"
                  ]) ||
                  {}),
                [path[2]]: {
                  ...((newMapping[path[0]] &&
                    newMapping[path[0]]["sub-sections"] &&
                    newMapping[path[0]]["sub-sections"][path[1]] &&
                    newMapping[path[0]]["sub-sections"][path[1]][
                      "sub-sub-sections"
                    ] &&
                    newMapping[path[0]]["sub-sections"][path[1]][
                      "sub-sub-sections"
                    ][path[2]]) ||
                    {}),
                  [field]: newValue,
                },
              },
            },
          },
        };
      }
      return newMapping;
    });
  };

  // Modified renderMappings to use dropdowns in edit mode for PO and Cognitive Domain
  // but only for rows that have marks.
  const renderMappings = () => {
    if (!question || !question.question_details) {
      return null;
    }

    const rows = [];

    Object.entries(question.question_details).forEach(([key, value]) => {
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
                ([sub_sub_key, sub_sub_value]) => {
                  rows.push({
                    id: `${key}.${subKey}.${sub_sub_key}`,
                    description: (
                      <>
                        <strong>{sub_sub_key + ". "}</strong>
                        {sub_sub_value?.description || ""}
                      </>
                    ),
                    PO:
                      question?.co_po_mapping?.[key]?.["sub-sections"]?.[
                        subKey
                      ]?.["sub-sub-sections"]?.[sub_sub_key]?.PO || "",
                    "Cognitive Domain":
                      question?.co_po_mapping?.[key]?.["sub-sections"]?.[
                        subKey
                      ]?.["sub-sub-sections"]?.[sub_sub_key]?.[
                        "Cognitive Domain"
                      ] || "",
                    marks:
                      question?.co_po_mapping?.[key]?.["sub-sections"]?.[
                        subKey
                      ]?.["sub-sub-sections"]?.[sub_sub_key]?.marks || "",
                  });
                }
              );
            }
          }
        );
      }
    });

    return rows.map((row, index) => {
      const path = row.id.split(".");
      return (
        <tr key={index}>
          <td className="px-4 py-2 border">
            <div className="w-full" style={{ whiteSpace: "pre-wrap" }}>
              {row?.description || ""}
            </div>
          </td>
          <td className="px-4 py-2 border text-center">
            {isEditing && row.marks ? (
              <select
                value={getMappingValue(path, "PO")}
                onChange={(e) => updateMappingValue(path, "PO", e.target.value)}
                className="border px-2 py-1"
              >
                <option value="">Select</option>
                {poOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getMappingValue(path, "PO") || row?.PO || ""}</span>
            )}
          </td>
          <td className="px-4 py-2 border text-center">
            {isEditing && row.marks ? (
              <select
                value={getMappingValue(path, "Cognitive Domain")}
                onChange={(e) =>
                  updateMappingValue(path, "Cognitive Domain", e.target.value)
                }
                className="border px-2 py-1"
              >
                <option value="">Select</option>
                {cogDomainOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {getMappingValue(path, "Cognitive Domain") ||
                  row?.["Cognitive Domain"] ||
                  ""}
              </span>
            )}
          </td>
          <td className="px-4 py-2 border text-center">
            <span>{row?.marks || ""}</span>
          </td>
        </tr>
      );
    });
  };

  const handleSaveChanges = async () => {
    setLoadingUpdateError("");
    if (!editedName || !editedWeight) {
      setLoadingUpdateError("Question name or weight cannot be empty.");
      return;
    }
    setLoadingUpdate(true);
    try {
      const token = localStorage.getItem("accessToken");
      const payload = {
        name: editedName,
        weight: editedWeight,
        co_po_mapping: editedMapping,
        question_id: question_id,
      };
      const response = await axios.put(
        "http://localhost:8000/question/update-co-po-mapping",
        payload,
        {
          headers: { accessToken: token },
        }
      );
      // Update the question state with edited values
      setTimeout(() => {
        setQuestion({
          ...question,
          name: editedName,
          weight: editedWeight,
          co_po_mapping: editedMapping,
        });
        setIsEditing(false);
        setLoadingUpdate(false);
      }, 1500);
    } catch (error) {
      setTimeout(() => {
        setIsEditing(false);
        setLoadingUpdateError(error.response?.data?.message);
      }, 1500);
    }
  };

  if (!classroom_id || !question_id) {
    return (
      <div className="text-red-500 text-center mt-10">
        Classroom ID or Question ID not provided.
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white min-h-screen overflow-x-hidden">
      <Navbar navItems={navItems} logout={true} />
      <div className="h-16"></div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="container mx-auto px-6 mt-8 mb-6">
            <div className="bg-white shadow-md rounded-lg p-6">
              <motion.div
                className="animate-pulse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
              </motion.div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="container mx-auto px-6 mt-8 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  {isEditing ? (
                    <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2">
                      <label
                        htmlFor="question_name"
                        className="block font-bold text-left text-black"
                      >
                        Question Name:
                      </label>
                      <input
                        type="text"
                        spellCheck={false}
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
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
                        min="1"
                        max="100"
                        value={editedWeight}
                        className="border p-2 w-24 border-black rounded-md focus:outline-none"
                        onChange={(e) => {
                          let newVal = e.target.value.trim();
                          if (newVal === "") {
                            setEditedWeight(newVal);
                            return;
                          }
                          newVal = parseFloat(newVal);
                          if (isNaN(newVal) || newVal < 1) {
                            newVal = 1;
                          }
                          if (newVal > 100) {
                            newVal = 100;
                          }
                          setEditedWeight(newVal);
                        }}
                        onBlur={(e) => {
                          let newVal = e.target.value.trim();
                          if (newVal === "" || isNaN(parseFloat(newVal))) {
                            setEditedWeight(1);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <h1 className="text-xl font-bold">
                      {question?.name || "No Question Name Provided"}{" "}
                      {question?.weight ? `(${question.weight}%)` : ""}
                    </h1>
                  )}
                </div>
                {/* Group 1 Buttons: Marksheet & Reports */}
                {/* Desktop inline buttons */}
                <div className="hidden lg:flex space-x-2">
                  <button
                    onClick={handleGenerateResult}
                    disabled={isLoading}
                    className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Marksheet
                  </button>
                  {question?.report_submitted && (
                    <button
                      onClick={handleShowResult}
                      className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC]"
                    >
                      Reports
                    </button>
                  )}
                </div>

                {/* Mobile hamburger for Group 1 */}
                <div className="lg:hidden relative z-20">
                  <button
                    onClick={() =>
                      setMobileMenuGroup1Open(!mobileMenuGroup1Open)
                    }
                    className="text-black focus:outline-none"
                  >
                    {mobileMenuGroup1Open ? (
                      <FaTimes size={24} />
                    ) : (
                      <FaBars size={24} />
                    )}
                  </button>
                  {mobileMenuGroup1Open && (
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md border border-gray-300 py-2 px-4 flex flex-col space-y-2">
                      <button
                        onClick={() => {
                          handleGenerateResult();
                          setMobileMenuGroup1Open(false);
                        }}
                        className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                      >
                        Marksheet
                      </button>
                      {question?.report_submitted && (
                        <button
                          onClick={() => {
                            handleShowResult();
                            setMobileMenuGroup1Open(false);
                          }}
                          className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                        >
                          Reports
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold ">CO-PO Mappings</h2>
                  {/* Group 2 Buttons */}
                  {/* Desktop inline buttons */}
                  {!isEditing ? (
                    <div className="hidden lg:flex">
                      <button
                        onClick={() => setIsEditing(true)}
                        disabled={isLoading}
                        className="border-2 border-[#3941FF] text-[#3941FF] py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] hover:text-white hover:border-[#2C36CC] transition"
                      >
                        Edit Table
                      </button>
                    </div>
                  ) : (
                    <div className="hidden lg:flex space-x-4">
                      <button
                        onClick={handleSaveChanges}
                        disabled={loadingUpdate}
                        className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelEditing}
                        disabled={loadingUpdate}
                        className="bg-gray-300 text-black py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {/* Mobile hamburger for Group 2 */}
                  <div className="lg:hidden relative">
                    <button
                      onClick={() =>
                        setMobileMenuGroup2Open(!mobileMenuGroup2Open)
                      }
                      className="text-black focus:outline-none"
                    >
                      {mobileMenuGroup2Open ? (
                        <FaTimes size={24} />
                      ) : (
                        <FaBars size={24} />
                      )}
                    </button>
                    {mobileMenuGroup2Open && (
                      <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md border border-gray-300 py-2 px-4 flex flex-col space-y-2">
                        {!isEditing ? (
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setMobileMenuGroup2Open(false);
                            }}
                            disabled={isLoading}
                            className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                          >
                            Edit Table
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                handleSaveChanges();
                                setMobileMenuGroup2Open(false);
                              }}
                              disabled={loadingUpdate}
                              className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => {
                                handleCancelEditing();
                                setMobileMenuGroup2Open(false);
                              }}
                              disabled={loadingUpdate}
                              className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {loadingUpdateError && (
                  <p className="text-red-500 mb-4 font-bold">
                    {loadingUpdateError}
                  </p>
                )}
                {loadingUpdate && (
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

                <div className="overflow-x-auto">
                  <table className="table-auto w-full text-left border border-gray-300">
                    <thead className="bg-black text-white">
                      <tr>
                        <th className="px-4 py-2 border text-center">Question</th>
                        <th className="px-4 py-2 border text-center">Mapped PO</th>
                        <th className="px-4 py-2 border text-center">
                          Mapped Cognitive Domain
                        </th>
                        <th className="px-4 py-2 border text-center">Marks</th>
                      </tr>
                    </thead>
                    <tbody>{renderMappings()}</tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QuestionDisplay;
