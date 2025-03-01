// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useNavigate, useLocation } from "react-router-dom";
// import Navbar from "../components/Navbar";

// function CoPoMapping() {
//   const location = useLocation();
//   const classroom_id = location.state?.classroom_id || "";
//   const syllabus = location.state?.syllabus || "";
//   const copoData = location.state?.copoData || {};
//   const [copoMapping, setCopoMapping] = useState(copoData);
//   const [isEditingTable, setIsEditingTable] = useState(false);
//   const [editedCoPoTable, setEditedCoPoTable] = useState(null);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const navItems = [
//     { label: "Join Class", path: "/joinclass" },
//     { label: "Generate Report", path: "/generatereport" },
//   ];

//   const actionButton = { label: "Logout", path: "/logout" };

//   const handleEditTable = () => {
//     if (!copoMapping) {
//       alert("No CO-PO data available to edit.");
//       return;
//     }
//     const tempTable = {};
//     // Convert existing structure => { key: { co_label, description, etc. } }
//     Object.entries(copoMapping).forEach(([key, val]) => {
//       tempTable[key] = {
//         co_label: key, // so user can rename "CO1" → "CO2" or anything
//         description: val.description || "",
//         "Cognitive Domain": val["Cognitive Domain"] || "Knowledge",
//         PO: val.PO || "PO1",
//         weight: val.weight || 1,
//       };
//     });
//     setEditedCoPoTable(tempTable);
//     setIsEditingTable(true);
//   };

//   // Fetch classroom details
//     useEffect(() => {
//       handleEditTable()
//     }, [copoMapping]);

//   // Add a new row
//   const handleAddRow = () => {
//     // Create a unique key for this new row
//     const newKey = `temp_${Date.now()}`;
//     setEditedCoPoTable((prev) => ({
//       ...prev,
//       [newKey]: {
//         co_label: ``,
//         description: "",
//         "Cognitive Domain": "Knowledge",
//         PO: "PO1",
//         weight: 1,
//       },
//     }));
//   };

//   // Delete an existing row
//   const handleDeleteRow = (coKey) => {
//     const { [coKey]: removed, ...rest } = editedCoPoTable;
//     setEditedCoPoTable(rest);
//   };

//   return (
//     <div>
//       <Navbar
//         navItems={navItems}
//         actionButton={actionButton}
//         buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
//       />

//       <div className="container mx-auto px-6 mt-24">
//         {/* CO-PO Table Header + Buttons */}
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-lg font-semibold">CO-PO Table</h2>
//           <div className="flex items-center space-x-4">
//             {isEditingTable && (
//               <button
//                 onClick={handleAddRow}
//                 className="bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800"
//               >
//                 Add CO
//               </button>
//             )}
//           </div>
//         </div>

//         {/* CO-PO Table */}
//         <div className="overflow-x-auto">
//           <table className="table-auto w-full text-left border border-gray-300">
//             <thead className="bg-black text-white">
//               <tr>
//                 <th className="px-4 py-2 border w-32">CO</th>
//                 <th className="px-4 py-2 border w-1/2">Description</th>
//                 <th className="px-4 py-2 border w-60">Cognitive Domains</th>
//                 <th className="px-4 py-2 border w-40">PO's</th>
//                 <th className="px-4 py-2 border w-24">Weight</th>
//                 {isEditingTable && (
//                   <th className="px-4 py-2 border w-24">Actions</th>
//                 )}
//               </tr>
//             </thead>
//             <tbody>
//               {(isEditingTable ? editedCoPoTable : copoMapping) ? (
//                 // If in edit mode, use editedCoPoTable, else use classroomDetails.co_po_table
//                 Object.entries(
//                   isEditingTable ? editedCoPoTable : copoMapping
//                 ).map(([key, details], index) => {
//                   // In non-edit mode, details is just the original object
//                   // In edit mode, details includes co_label
//                   const coLabel = isEditingTable ? details.co_label : key;
//                   const description = details.description;
//                   const domain = details["Cognitive Domain"];
//                   const po = details.PO;
//                   const weight = details.weight;

//                   return (
//                     <tr key={index}>
//                       {/* CO column */}
//                       <td className="px-4 py-2 border">
//                         {isEditingTable ? (
//                           <input
//                             type="text"
//                             className="w-full border px-2 py-1"
//                             value={coLabel}
//                             onChange={(e) => {
//                               const newValue = e.target.value;
//                               setEditedCoPoTable((prev) => ({
//                                 ...prev,
//                                 [key]: {
//                                   ...prev[key],
//                                   co_label: newValue,
//                                 },
//                               }));
//                             }}
//                           />
//                         ) : (
//                           coLabel
//                         )}
//                       </td>

//                       {/* Description column */}
//                       <td className="px-4 py-2 border">
//                         {isEditingTable ? (
//                           <textarea
//                             rows={5}
//                             className="w-full border px-2 py-1"
//                             value={description}
//                             onChange={(e) => {
//                               const newValue = e.target.value;
//                               setEditedCoPoTable((prev) => ({
//                                 ...prev,
//                                 [key]: {
//                                   ...prev[key],
//                                   description: newValue,
//                                 },
//                               }));
//                             }}
//                           />
//                         ) : (
//                           description || "No description provided"
//                         )}
//                       </td>

//                       {/* Cognitive Domain column */}
//                       <td className="px-4 py-2 border">
//                         {isEditingTable ? (
//                           <select
//                             className="w-full border px-2 py-1"
//                             value={domain}
//                             onChange={(e) => {
//                               const newValue = e.target.value;
//                               setEditedCoPoTable((prev) => ({
//                                 ...prev,
//                                 [key]: {
//                                   ...prev[key],
//                                   "Cognitive Domain": newValue,
//                                 },
//                               }));
//                             }}
//                           >
//                             <option value="Knowledge">Knowledge</option>
//                             <option value="Understanding">Understanding</option>
//                             <option value="Analyzing">Analyzing</option>
//                             <option value="Applying">Applying</option>
//                             <option value="Creating">Creating</option>
//                             <option value="Evaluating">Evaluating</option>
//                           </select>
//                         ) : (
//                           domain || "No domain provided"
//                         )}
//                       </td>

//                       {/* PO column */}
//                       <td className="px-4 py-2 border">
//                         {isEditingTable ? (
//                           <select
//                             className="w-full border px-2 py-1"
//                             value={po}
//                             onChange={(e) => {
//                               const newValue = e.target.value;
//                               setEditedCoPoTable((prev) => ({
//                                 ...prev,
//                                 [key]: {
//                                   ...prev[key],
//                                   PO: newValue,
//                                 },
//                               }));
//                             }}
//                           >
//                             {Array.from({ length: 12 }, (_, i) => {
//                               const optionValue = `PO${i + 1}`;
//                               return (
//                                 <option key={i} value={optionValue}>
//                                   {optionValue}
//                                 </option>
//                               );
//                             })}
//                           </select>
//                         ) : (
//                           po || "No PO data provided"
//                         )}
//                       </td>

//                       {/* Weight column */}
//                       <td className="px-4 py-2 border">
//                         {isEditingTable ? (
//                           <input
//                             type="number"
//                             min="1"
//                             className="w-full border px-2 py-1"
//                             value={weight}
//                             onChange={(e) => {
//                               let newVal = e.target.value.trim(); // Remove spaces

//                               // If the input is empty, don't update state yet
//                               if (newVal === "") {
//                                 setEditedCoPoTable((prev) => ({
//                                   ...prev,
//                                   [key]: {
//                                     ...prev[key],
//                                     weight: "", // Keep it empty temporarily
//                                   },
//                                 }));
//                                 return;
//                               }

//                               newVal = parseInt(newVal, 10);

//                               // If it's not a number or less than 1, set it to 1
//                               if (isNaN(newVal) || newVal < 1) {
//                                 newVal = 1;
//                               }

//                               setEditedCoPoTable((prev) => ({
//                                 ...prev,
//                                 [key]: {
//                                   ...prev[key],
//                                   weight: newVal,
//                                 },
//                               }));
//                             }}
//                             onBlur={(e) => {
//                               let newVal = e.target.value.trim();

//                               // If the input is still empty when focus is lost, set it to 1
//                               if (
//                                 newVal === "" ||
//                                 isNaN(parseInt(newVal, 10))
//                               ) {
//                                 setEditedCoPoTable((prev) => ({
//                                   ...prev,
//                                   [key]: {
//                                     ...prev[key],
//                                     weight: 1,
//                                   },
//                                 }));
//                               }
//                             }}
//                           />
//                         ) : (
//                           weight || "No weight data provided"
//                         )}
//                       </td>

//                       {/* Actions column (only in edit mode) */}
//                       {isEditingTable && (
//                         <td className="px-4 py-2 border">
//                           <button
//                             onClick={() => handleDeleteRow(key)}
//                             className="bg-red-500 text-white py-1 px-2 rounded-md hover:bg-red-600"
//                           >
//                             Delete
//                           </button>
//                         </td>
//                       )}
//                     </tr>
//                   );
//                 })
//               ) : (
//                 // No CO-PO data
//                 <tr>
//                   <td
//                     className="px-4 py-2 border text-center"
//                     colSpan={isEditingTable ? 6 : 5}
//                   >
//                     No CO-PO data available.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default CoPoMapping;


import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

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
    { label: "Join Class", path: "/joinclass" },
    { label: "Generate Report", path: "/generatereport" },
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
    }
    else{
      setCopoTable(null)
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
    setIsLoading(true);
    try {
      // Adjust the payload & endpoint as per your backend requirements

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("You are not logged in. Please log in first.");
        return;
      }

      const payload = {
        classroom_id,
        co_po_table: copoTable,
        syllabus
      };

      const response = await axios.post(`http://127.0.0.1:8000/classroom/syllabus`, payload,
        {
          headers: {
            accessToken: token,
          },
        }
      );

      if(response.data.success){
        setIsLoading(false);
        setPopupVisible(true);
        // Show success popup for 3 seconds, then navigate
        setTimeout(() => {
          navigate("/classroom",{
            state : {
              classroom_id
            }
          });
        }, 3000);
      }
      else{
        setIsLoading(false);
        console.error("Error saving CO-PO mapping:", error);
        setError("Failed to save CO-PO mapping.");
        // Handle error (e.g., display a message)
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error saving CO-PO mapping:", error);
      setError("Failed to save CO-PO mapping.");
      // Handle error (e.g., display a message)
    }
    finally{
      setIsLoading(false)
    }
  };

  return (
    <div>
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-blue-500">
            Please wait...
          </span>
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

      <div className="container mx-auto px-6 mt-24">
        {/* CO-PO Table Header + Buttons */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">CO-PO Table</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleAddRow}
              className="bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800"
            >
              Add CO
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 mb-2">{error}</p>}

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
                <th className="px-4 py-2 border w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(copoTable).length > 0 ? (
                Object.entries(copoTable).map(([key, details], index) => {
                  const coLabel = details.co_label;
                  const description = details.description;
                  const domain = details["Cognitive Domain"];
                  const po = details.PO;
                  const weight = details.weight;

                  return (
                    <tr key={index}>
                      {/* CO column */}
                      <td className="px-4 py-2 border">
                        <input
                          type="text"
                          className="w-full border px-2 py-1"
                          value={coLabel}
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
                      <td className="px-4 py-2 border">
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
                      <td className="px-4 py-2 border">
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
                      <td className="px-4 py-2 border">
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
                      <td className="px-4 py-2 border">
                        <input
                          type="number"
                          min="1"
                          className="w-full border px-2 py-1"
                          value={weight}
                          onChange={(e) => {
                            let newVal = e.target.value.trim();
                            if (newVal === "") {
                              // Temporarily allow empty string, update on blur
                              setCopoTable((prev) => ({
                                ...prev,
                                [key]: {
                                  ...prev[key],
                                  weight: "",
                                },
                              }));
                              return;
                            }
                            newVal = parseInt(newVal, 10);
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
                            if (newVal === "" || isNaN(parseInt(newVal, 10))) {
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
                      <td className="px-4 py-2 border">
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
