import React, { useState, useEffect } from "react";
import { data, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { FiCopy } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

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
  const [syllabusError,setSyllabusError] = useState("")
  const [showInviteCard, setShowInviteCard] = useState(false);
  const [teacherCopySuccess, setTeacherCopySuccess] = useState(false);
  const [committeeCopySuccess, setCommitteeCopySuccess] = useState(false);

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
        `http://127.0.0.1:8000/classroom/${id}`,
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
      setSyllabusError("Syllabus cannot be empty.")
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
        "http://127.0.0.1:8000/classroom/co-po-mapping",
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
          setIsSyllabusLoading(false)
          setIsSyllabusModalOpen(false)
          setSyllabusError('')
          navigate("/copomapping", {
            state: {
              classroom_id,
              syllabus: syllabusText,
              copoData: response.data.data,
            },
          });
        }, 1500);
      } else {
        setTimeout(()=>{
          setIsSyllabusLoading(false)
          setSyllabusError(response.data?.message)
        },1500)
      }
    } catch (error) {
      setTimeout(()=>{
        setIsSyllabusLoading(false)
        setSyllabusError(error.response?.data?.message)
      },1500)
    }
  };

  const handleQuestionClick = () => {
    navigate("/allquestions", { state: { classroom_id } });
  };

  // Start editing: create a deep copy of the current co_po_table,
  // but store "co_label" inside each object so the user can rename it.
  const handleEditTable = () => {
    if (!classroomDetails?.co_po_table) {
      alert("No CO-PO data available to edit.");
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

    setIsLoading(true)

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
        "http://127.0.0.1:8000/classroom/co-po-mapping",
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
        setTimeout(()=>{
          setClassroomDetails((prev) => ({
            ...prev,
            co_po_table: finalTable,
          }));
          setIsEditingTable(false);
          setEditedCoPoTable(null);
          setCoPoEditError("");
          setIsLoading(false)
        },1500)
        
      } else {
        setTimeout(()=>{
          setIsLoading(false);
        setCoPoEditError(response.data.message);

        },1500)
      }
    } catch (error) {
      setTimeout(()=>{
        setCoPoEditError(error.response?.data?.message);
        setIsLoading(false);
      },1500)
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

  const handleSyllabusCancelButton = ()=>{
    setSyllabusText('')
    setIsSyllabusModalOpen(false)
    setSyllabusError('')
  }

  return (
    <div>
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />

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
            <div className="bg-white rounded-lg shadow-lg max-w-lg md:max-w-lg w-full p-6">
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
                    className="w-full border px-2 py-1 pr-10"
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
                    className="w-full border px-2 py-1 pr-10"
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
      <AnimatePresence mode="wait">
        {isClassroomLoading ? (
          <div className="container mx-auto px-6 mt-24">
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
            <div className="container mx-auto px-6 mt-24 mb-6">
              {error && (
                <div className="text-red-500 font-semibold mb-4">{error}</div>
              )}
              <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
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
                  <div className="space-x-4 mt-4 md:mt-0">
                    <button
                      onClick={handleReportsClick}
                      className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC]"
                    >
                      Classroom Reports
                    </button>
                    {classroomDetails?.teacher_access && (
                      <button
                        onClick={handleQuestionClick}
                        className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC]"
                      >
                        Questions
                      </button>
                    )}
                    {classroomDetails?.committee_access && (
                      <button
                        onClick={() => setIsSyllabusModalOpen(true)}
                        className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC]"
                      >
                        Update Syllabus
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CO-PO Table Header + Buttons */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">CO-PO Table</h2>
                <div className="flex items-center justify-center space-x-4">
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
                  {isEditingTable && classroomDetails?.committee_access && (
                    <button
                      onClick={handleAddRow}
                      disabled={isLoading}
                      className={`bg-green-700 text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-green-800 ${
                        isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Add CO
                    </button>
                  )}
                  {classroomDetails?.committee_access &&
                    (!isEditingTable ? (
                      <button
                        onClick={handleEditTable}
                        className="border-2 border-[#3941FF] text-[#3941FF] py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] hover:text-white hover:border-[#2C36CC]"
                      >
                        Edit Table
                      </button>
                    ) : (
                      <div className="space-x-4">
                        <button
                          onClick={handleSaveChanges}
                          disabled={isLoading}
                          className={`bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isLoading}
                          className={`bg-gray-300 text-black py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-gray-400 ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                </div>
              </div>
              {isEditingTable && coPoEditError && (
                <div className="text-red-500 text-sm mb-4">{coPoEditError}</div>
              )}
              {/* CO-PO Table */}
              <div className="overflow-x-auto">
                <table className="table-auto w-full text-left border border-gray-300">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="px-4 py-2 border w-32">CO</th>
                      <th className="px-4 py-2 border w-1/2">Description</th>
                      <th className="px-4 py-2 border w-60">
                        Cognitive Domains
                      </th>
                      <th className="px-4 py-2 border w-40">PO's</th>
                      <th className="px-4 py-2 border w-24">Weight</th>
                      {isEditingTable && classroomDetails?.committee_access && (
                        <th className="px-4 py-2 border w-24">Actions</th>
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
                        const coLabel = isEditingTable ? details.co_label : key;
                        const description = details.description;
                        const domain = details["Cognitive Domain"];
                        const po = details.PO;
                        const weight = details.weight;
                        return (
                          <tr key={index}>
                            <td className="px-4 py-2 border">
                              {isEditingTable ? (
                                <input
                                  type="text"
                                  className="w-full border px-2 py-1"
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
                            <td className="px-4 py-2 border">
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
                            <td className="px-4 py-2 border">
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
                                  <option value="Knowledge">Knowledge</option>
                                  <option value="Understanding">
                                    Understanding
                                  </option>
                                  <option value="Analyzing">Analyzing</option>
                                  <option value="Applying">Applying</option>
                                  <option value="Creating">Creating</option>
                                  <option value="Evaluating">Evaluating</option>
                                </select>
                              ) : (
                                domain || "No domain provided"
                              )}
                            </td>
                            <td className="px-4 py-2 border">
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
                            <td className="px-2 py-2 text-center border">
                              {isEditingTable ? (
                                <input
                                  type="number"
                                  min="1"
                                  max = "100"
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
                          No CO-PO data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <div className="bg-white rounded-lg shadow-lg w-[600px] p-6">
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
