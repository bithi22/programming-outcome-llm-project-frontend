import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function QuestionResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { question } = location.state || {};
  const { classroom_id } = location.state || {};
  const [headers, setHeaders] = useState([]);
  const [popupMessage, setPopupMessage] = useState("");
  const [data, setData] = useState([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [totalColumns, setTotalColumns] = useState(0);
  const [globalMaxRow, setGlobalMaxRow] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);

  // Array of maximum allowed marks for each marks cell (excluding Student ID)
  const [maxMarksArray, setMaxMarksArray] = useState([]);
  const fileInputRef = useRef(null);
  const question_id = location.state?.question_id;
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  // State for Add Student modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [numRowsToAdd, setNumRowsToAdd] = useState("");

  const navItems = [
    { label: "Join Class", path: "/joinclass" },
    { label: "Generate Report", path: "/generatereport" },
  ];
  const actionButton = { label: "Logout", path: "/logout" };

  // Download XLSX including the extra Total Marks column.
  const downloadXLSX = () => {
    const headerRowCount = headers.length;
    const totalColumnsWithTotal = totalColumns + 1; // extra column for Total Marks
    const headerMatrix = Array.from({ length: headerRowCount }, () =>
      Array(totalColumnsWithTotal).fill("")
    );
    const merges = [];

    headers.forEach((row, rowIndex) => {
      let colIndex = 0;
      row.forEach((cell) => {
        while (headerMatrix[rowIndex][colIndex] !== "") {
          colIndex++;
        }
        headerMatrix[rowIndex][colIndex] = cell.label;
        const colSpan = cell.colSpan || 1;
        const rowSpan = cell.rowSpan || 1;
        if (colSpan > 1 || rowSpan > 1) {
          merges.push({
            s: { r: rowIndex, c: colIndex },
            e: { r: rowIndex + rowSpan - 1, c: colIndex + colSpan - 1 },
          });
          for (let i = rowIndex; i < rowIndex + rowSpan; i++) {
            for (let j = colIndex; j < colIndex + colSpan; j++) {
              if (i === rowIndex && j === colIndex) continue;
              headerMatrix[i][j] = null;
            }
          }
        }
        colIndex += colSpan;
      });
      // In the bottom header row, add the "Total Marks" cell.
      if (rowIndex === 0) {
        while (headerMatrix[rowIndex][colIndex] !== "") {
          colIndex++;
        }
        headerMatrix[rowIndex][colIndex] = `Total Marks (${totalMarks})`;
        const colSpan = 1;
        const rowSpan = globalMaxRow + 1;
        if (colSpan > 1 || rowSpan > 1) {
          merges.push({
            s: { r: rowIndex, c: colIndex },
            e: { r: rowIndex + rowSpan - 1, c: colIndex + colSpan - 1 },
          });
          for (let i = rowIndex; i < rowIndex + rowSpan; i++) {
            for (let j = colIndex; j < colIndex + colSpan; j++) {
              if (i === rowIndex && j === colIndex) continue;
              headerMatrix[i][j] = null;
            }
          }
        }
        colIndex += colSpan;
      }
    });

    // For each data row, compute total marks and append it.
    const finalData = data.map((row) => {
      let total = 0;
      // Skip Student ID (column 0); empty cells count as 0.
      for (let i = 1; i < row.length; i++) {
        const num = parseFloat(row[i]);
        total += isNaN(num) ? 0 : num;
      }
      return [...row, total];
    });

    const sheetData = [...headerMatrix, ...finalData];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    worksheet["!merges"] = merges;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const workbookBinary = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAs(
      new Blob([workbookBinary], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      }),
      "report.xlsx"
    );
  };

  useEffect(() => {
    if (!question) {
      console.error("Question details or current record not provided.");
      return;
    }

    const { current_record, co_po_mapping } = question;
    let maxRow = 0;
    let t_columns = 1; // already counting the Student ID column
    let t_marks = 0;

    // Build hierarchical headers from co_po_mapping.
    const buildHeaders = (mapping) => {
      const headerLevels = [];

      const getMaxRows = (key, value) => {
        if (value["sub-sections"]) {
          maxRow = Math.max(1, maxRow);
          Object.entries(value["sub-sections"]).forEach(
            ([sub_key, sub_value]) => {
              getMaxRows(sub_key, sub_value);
            }
          );
        } else if (value["sub-sub-sections"]) {
          maxRow = Math.max(2, maxRow);
        }
      };

      Object.entries(mapping).forEach(([key, value]) => {
        getMaxRows(key, value);
      });

      const co_po_dfs = (key, value, level, parentLabel) => {
        if (!headerLevels[level]) headerLevels[level] = [];
        let label = parentLabel ? `${key}` : key;
        const headerCell = { label: key, colSpan: 1, rowSpan: 1 };
        // If total marks is defined, append it to the label and store it.
        if (value.marks !== undefined) {
          headerCell.label = `${key} (${value.marks})`;
          headerCell.maxMarks = value.marks;
          t_marks += value.marks;
        }
        headerLevels[level].push(headerCell);
        let currentIndex = headerLevels[level].length - 1;

        if (value["sub-sections"]) {
          let child_counter = 0;
          Object.entries(value["sub-sections"]).forEach(
            ([sub_key, sub_value]) => {
              child_counter += co_po_dfs(
                sub_key,
                sub_value,
                level + 1,
                headerCell.label
              );
            }
          );
          headerLevels[level][currentIndex].colSpan = child_counter;
          return child_counter;
        } else if (value["sub-sub-sections"]) {
          let child_counter = 0;
          Object.entries(value["sub-sub-sections"]).forEach(
            ([sub_key, sub_value]) => {
              child_counter += co_po_dfs(
                sub_key,
                sub_value,
                level + 1,
                headerCell.label
              );
            }
          );
          headerLevels[level][currentIndex].colSpan = child_counter;
          return child_counter;
        } else {
          headerLevels[level][currentIndex].rowSpan = maxRow - level + 1;
          t_columns += 1;
          return 1;
        }
      };

      Object.entries(mapping).forEach(([key, value]) => {
        co_po_dfs(key, value, 0, "");
      });
      return headerLevels;
    };

    const hierarchicalHeaders = buildHeaders(co_po_mapping);
    if (hierarchicalHeaders.length > 0) {
      hierarchicalHeaders[0].unshift({
        label: "Student ID",
        colSpan: 1,
        rowSpan: maxRow + 1,
      });
    }
    setTotalColumns(t_columns);
    setGlobalMaxRow(maxRow);
    setTotalMarks(t_marks);

    // Compute an array of maximum marks for each marks cell (skipping Student ID).
    const getMaxMarksArray = (mapping) => {
      const arr = [];
      const traverse = (obj) => {
        Object.entries(obj).forEach(([key, value]) => {
          if (value["sub-sections"]) {
            traverse(value["sub-sections"]);
          } else if (value["sub-sub-sections"]) {
            traverse(value["sub-sub-sections"]);
          } else {
            arr.push(value.marks !== undefined ? value.marks : Infinity);
          }
        });
      };
      traverse(co_po_mapping);
      return arr;
    };
    setMaxMarksArray(getMaxMarksArray(co_po_mapping));

    setHeaders(hierarchicalHeaders);

    const transformData = (record) => {
      if (record == null) {
        return [];
      }
      return Object.entries(record).map(([studentId, studentData]) => {
        let row = [studentId];
        Object.entries(studentData).forEach(([questionId, questionData]) => {
          if (questionData["sub-sections"]) {
            Object.entries(questionData["sub-sections"]).forEach(
              ([subSection, subData]) => {
                if (subData["sub-sub-sections"]) {
                  Object.entries(subData["sub-sub-sections"]).forEach(
                    ([sub_sub_section, sub_sub_data]) => {
                      row.push(
                        sub_sub_data.obtained_marks !== undefined
                          ? sub_sub_data.obtained_marks
                          : ""
                      );
                    }
                  );
                } else {
                  row.push(
                    subData.obtained_marks !== undefined
                      ? subData.obtained_marks
                      : ""
                  );
                }
              }
            );
          } else {
            row.push(
              questionData.obtained_marks !== undefined
                ? questionData.obtained_marks
                : ""
            );
          }
        });
        return row;
      });
    };

    const initialData = transformData(current_record);
    setData(initialData);
  }, [question]);

  const handleCellChange = (rowIndex, colIndex, value) => {
    const updatedData = [...data];

    // Student ID column: allow any input.
    if (colIndex === 0) {
      updatedData[rowIndex][colIndex] = value;
      setData(updatedData);
      return;
    }

    // Get the maximum allowed for this cell (note: first marks cell is at index 1).
    const max = maxMarksArray[colIndex - 1];

    // 1) If empty, just store it
    if (value === "") {
      updatedData[rowIndex][colIndex] = "";
      setData(updatedData);
      return;
    }

    // 2) Check if the input is either a valid decimal pattern or "." by itself
    //    This regex allows digits, optional decimal point, and optional more digits
    const decimalPattern = /^\d*\.?\d*$/;
    if (!decimalPattern.test(value)) {
      // If it doesn't match, do nothing (reject the change)
      return;
    }

    // 3) If the string ends with ".", let the user keep typing
    //    e.g. "12." should remain "12." until more digits appear
    if (value.endsWith(".")) {
      updatedData[rowIndex][colIndex] = value;
      setData(updatedData);
      return;
    }

    // 4) Otherwise, it's a parseable number. Parse and clamp.
    let numericValue = parseFloat(value);
    if (numericValue < 0) {
      numericValue = 0;
    }
    if (numericValue > max) {
      numericValue = max;
    }

    // Convert back to string and store
    updatedData[rowIndex][colIndex] = numericValue.toString();
    setData(updatedData);
  };

  // Function to add multiple rows at once.
  const addRows = (count) => {
    const newRows = Array.from({ length: count }, () =>
      Array(totalColumns).fill("")
    );
    setData((prevData) => [...prevData, ...newRows]);
  };

  const deleteRow = (rowIndex) => {
    const updatedData = data.filter((_, index) => index !== rowIndex);
    setData(updatedData);
  };

  const getObtainedMarksMapping = () => {
    const { co_po_mapping } = question;
    if (data.length === 0) {
      console.log("No student records");
      return;
    }

    const marks_mapping = [];
    const construct_marks_mapping = (key, value, current) => {
      current.push(key);
      if (value["sub-sections"]) {
        Object.entries(value["sub-sections"]).forEach(
          ([sub_key, sub_value]) => {
            construct_marks_mapping(sub_key, sub_value, current);
          }
        );
      } else if (value["sub-sub-sections"]) {
        Object.entries(value["sub-sub-sections"]).forEach(
          ([sub_key, sub_value]) => {
            construct_marks_mapping(sub_key, sub_value, current);
          }
        );
      } else {
        marks_mapping.push(structuredClone(current));
      }
      current.pop();
    };

    Object.entries(co_po_mapping).forEach(([key, value]) => {
      construct_marks_mapping(key, value, []);
    });

    const obtained_marks_mapping = {};
    const total_students = data.length;

    for (let i = 0; i < total_students; i++) {
      const student_id = data[i][0];
      if (student_id.trim() === "") {
        continue;
      }
      const current = (obtained_marks_mapping[student_id] = {});
      let counter = 1;

      marks_mapping.forEach((value, index) => {
        let first,
          second,
          third = -1;

        for (let j = 0; j < value.length; j++) {
          if (j === 0) {
            first = value[j];
            if (!Object.hasOwn(current, first)) {
              current[first] = {};
            }
          } else if (j === 1) {
            second = value[j];
            if (Object.hasOwn(current[first], "sub-sections")) {
              if (!Object.hasOwn(current[first]["sub-sections"], second)) {
                current[first]["sub-sections"][second] = {};
              }
            } else {
              current[first]["sub-sections"] = {};
              current[first]["sub-sections"][second] = {};
            }
          } else {
            third = value[j];
            if (
              Object.hasOwn(
                current[first]["sub-sections"][second],
                "sub-sub-sections"
              )
            ) {
              if (
                !Object.hasOwn(
                  current[first]["sub-sections"][second]["sub-sub-sections"],
                  third
                )
              ) {
                current[first]["sub-sections"][second]["sub-sub-sections"][
                  third
                ] = {};
              }
            } else {
              current[first]["sub-sections"][second]["sub-sub-sections"] = {};
              current[first]["sub-sections"][second]["sub-sub-sections"][
                third
              ] = {};
            }
          }

          if (j === value.length - 1) {
            if (j === 0) {
              current[first]["obtained_marks"] = data[i][counter];
            } else if (j === 1) {
              current[first]["sub-sections"][second]["obtained_marks"] =
                data[i][counter];
            } else {
              current[first]["sub-sections"][second]["sub-sub-sections"][third][
                "obtained_marks"
              ] = data[i][counter];
            }
            counter += 1;
          }
        }
      });
    }
    return obtained_marks_mapping;
  };

  const saveRecord = async () => {
    const obtained_marks_mapping = getObtainedMarksMapping();

    const requestBody = {
      current_record: obtained_marks_mapping,
      question_id: question_id,
    };
    console.log("Record Saving", requestBody);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      console.error("Access token not found");
      return;
    }

    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/question/current-record`,
        requestBody,
        {
          headers: {
            accessToken: token,
          },
        }
      );

      if (response.status === 200) {
        console.log("Setting popup visible");
        setPopupVisible(true);
        setTimeout(() => {
          setPopupVisible(false);
        }, 3000);
      } else {
        console.error("Failed to save record:", response.statusText);
      }
    } catch (error) {
      console.error("Error saving record:", error);
    }
  };

  const publishResult = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("Access token not found");
      return;
    }

    if (question.report_submitted) {
      return;
    }

    const obtained_marks_mapping = getObtainedMarksMapping();

    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/report/publish`,
        {
          question_id,
          current_record: obtained_marks_mapping,
        },
        { headers: { accessToken: token } }
      );
      if (response.status === 200) {
        setPopupMessage(true);
        question.report_submitted = true;
        setTimeout(() => setPopupMessage(false), 3000);
      } else {
        console.error("Failed to generate report:", response.statusText);
      }
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  function convertToNumber(value) {
    if (typeof value === "number") {
      return value; // Already a number, return as is
    }

    if (typeof value === "string") {
      let trimmed = value.trim(); // Remove leading and trailing spaces
      if (trimmed === "") {
        return ""; // Empty or space-only string
      }

      let num = Number(trimmed);
      return isNaN(num) ? "" : num; // Return number if valid, otherwise ""
    }

    return ""; // Handle other types (null, undefined, objects, etc.)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const binaryStr = evt.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert the worksheet to a 2D array.
      const fileData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headerRowCount = headers.length || 0;
      const dataRows = fileData.slice(headerRowCount);
      const filteredRows = dataRows.filter(
        (row) => row[0] !== undefined && row[0] !== null && row[0] !== ""
      );
      // Remove the extra Total Marks column (last column) before updating state.
      const trimmedRows = filteredRows.map((row) => row.slice(0, totalColumns));
      const finalData = trimmedRows.map((row) => {
        const newRow = [];
        for (let i = 0; i < totalColumns; i++) {
          newRow[i] = convertToNumber(row[i]) ?? "";
        }
        return newRow;
      });
      setData(finalData);
    };

    reader.readAsBinaryString(file);
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Calculate paginated data for display.
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + rowsPerPage);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  return (
    <div>
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />
      <div className="container mx-auto px-6 mt-24">
        <div className="flex flex-wrap items-center mb-4 bg-white py-3 top-0 z-10">
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mr-2"
          >
            Add Student
          </button>
          <button
            onClick={saveRecord}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 mr-2"
          >
            Save Record
          </button>
          {!question?.report_submitted && (
            <button
              onClick={publishResult}
              className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 mr-2"
            >
              Publish Result
            </button>
          )}
          <button
            onClick={downloadXLSX}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 mr-2"
          >
            Download XLSX
          </button>
          <button
            onClick={triggerFileUpload}
            className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 mr-2"
          >
            Upload XLSX
          </button>
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </div>
        {/* Add Student Modal */}
        {showAddStudentModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-md w-80">
              <h3 className="text-lg font-bold mb-4">Add Students</h3>
              <input
                type="number"
                min="1"
                value={numRowsToAdd}
                onChange={(e) => {
                  const val = e.target.value;
                  // Accept only positive integers (or empty string)
                  if (val === "" || /^[1-9]\d*$/.test(val)) {
                    setNumRowsToAdd(val);
                  }
                }}
                placeholder="Enter number of rows"
                className="border p-2 mb-4 w-full"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setNumRowsToAdd("");
                  }}
                  className="mr-2 bg-gray-300 text-black px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const count = parseInt(numRowsToAdd, 10);
                    if (!isNaN(count) && count > 0) {
                      addRows(count);
                      setShowAddStudentModal(false);
                      setNumRowsToAdd("");
                    }
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popup for saved records */}
        {popupVisible && (
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
                <span>Records have been saved successfully!</span>
              </div>
            </div>
          </div>
        )}
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
                <span>Report Published!</span>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Table */}
        <div className="overflow-y-auto max-h-[500px] border border-gray-300">
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100 sticky top-0 z-10">
              {headers.map((headerRow, rowIndex) => (
                <tr key={rowIndex}>
                  {headerRow.map((header, colIndex) => (
                    <th
                      key={`${rowIndex}-${colIndex}`}
                      colSpan={header.colSpan}
                      rowSpan={header.rowSpan}
                      className="border border-gray-300 px-4 py-2 text-center"
                    >
                      {header.label}
                    </th>
                  ))}
                  {rowIndex === 0 && (
                    <th
                      colSpan={1}
                      rowSpan={globalMaxRow + 1}
                      className="border border-gray-300 px-4 py-2 text-center"
                    >
                      {`Total Marks (${totalMarks})`}
                    </th>
                  )}
                </tr>
              ))}
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => {
                let total = 0;
                for (let i = 1; i < row.length; i++) {
                  const num = parseFloat(row[i]);
                  total += isNaN(num) ? 0 : num;
                }
                return (
                  <tr key={startIndex + rowIndex}>
                    {row.map((cell, colIndex) => (
                      <td
                        key={colIndex}
                        className="border border-gray-300 px-4 py-2"
                      >
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) =>
                            handleCellChange(
                              startIndex + rowIndex,
                              colIndex,
                              e.target.value
                            )
                          }
                          className="w-full border-none bg-transparent focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {total}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <button onClick={() => deleteRow(startIndex + rowIndex)}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-red-500 hover:text-red-700"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination: Fixed at the bottom */}
        <div className="flex items-center justify-between mt-4 bg-white py-3 sticky bottom-0 z-10">
          <div>
            <span>Rows per page: </span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="border p-2 rounded"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="px-2 py-1 border rounded mr-2"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="px-2 py-1 border rounded ml-2"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionResult;
