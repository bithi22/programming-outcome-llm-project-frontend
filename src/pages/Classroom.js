import React, { useState, useEffect } from "react";
import { data, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { FiCopy } from "react-icons/fi";
import { FaBars, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

axios.defaults.withCredentials = true; // Enables sending cookies with every request

function Classroom() {
  const [classroomDetails, setClassroomDetails] = useState(null);
  const [error, setError] = useState("");
  const [isClassroomLoading, setIsClassroomLoading] = useState(true);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [editedCoPoTable, setEditedCoPoTable] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyllabusLoading, setIsSyllabusLoading] = useState(false);
  const [coPoEditError, setCoPoEditError] = useState("");
  const [syllabusError, setSyllabusError] = useState("");
  const [showInviteCard, setShowInviteCard] = useState(false);
  const [teacherCopySuccess, setTeacherCopySuccess] = useState(false);
  const [committeeCopySuccess, setCommitteeCopySuccess] = useState(false);

  // New state variables for mobile menus
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isTableActionMenuOpen, setIsTableActionMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const classroom_id = location.state?.classroom_id;

  const navItems = [];
  const actionButton = { label: "Logout", path: "/logout" };

  // Copy functions for teacher and committee codes
  const copyTeacherCode = () => {
    const code = classroomDetails?.teacher_code || "";
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setTeacherCopySuccess(true);
        setTimeout(() => setTeacherCopySuccess(false), 2000);
      })
      .catch((err) => console.error("Failed to copy teacher code", err));
  };

  const copyCommitteeCode = () => {
    const code = classroomDetails?.committee_code || "";
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCommitteeCopySuccess(true);
        setTimeout(() => setCommitteeCopySuccess(false), 2000);
      })
      .catch((err) => console.error("Failed to copy committee code", err));
  };

  // Fetch classroom details
  useEffect(() => {
    if (!classroom_id) {
      setError("Classroom ID not provided.");
      setIsClassroomLoading(false);
      return;
    }
    fetchClassroomDetails(classroom_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClassroomDetails = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("You are not logged in. Please log in first.");
        return;
      }
      const response = await axios.get(
        `http://localhost:8000/classroom/${id}`,
        {
          headers: {
            accessToken: token,
          },
        }
      );
      setClassroomDetails(response.data.data);
    } catch (error) {
      setError("Failed to fetch classroom details. Please try again.");
    } finally {
      setIsClassroomLoading(false);
    }
  };

  // Syllabus mapping
  const handleGetCoPoMapping = async () => {
    if (!syllabusText.trim()) {
      setSyllabusError("Syllabus cannot be empty.");
      return;
    }
    setIsSyllabusLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("You are not logged in. Please log in first.");
        setIsSyllabusLoading(false);
        return;
      }
      const response = await axios.post(
        "http://localhost:8000/classroom/co-po-mapping",
        { classroom_id, syllabus: syllabusText },
        {
          headers: {
            accessToken: token,
          },
        }
      );

      if (response.status === 200 && response.data.success) {
        // Wait 500ms before navigating
        setTimeout(() => {
          setIsSyllabusLoading(false);
          setIsSyllabusModalOpen(false);
          setSyllabusError("");
          navigate("/copomapping", {
            state: {
              classroom_id,
              syllabus: syllabusText,
              copoData: response.data.data,
            },
          });
        }, 1500);
      } else {
        setTimeout(() => {
          setIsSyllabusLoading(false);
          setSyllabusError(response.data?.message);
        }, 1500);
      }
    } catch (error) {
      setTimeout(() => {
        setIsSyllabusLoading(false);
        setSyllabusError(error.response?.data?.message);
      }, 1500);
    }
  };

  const handleQuestionClick = () => {
    navigate("/allquestions", { state: { classroom_id } });
  };

  // Start editing: create a deep copy of the current co_po_table,
  // but store "co_label" inside each object so the user can rename it.
  const handleEditTable = () => {
    if (!classroomDetails?.co_po_table) {
      setError("No CO-PO data available to edit.");
      setTimeout(() => {
        setError("");
      }, 3000);
      return;
    }
    const tempTable = {};
    Object.entries(classroomDetails.co_po_table).forEach(([key, val]) => {
      tempTable[key] = {
        co_label: key,
        description: val.description || "",
        "Cognitive Domain": val["Cognitive Domain"] || "Knowledge",
        PO: val.PO || "PO1",
        weight: val.weight || 1,
      };
    });
    setEditedCoPoTable(tempTable);
    setCoPoEditError("");
    setIsEditingTable(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditingTable(false);
    setEditedCoPoTable(null);
    setCoPoEditError("");
  };

  const handleReportsClick = () => {
    navigate("/showclassroomreport", {
      state: {
        classroom_id,
        committee_access: classroomDetails.committee_access,
        teacher_access: classroomDetails.teacher_access,
        classroom_name: classroomDetails.name,
      },
    });
  };

  // Save changes with validations
  const handleSaveChanges = async () => {
    setCoPoEditError("");
    let errors = [];

    Object.entries(editedCoPoTable).forEach(([key, val]) => {
      const coLabel = val.co_label.trim();
      if (!coLabel) {
        errors.push("CO label cannot be empty.");
      }
      if (!val.description.trim()) {
        errors.push(`Description for CO "${coLabel || key}" cannot be empty.`);
      }
      if (!val["Cognitive Domain"] || !val["Cognitive Domain"].trim()) {
        errors.push(
          `Cognitive Domain for CO "${coLabel || key}" cannot be empty.`
        );
      }
      if (!val.PO || !val.PO.trim()) {
        errors.push(`PO for CO "${coLabel || key}" cannot be empty.`);
      }
      if (
        val.weight === "" ||
        isNaN(Number(val.weight)) ||
        Number(val.weight) < 1
      ) {
        errors.push(
          `Weight for CO "${
            coLabel || key
          }" must be a number greater than or equal to 1.`
        );
      }
    });

    const labels = Object.values(editedCoPoTable).map((item) =>
      item.co_label.trim()
    );
    const duplicateLabels = labels.filter(
      (label, index) => labels.indexOf(label) !== index
    );
    if (duplicateLabels.length > 0) {
      errors.push("Duplicate CO labels are not allowed.");
    }

    const totalWeight = Object.values(editedCoPoTable).reduce(
      (sum, item) => sum + Number(item.weight),
      0
    );
    if (totalWeight !== 100) {
      errors.push(
        `Total weight of all CO's must be exactly 100. Current total is ${totalWeight}.`
      );
    }

    if (errors.length > 0) {
      setCoPoEditError(errors.join(" "));
      return;
    }

    setIsLoading(true);

    const finalTable = {};
    for (const [key, val] of Object.entries(editedCoPoTable)) {
      const newKey = val.co_label.trim() || key;
      finalTable[newKey] = {
        description: val.description,
        "Cognitive Domain": val["Cognitive Domain"],
        PO: val.PO,
        weight: Number(val.weight),
      };
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setCoPoEditError("You are not logged in. Please log in first.");
        setIsLoading(false);
        return;
      }
      const response = await axios.put(
        "http://localhost:8000/classroom/co-po-mapping",
        {
          classroom_id,
          co_po_table: finalTable,
        },
        {
          headers: {
            accessToken: token,
          },
        }
      );
      if (response.status === 200 && response.data.success) {
        setTimeout(() => {
          setClassroomDetails((prev) => ({
            ...prev,
            co_po_table: finalTable,
          }));
          setIsEditingTable(false);
          setEditedCoPoTable(null);
          setCoPoEditError("");
          setIsLoading(false);
        }, 1500);
      } else {
        setTimeout(() => {
          setIsLoading(false);
          setCoPoEditError(response.data.message);
        }, 1500);
      }
    } catch (error) {
      setTimeout(() => {
        setCoPoEditError(error.response?.data?.message);
        setIsLoading(false);
      }, 1500);
    }
  };

  // Add and delete row functions
  const handleAddRow = () => {
    const newKey = `temp_${Date.now()}`;
    setEditedCoPoTable((prev) => ({
      ...prev,
      [newKey]: {
        co_label: "",
        description: "",
        "Cognitive Domain": "Knowledge",
        PO: "PO1",
        weight: 1,
      },
    }));
  };

  const handleDeleteRow = (coKey) => {
    const { [coKey]: removed, ...rest } = editedCoPoTable;
    setEditedCoPoTable(rest);
  };

  const handleSyllabusCancelButton = () => {
    setSyllabusText("");
    setIsSyllabusModalOpen(false);
    setSyllabusError("");
  };

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <Navbar logout={true} />
      <div className="h-16"></div>

      {showInviteCard && (
        // Invite Members Modal Overlay
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-[300px] md:max-w-lg md:w-full pl-4 py-4 pr-2 md:p-6">
              <h2 className="text-xl font-semibold mb-4">Invite Members</h2>
              <div className="mb-4">
                <label className="block text-black mb-1">
                  Teacher Joining Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={classroomDetails?.teacher_code || ""}
                    className="w-full border px-2 py-1 pr-10 text-xs md:text-base"
                  />
                  <button
                    onClick={copyTeacherCode}
                    className="absolute inset-y-0 right-0 flex items-center pr-2"
                  >
                    <FiCopy size={18} />
                  </button>
                </div>
                {teacherCopySuccess && (
                  <span className="text-green-500 text-xs mt-1 block">
                    Copied to clipboard!
                  </span>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-black mb-1">
                  Committee Member Joining Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={classroomDetails?.committee_code || ""}
                    className="w-full border px-2 py-1 pr-10 text-xs md:text-base"
                  />
                  <button
                    onClick={copyCommitteeCode}
                    className="absolute inset-y-0 right-0 flex items-center pr-2"
                  >
                    <FiCopy size={18} />
                  </button>
                </div>
                {committeeCopySuccess && (
                  <span className="text-green-500 text-xs mt-1 block">
                    Copied to clipboard!
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowInviteCard(false)}
                className="bg-gray-300 text-black py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-gray-400"
              >
                Back
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mb-4">
        <AnimatePresence mode="wait">
          {isClassroomLoading ? (
            <div className="container mx-auto px-6 mt-8">
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
              <div className="container mx-auto px-6 mt-8">
                {error && (
                  <div className="text-red-500 font-semibold mb-4">{error}</div>
                )}
                <div className="bg-white shadow-md rounded-lg overflow-visible mb-8">
                  <img
                    src="/assets/longImage.png"
                    alt="Class Banner"
                    className="w-full h-56 object-cover"
                  />
                  <div className="p-4 flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {classroomDetails?.name || "Classroom Name"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-2">
                        Course: {classroomDetails?.course || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Course Code: {classroomDetails?.course_code || "N/A"}
                      </p>
                      <button
                        onClick={() => setShowInviteCard(true)}
                        className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] mt-2 hover:bg-[#2C36CC]"
                      >
                        Invite Members
                      </button>
                    </div>
                    {/* Action Buttons: Desktop & Mobile */}
                    <div className="flex items-center justify-end">
                      {/* Desktop version */}
                      <div className="hidden lg:flex space-x-4">
                        {classroomDetails?.co_po_table && (
                          <button
                            onClick={handleReportsClick}
                            className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] hover:bg-[#2C36CC]"
                          >
                            Classroom Reports
                          </button>
                        )}
                        {classroomDetails?.teacher_access &&
                          classroomDetails?.co_po_table && (
                            <button
                              onClick={handleQuestionClick}
                              className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] hover:bg-[#2C36CC]"
                            >
                              Questions
                            </button>
                          )}
                        {classroomDetails?.committee_access && (
                          <button
                            onClick={() => setIsSyllabusModalOpen(true)}
                            className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] hover:bg-[#2C36CC]"
                          >
                            Update Syllabus
                          </button>
                        )}
                      </div>
                      {/* Mobile version */}
                      <div className="flex lg:hidden relative">
                        <button
                          onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                          className="text-black focus:outline-none"
                        >
                          {isActionMenuOpen ? (
                            <FaTimes size={24} />
                          ) : (
                            <FaBars size={24} />
                          )}
                        </button>
                        {isActionMenuOpen && (
                          <div className="absolute right-0 mt-6 w-48 bg-white shadow-md rounded-md border border-gray-300 py-2 px-4 flex flex-col space-y-2 z-50">
                            {classroomDetails?.co_po_table && (
                              <button
                                onClick={() => {
                                  setIsActionMenuOpen(false);
                                  handleReportsClick();
                                }}
                                className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                              >
                                Classroom Reports
                              </button>
                            )}

                            {classroomDetails?.teacher_access &&
                              classroomDetails?.co_po_table && (
                                <button
                                  onClick={() => {
                                    setIsActionMenuOpen(false);
                                    handleQuestionClick();
                                  }}
                                  className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                                >
                                  Questions
                                </button>
                              )}
                            {classroomDetails?.committee_access && (
                              <button
                                onClick={() => {
                                  setIsActionMenuOpen(false);
                                  setIsSyllabusModalOpen(true);
                                }}
                                className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                              >
                                Update Syllabus
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-t border-gray-800 my-4 mx-auto" />

                {/* CO-PO Table Header + Buttons */}
                <div className="flex flex-col bg-white shadow-md rounded-lg px-4 py-4">
                  <div className="flex justify-between items-center mb-4 ">
                    <h2 className="text-lg font-semibold">CO-PO Table</h2>
                    {/* Desktop table actions */}
                    <div className="hidden lg:flex items-center justify-center space-x-4">
                      {isLoading && (
                        <div className="flex py-2">
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
                      {classroomDetails?.committee_access &&
                        classroomDetails?.co_po_table &&
                        !isEditingTable && (
                          <button
                            onClick={handleEditTable}
                            className="border-2 border-[#3941FF] text-[#3941FF] py-2 px-4 rounded-md font-inter font-semibold text-[16px] hover:bg-[#2C36CC] hover:text-white hover:border-[#2C36CC]"
                          >
                            Edit Table
                          </button>
                        )}
                      {isEditingTable &&
                        classroomDetails?.committee_access &&
                        classroomDetails?.co_po_table && (
                          <>
                            <button
                              onClick={handleAddRow}
                              disabled={isLoading}
                              className={`bg-green-700 text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] hover:bg-green-800 ${
                                isLoading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              Add CO
                            </button>
                            <button
                              onClick={handleSaveChanges}
                              disabled={isLoading}
                              className={`bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] hover:bg-[#2C36CC] ${
                                isLoading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isLoading}
                              className={`bg-gray-300 text-black py-2 px-4 rounded-md font-inter font-semibold text-[16px] hover:bg-gray-400 ${
                                isLoading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                    </div>
                    {/* Mobile table actions */}

                    {classroomDetails?.co_po_table && (
                      <div className="flex lg:hidden relative">
                        <button
                          onClick={() =>
                            setIsTableActionMenuOpen(!isTableActionMenuOpen)
                          }
                          className="text-black focus:outline-none"
                        >
                          {isTableActionMenuOpen ? (
                            <FaTimes size={24} />
                          ) : (
                            <FaBars size={24} />
                          )}
                        </button>
                        {isTableActionMenuOpen && (
                          <div className="absolute right-0 mt-6 w-48 bg-white shadow-md rounded-md border border-gray-300 py-2 px-4 flex flex-col space-y-2">
                            {isLoading && (
                              <div className="flex items-center py-2">
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
                                <span className="mx-2 text-sm">
                                  Please wait...
                                </span>
                              </div>
                            )}
                            {classroomDetails?.committee_access &&
                              !isEditingTable && (
                                <button
                                  onClick={() => {
                                    setIsTableActionMenuOpen(false);
                                    handleEditTable();
                                  }}
                                  className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                                >
                                  Edit Table
                                </button>
                              )}
                            {isEditingTable &&
                              classroomDetails?.committee_access && (
                                <>
                                  <button
                                    onClick={() => {
                                      setIsTableActionMenuOpen(false);
                                      handleAddRow();
                                    }}
                                    className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                                  >
                                    Add CO
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsTableActionMenuOpen(false);
                                      handleSaveChanges();
                                    }}
                                    className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                                  >
                                    Save Changes
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsTableActionMenuOpen(false);
                                      handleCancelEdit();
                                    }}
                                    className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {isEditingTable && coPoEditError && (
                    <div className="text-red-500 text-sm mb-4">
                      {coPoEditError}
                    </div>
                  )}
                  {/* CO-PO Table */}
                  <div className="overflow-x-auto">
                    <table className="table-auto w-full text-left border border-gray-300">
                      <thead className="bg-black text-white text-center">
                        <tr>
                          <th className="px-4 py-2 border w-32">CO</th>
                          <th className="px-4 py-2 border w-1/2">
                            Description
                          </th>
                          <th className="px-4 py-2 border w-60">
                            Cognitive Domain
                          </th>
                          <th className="px-4 py-2 border w-40">PO</th>
                          <th className="px-4 py-2 border w-24">Weight</th>
                          {isEditingTable &&
                            classroomDetails?.committee_access && (
                              <th className="px-4 py-2 border w-24">Action</th>
                            )}
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          isEditingTable
                            ? editedCoPoTable
                            : classroomDetails?.co_po_table
                        ) ? (
                          Object.entries(
                            isEditingTable
                              ? editedCoPoTable
                              : classroomDetails.co_po_table
                          ).map(([key, details], index) => {
                            const coLabel = isEditingTable
                              ? details.co_label
                              : key;
                            const description = details.description;
                            const domain = details["Cognitive Domain"];
                            const po = details.PO;
                            const weight = details.weight;
                            return (
                              <tr key={index}>
                                <td className="pr-1 pl-1 py-2 lg:px-6 border text-center">
                                  {isEditingTable ? (
                                    <input
                                      type="text"
                                      className="w-full border px-2 py-1 text-center"
                                      value={coLabel}
                                      onChange={(e) => {
                                        const newValue = e.target.value;
                                        setEditedCoPoTable((prev) => ({
                                          ...prev,
                                          [key]: {
                                            ...prev[key],
                                            co_label: newValue,
                                          },
                                        }));
                                      }}
                                    />
                                  ) : (
                                    coLabel
                                  )}
                                </td>
                                <td className="pr-1 pl-1 py-2 lg:px-6 border">
                                  {isEditingTable ? (
                                    <textarea
                                      rows={5}
                                      className="w-full border px-2 py-1"
                                      value={description}
                                      onChange={(e) => {
                                        const newValue = e.target.value;
                                        setEditedCoPoTable((prev) => ({
                                          ...prev,
                                          [key]: {
                                            ...prev[key],
                                            description: newValue,
                                          },
                                        }));
                                      }}
                                    />
                                  ) : (
                                    description || "No description provided"
                                  )}
                                </td>
                                <td className="pr-1 pl-1 py-2 lg:px-6 border text-center">
                                  {isEditingTable ? (
                                    <select
                                      className="w-full border px-2 py-1"
                                      value={domain}
                                      onChange={(e) => {
                                        const newValue = e.target.value;
                                        setEditedCoPoTable((prev) => ({
                                          ...prev,
                                          [key]: {
                                            ...prev[key],
                                            "Cognitive Domain": newValue,
                                          },
                                        }));
                                      }}
                                    >
                                      <option value="Knowledge">
                                        Knowledge
                                      </option>
                                      <option value="Understanding">
                                        Understanding
                                      </option>
                                      <option value="Analyzing">
                                        Analyzing
                                      </option>
                                      <option value="Applying">Applying</option>
                                      <option value="Creating">Creating</option>
                                      <option value="Evaluating">
                                        Evaluating
                                      </option>
                                    </select>
                                  ) : (
                                    domain || "No domain provided"
                                  )}
                                </td>
                                <td className="pr-1 pl-1 py-2 lg:px-6 border text-center">
                                  {isEditingTable ? (
                                    <select
                                      className="w-full border px-2 py-1"
                                      value={po}
                                      onChange={(e) => {
                                        const newValue = e.target.value;
                                        setEditedCoPoTable((prev) => ({
                                          ...prev,
                                          [key]: {
                                            ...prev[key],
                                            PO: newValue,
                                          },
                                        }));
                                      }}
                                    >
                                      {Array.from({ length: 12 }, (_, i) => {
                                        const optionValue = `PO${i + 1}`;
                                        return (
                                          <option key={i} value={optionValue}>
                                            {optionValue}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  ) : (
                                    po || "No PO data provided"
                                  )}
                                </td>
                                <td className="pr-1 pl-1 py-2 lg:px-6 text-center border text-center">
                                  {isEditingTable ? (
                                    <input
                                      type="number"
                                      min="1"
                                      max="100"
                                      className="w-full border text-center px-2 py-1"
                                      value={weight}
                                      onChange={(e) => {
                                        let newVal = e.target.value.trim();
                                        if (newVal === "") {
                                          setEditedCoPoTable((prev) => ({
                                            ...prev,
                                            [key]: {
                                              ...prev[key],
                                              weight: "",
                                            },
                                          }));
                                          return;
                                        }
                                        newVal = parseFloat(newVal);
                                        if (isNaN(newVal) || newVal < 1) {
                                          newVal = 1;
                                        }
                                        setEditedCoPoTable((prev) => ({
                                          ...prev,
                                          [key]: {
                                            ...prev[key],
                                            weight: newVal,
                                          },
                                        }));
                                      }}
                                      onBlur={(e) => {
                                        let newVal = e.target.value.trim();
                                        if (
                                          newVal === "" ||
                                          isNaN(parseFloat(newVal))
                                        ) {
                                          setEditedCoPoTable((prev) => ({
                                            ...prev,
                                            [key]: {
                                              ...prev[key],
                                              weight: 1,
                                            },
                                          }));
                                        }
                                      }}
                                    />
                                  ) : (
                                    weight || "No weight data provided"
                                  )}
                                </td>
                                {isEditingTable &&
                                  classroomDetails?.committee_access && (
                                    <td className="px-4 py-2 border">
                                      <button
                                        onClick={() => handleDeleteRow(key)}
                                        className="bg-red-500 text-white py-1 px-2 rounded-md hover:bg-red-600"
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  )}
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              className="px-4 py-2 border text-center"
                              colSpan={isEditingTable ? 6 : 5}
                            >
                              No CO-PO data available. Please upload the syllabus to get started.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Syllabus Modal */}
      {isSyllabusModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-[300px] md:w-[600px] p-6">
              <h2 className="text-xl font-semibold mb-4 text-left">
                Update Syllabus
              </h2>
              <textarea
                value={syllabusText}
                onChange={(e) => setSyllabusText(e.target.value)}
                className="w-full h-40 px-4 py-2 border border-black rounded-md mb-4 focus:outline-none"
                placeholder="Enter the syllabus here..."
              />
              {isSyllabusLoading && (
                <div className="flex justify-center mt-2 mb-4">
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
                    <span>Please wait. This may take a while</span>
                  </div>
                </div>
              )}
              {syllabusError && (
                <p className="text-red-500 mb-4 text-center font-bold">
                  {syllabusError}
                </p>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleSyllabusCancelButton}
                  className={`bg-gray-300 text-black py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-gray-400 ${
                    isSyllabusLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isSyllabusLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGetCoPoMapping}
                  className={`bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] ${
                    isSyllabusLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isSyllabusLoading}
                >
                  Get CO-PO Mapping
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default Classroom;
