import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_URL = process.env.REACT_APP_API_URL
axios.defaults.withCredentials = true; // Enables sending cookies with every request

function CoPoMapping() {
  const location = useLocation();
  const classroom_id = location.state?.classroom_id || "";
  const syllabus = location.state?.syllabus || "";
  const copoData = location.state?.copoData;

  // We’ll store our CO-PO data in a single state that’s always editable.
  const [copoTable, setCopoTable] = useState({});

  // Loading and popup states
  const [isLoading, setIsLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const navItems = [
  ];

  const actionButton = { label: "Logout", path: "/logout" };

  // Transform incoming CO-PO data (if needed) into a shape ready for editing.
  useEffect(() => {
    if (copoData) {
      const tempTable = {};
      Object.entries(copoData).forEach(([key, val]) => {
        tempTable[key] = {
          co_label: key,
          description: val.description || "",
          "Cognitive Domain": val["Cognitive Domain"] || "Knowledge",
          PO: val.PO || "PO1",
          weight: val.weight || 1,
        };
      });
      setCopoTable(tempTable);
    } else {
      // Ensure we work with an object
      setCopoTable({});
    }
  }, [copoData]);

  // Add a new row
  const handleAddRow = () => {
    const newKey = `temp_${Date.now()}`;
    setCopoTable((prev) => ({
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

  // Delete an existing row
  const handleDeleteRow = (coKey) => {
    const { [coKey]: removed, ...rest } = copoTable;
    setCopoTable(rest);
  };

  // Handle save (POST the data to your backend)
  const handleSave = async () => {
    // Reset error message
    setError("");

    // Convert table rows into an array for easier processing
    const rows = Object.values(copoTable);

    // Validate that all fields are filled
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      if (
        !row.co_label.trim() ||
        !row.description.trim() ||
        !row["Cognitive Domain"].trim() ||
        !row.PO.trim() ||
        row.weight === "" ||
        row.weight === null
      ) {
        setError(`Please fill in all fields for row ${index + 1}.`);
        return;
      }
    }

    // Validate that all CO names are unique
    const coNames = rows.map((row) => row.co_label.trim());
    const duplicate = coNames.find(
      (name, index) => coNames.indexOf(name) !== index
    );
    if (duplicate) {
      setError(`CO names must be unique. Duplicate found: "${duplicate}"`);
      return;
    }

    // Validate that the total weight equals exactly 100
    const totalWeight = rows.reduce((acc, row) => acc + Number(row.weight), 0);
    if (totalWeight !== 100) {
      setError(
        `Total weight of all CO's must equal 100. Currently, it is ${totalWeight}.`
      );
      return;
    }

    // If validations pass, proceed to save
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("You are not logged in. Please log in first.");
        setIsLoading(false);
        return;
      }

      const payload = {
        classroom_id,
        co_po_table: copoTable,
        syllabus,
      };

      const response = await axios.post(
        `${API_URL}/classroom/syllabus`,
        payload,
        {
          headers: {
            accessToken: token,
          },
        }
      );

      if (response.data.success) {
        setTimeout(() => {
          setPopupVisible(true);
          setIsLoading(false);
        }, 1500);
        // Show success popup for 3 seconds, then navigate
        setTimeout(() => {
          window.history.replaceState(null, "", "/classroom"); // Clear forward history
          navigate("/classroom", {
            state: {
              classroom_id,
            },
            replace : true
          });
        }, 3000);
      } else {
        setTimeout(() => {
          setError(response.data.message);
          setIsLoading(false);
        }, 1500);
      }
    } catch (error) {
      setTimeout(() => {
        setError(error.response?.data?.message);
        setIsLoading(false);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <Navbar navItems={navItems} logout={true} />
      <div className="h-16"></div>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2C36CC]"></div>
          <span className="ml-2 font-inter font-bold text-lg text-white">Please wait...</span>
        </div>
      )}

      {/* Success Popup */}
      {popupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
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
              <span>Syllabus and CO-PO Table Saved Successfully!</span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 mt-8 mb-6">
        {/* CO-PO Table Header + Buttons */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">CO-PO Table</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleAddRow}
              disabled={isLoading}
              className={`bg-green-700 text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-green-800 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Add CO
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Save
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 mb-2">{error}</p>}

        {/* CO-PO Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left border border-gray-300">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-2 border w-32 text-center">CO</th>
                <th className="px-4 py-2 border w-1/2 text-center">Description</th>
                <th className="px-4 py-2 border w-60 text-center">Cognitive Domain</th>
                <th className="px-4 py-2 border w-60 text-center">PO</th>
                <th className="px-4 py-2 border w-24 text-center">Weight</th>
                <th className="px-4 py-2 border w-24 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(copoTable).length > 0 ? (
                Object.entries(copoTable).map(([key, details], index) => {
                  const { co_label, description, weight } = details;
                  const domain = details["Cognitive Domain"];
                  const po = details.PO;

                  return (
                    <tr key={index}>
                      {/* CO column */}
                      <td className="pr-1 pl-1 py-2 lg:px-6 border text-center">
                        <input
                          type="text"
                          className="w-full border px-2 py-1"
                          value={co_label}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setCopoTable((prev) => ({
                              ...prev,
                              [key]: {
                                ...prev[key],
                                co_label: newValue,
                              },
                            }));
                          }}
                        />
                      </td>

                      {/* Description column */}
                      <td className="pr-1 pl-1 py-2 lg:px-6 border">
                        <textarea
                          rows={4}
                          className="w-full border px-2 py-1"
                          value={description}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setCopoTable((prev) => ({
                              ...prev,
                              [key]: {
                                ...prev[key],
                                description: newValue,
                              },
                            }));
                          }}
                        />
                      </td>

                      {/* Cognitive Domain column */}
                      <td className="pr-1 pl-1 py-2 lg:px-6 border text-center">
                        <select
                          className="w-full border px-2 py-1"
                          value={domain}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setCopoTable((prev) => ({
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
                      </td>

                      {/* PO column */}
                      <td className="pr-1 pl-1 py-2 lg:px-6 border text-center">
                        <select
                          className="w-full border px-2 py-1"
                          value={po}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setCopoTable((prev) => ({
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
                      </td>

                      {/* Weight column */}
                      <td className="pr-1 pl-1 py-2 lg:px-6 border text-center">
                        <input
                          type="number"
                          min="1"
                          className="w-full border px-2 py-1"
                          value={weight}
                          onChange={(e) => {
                            let newVal = e.target.value.trim();
                            if (newVal === "") {
                              // Allow empty string temporarily; update on blur.
                              setCopoTable((prev) => ({
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
                            setCopoTable((prev) => ({
                              ...prev,
                              [key]: {
                                ...prev[key],
                                weight: newVal,
                              },
                            }));
                          }}
                          onBlur={(e) => {
                            let newVal = e.target.value.trim();
                            if (newVal === "" || isNaN(parseFloat(newVal))) {
                              setCopoTable((prev) => ({
                                ...prev,
                                [key]: {
                                  ...prev[key],
                                  weight: 1,
                                },
                              }));
                            }
                          }}
                        />
                      </td>

                      {/* Actions column */}
                      <td className="pr-1 pl-1 py-2 lg:px-6 border text-center">
                        <button
                          onClick={() => handleDeleteRow(key)}
                          className="bg-red-500 text-white py-1 px-2 rounded-md hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                // No CO-PO data
                <tr>
                  <td className="px-4 py-2 border text-center" colSpan={6}>
                    No CO-PO data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CoPoMapping;
