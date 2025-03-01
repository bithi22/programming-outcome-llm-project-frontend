import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

function Classroom() {
  const [classroomDetails, setClassroomDetails] = useState(null);
  const [error, setError] = useState("");
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [editedCoPoTable, setEditedCoPoTable] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyllabusLoading, setIsSyllabusLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const classroom_id = location.state?.classroom_id;

  const navItems = [
    { label: "Join Class", path: "/joinclass" },
    { label: "Generate Report", path: "/generatereport" },
  ];

  const actionButton = { label: "Logout", path: "/logout" };

  // Fetch classroom details
  useEffect(() => {
    if (!classroom_id) {
      setError("Classroom ID not provided.");
      return;
    }
    fetchClassroomDetails(classroom_id);
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
      console.log("Classroom Details:", response.data);
      setClassroomDetails(response.data.data);
    } catch (error) {
      setError("Failed to fetch classroom details. Please try again.");
    }
  };

  // Syllabus mapping
  const handleGetCoPoMapping = async () => {
    if (!syllabusText.trim()) {
      alert("Please enter the syllabus text.");
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
          navigate("/copomapping", {
            state: {
              classroom_id,
              syllabus: syllabusText,
              copoData: response.data.data,
            },
          });
        }, 500);
      } else {
        alert("Failed to map syllabus to CO-PO. Please try again.");
      }
    } catch (error) {
      console.error(
        "Error mapping syllabus to CO-PO:",
        error.response?.data || error.message
      );
      alert("Failed to map syllabus to CO-PO. Please try again.");
    }
    setIsSyllabusLoading(false);
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
    // Convert existing structure => { key: { co_label, description, etc. } }
    Object.entries(classroomDetails.co_po_table).forEach(([key, val]) => {
      tempTable[key] = {
        co_label: key, // so user can rename "CO1" → "CO2" or anything
        description: val.description || "",
        "Cognitive Domain": val["Cognitive Domain"] || "Knowledge",
        PO: val.PO || "PO1",
        weight: val.weight || 1,
      };
    });
    setEditedCoPoTable(tempTable);
    setIsEditingTable(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditingTable(false);
    setEditedCoPoTable(null);
  };

  // Save changes: transform editedCoPoTable so that co_label is the new key
  // Validate the description and weight
  const handleSaveChanges = async () => {
    // Build final table structure
    const finalTable = {};
    for (const [key, val] of Object.entries(editedCoPoTable)) {
      const newKey = val.co_label.trim() || key; // fallback if user left co_label empty
      if (!val.description.trim()) {
        alert(`Description for "${newKey}" cannot be empty.`);
        return;
      }
      const w = Number(val.weight);
      if (isNaN(w) || w < 1) {
        alert(`Weight for "${newKey}" must be a number >= 1.`);
        return;
      }
      finalTable[newKey] = {
        description: val.description,
        "Cognitive Domain": val["Cognitive Domain"],
        PO: val.PO,
        weight: w,
      };
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You are not logged in. Please log in first.");
        setIsLoading(false);
        return;
      }
      // Replace the URL below with your actual endpoint.
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
        alert("Updated successfully.");
        // Update the local classroomDetails with finalTable
        setClassroomDetails((prev) => ({
          ...prev,
          co_po_table: finalTable,
        }));
        setIsEditingTable(false);
        setEditedCoPoTable(null);
      } else {
        alert("Failed to update CO-PO table. Please try again.");
      }
    } catch (error) {
      console.error(
        "Error updating CO-PO table:",
        error.response?.data || error.message
      );
      alert("Failed to update CO-PO table. Please try again.");
    }
    setIsLoading(false);
  };

  // Add a new row
  const handleAddRow = () => {
    // Create a unique key for this new row
    const newKey = `temp_${Date.now()}`;
    setEditedCoPoTable((prev) => ({
      ...prev,
      [newKey]: {
        co_label: ``,
        description: "",
        "Cognitive Domain": "Knowledge",
        PO: "PO1",
        weight: 1,
      },
    }));
  };

  // Delete an existing row
  const handleDeleteRow = (coKey) => {
    const { [coKey]: removed, ...rest } = editedCoPoTable;
    setEditedCoPoTable(rest);
  };

  return (
    <div>
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />

      <div className="container mx-auto px-6 mt-24">
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <img
            src="https://via.placeholder.com/800x300.png?text=Class+Image"
            alt="Class Banner"
            className="w-full h-56 object-cover"
          />
          <div className="p-4 flex justify-between items-center">
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
            </div>
            <div className="space-x-4">
              <button
                onClick={handleQuestionClick}
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
              >
                Questions
              </button>
              {classroomDetails?.committee_access && (
                <button
                  onClick={() => setIsSyllabusModalOpen(true)}
                  className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700"
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
          <div className="flex items-center space-x-4">
            {isEditingTable && (
              <button
                onClick={handleAddRow}
                className="bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800"
              >
                Add CO
              </button>
            )}
            {!isEditingTable ? (
              <button
                onClick={handleEditTable}
                className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
              >
                Edit Table
              </button>
            ) : (
              <div className="space-x-4">
                <button
                  onClick={handleSaveChanges}
                  disabled={isLoading}
                  className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                >
                  {isLoading ? "Please wait..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CO-PO Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left border border-gray-300">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-2 border w-32">CO</th>
                <th className="px-4 py-2 border w-1/2">Description</th>
                <th className="px-4 py-2 border w-60">Cognitive Domains</th>
                <th className="px-4 py-2 border w-40">PO's</th>
                <th className="px-4 py-2 border w-24">Weight</th>
                {isEditingTable && (
                  <th className="px-4 py-2 border w-24">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {(
                isEditingTable ? editedCoPoTable : classroomDetails?.co_po_table
              ) ? (
                // If in edit mode, use editedCoPoTable, else use classroomDetails.co_po_table
                Object.entries(
                  isEditingTable
                    ? editedCoPoTable
                    : classroomDetails.co_po_table
                ).map(([key, details], index) => {
                  // In non-edit mode, details is just the original object
                  // In edit mode, details includes co_label
                  const coLabel = isEditingTable ? details.co_label : key;
                  const description = details.description;
                  const domain = details["Cognitive Domain"];
                  const po = details.PO;
                  const weight = details.weight;

                  return (
                    <tr key={index}>
                      {/* CO column */}
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

                      {/* Description column */}
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

                      {/* Cognitive Domain column */}
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
                            <option value="Understanding">Understanding</option>
                            <option value="Analyzing">Analyzing</option>
                            <option value="Applying">Applying</option>
                            <option value="Creating">Creating</option>
                            <option value="Evaluating">Evaluating</option>
                          </select>
                        ) : (
                          domain || "No domain provided"
                        )}
                      </td>

                      {/* PO column */}
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

                      {/* Weight column */}
                      <td className="px-4 py-2 border">
                        {isEditingTable ? (
                          <input
                            type="number"
                            min="1"
                            className="w-full border px-2 py-1"
                            value={weight}
                            onChange={(e) => {
                              let newVal = e.target.value.trim(); // Remove spaces

                              // If the input is empty, don't update state yet
                              if (newVal === "") {
                                setEditedCoPoTable((prev) => ({
                                  ...prev,
                                  [key]: {
                                    ...prev[key],
                                    weight: "", // Keep it empty temporarily
                                  },
                                }));
                                return;
                              }

                              newVal = parseInt(newVal, 10);

                              // If it's not a number or less than 1, set it to 1
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

                              // If the input is still empty when focus is lost, set it to 1
                              if (
                                newVal === "" ||
                                isNaN(parseInt(newVal, 10))
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

                      {/* Actions column (only in edit mode) */}
                      {isEditingTable && (
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
                // No CO-PO data
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

      {/* Syllabus Modal */}
      {isSyllabusModalOpen && (
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
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsSyllabusModalOpen(false)}
                className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400"
                disabled={isSyllabusLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleGetCoPoMapping}
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                disabled={isSyllabusLoading}
              >
                {isSyllabusLoading
                  ? "Please wait, this may take a while..."
                  : "Get CO-PO Mapping"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Classroom;
