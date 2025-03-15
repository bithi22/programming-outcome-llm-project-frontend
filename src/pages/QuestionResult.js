import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

axios.defaults.withCredentials = true; // Enables sending cookies with every request


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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [addStudentModalError, setAddStudentModalError] = useState('')

  const navItems = [];
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
      // If record is null or empty, return 5 empty rows
      if (record == null || Object.entries(record).length === 0) {
        return Array.from({ length: 5 }, () => Array(t_columns).fill(""));
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

    // Get the maximum allowed for this cell (first marks cell is at index 1).
    const max = maxMarksArray[colIndex - 1];

    if (value === "") {
      updatedData[rowIndex][colIndex] = "";
      setData(updatedData);
      return;
    }

    const decimalPattern = /^\d*\.?\d*$/;
    if (!decimalPattern.test(value)) {
      return;
    }

    if (value.endsWith(".")) {
      updatedData[rowIndex][colIndex] = value;
      setData(updatedData);
      return;
    }

    let numericValue = parseFloat(value);
    if (numericValue < 0) {
      numericValue = 0;
    }
    if (numericValue > max) {
      numericValue = max;
    }

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
    setError('')
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
      setIsLoading(true);
      const response = await axios.put(
        `http://localhost:8000/question/current-record`,
        requestBody,
        {
          headers: {
            accessToken: token,
          },
        }
      );

      if (response.status === 200) {
        setTimeout(() => {
          setIsLoading(false);
          setPopupVisible(true);
        }, 1500);
        setTimeout(() => {
          setPopupVisible(false);
        }, 4500);
      } else {
        setTimeout(() => {
          setIsLoading(false);
          setError(response.data.message);
        }, 1500);
      }
    } catch (error) {
      setTimeout(() => {
        setIsLoading(false);
        setError(error?.response?.data?.message);
      }, 1500);
    }
  };

  const publishResult = async () => {
    setError('')
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("Access token not found");
      return;
    }

    if (question.report_submitted) {
      setError('Report is already submitted.')
      return;
    }

    const obtained_marks_mapping = getObtainedMarksMapping();

    setIsLoading(true)
    try {
      const response = await axios.put(
        `http://localhost:8000/report/publish`,
        {
          question_id,
          current_record: obtained_marks_mapping,
        },
        { headers: { accessToken: token } }
      );
      if (response.status === 200) {
        setTimeout(()=>{
          setIsLoading(false)
          setPopupMessage(true);
          question.report_submitted = true;
        },1500)
        setTimeout(() => setPopupMessage(false), 4500);
      } else {
        setTimeout(()=>{
          setIsLoading(false)
          setError(response.data.message)
        },1500)
      }
    } catch (error) {
      setTimeout(()=>{
        setIsLoading(false)
        setError(error.response?.data?.message)
      },1500)
    }
  };

  function convertToNumber(value) {
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      let trimmed = value.trim();
      if (trimmed === "") {
        return "";
      }
      let num = Number(trimmed);
      return isNaN(num) ? "" : num;
    }
    return "";
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

      const fileData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headerRowCount = headers.length || 0;
      const dataRows = fileData.slice(headerRowCount);
      const filteredRows = dataRows.filter(
        (row) => row[0] !== undefined && row[0] !== null && row[0] !== ""
      );
      const trimmedRows = filteredRows.map((row) => row.slice(0, totalColumns));

      const finalData = trimmedRows.map((row) => {
        const newRow = [];
        for (let i = 0; i < totalColumns; i++) {
          if (i === 0) {
            // Student ID column: leave as is.
            newRow[i] = String(row[i]) || "";
          } else {
            let cellValue = convertToNumber(row[i]);
            if (cellValue === "") {
              newRow[i] = "";
            } else {
              let numValue = Number(cellValue);
              // If negative, set to 0.
              if (numValue < 0) {
                numValue = 0;
              }
              // Cap value to allowed marks if it exceeds max.
              const allowedMax = maxMarksArray[i - 1];
              if (allowedMax !== undefined && numValue > allowedMax) {
                numValue = allowedMax;
              }
              newRow[i] = numValue.toString();
            }
          }
        }
        return newRow;
      });

      if (finalData.length === 0) {
        setData(Array.from({ length: 5 }, () => Array(totalColumns).fill("")));
      } else {
        setData(finalData);
      }
    };

    reader.readAsBinaryString(file);
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + rowsPerPage);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  return (
    <div>
      <Navbar
        navItems={navItems} 
        logout={true}
        />
      <div className="container mx-auto px-6 mt-24 mb-6">
        {/* Top buttons container without a white bg */}
        <div className="flex flex-wrap items-center justify-between mb-4 py-3 ">
          <div className="flex space-x-4">
            <button
              onClick={() => setShowAddStudentModal(true)}
              disabled={isLoading}
              className={`bg-green-700 text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-green-800 transition easeInOut ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Add Student
            </button>
            <button
              onClick={saveRecord}
              disabled={isLoading}
              className={`bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Save Record
            </button>
            {!question?.report_submitted && (
              <button
                onClick={publishResult}
                disabled={isLoading}
                className={`bg-purple-700 text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-purple-800 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Publish Result
              </button>
            )}
          </div>
          <div className="flex space-x-4 justify-end">
            <button
              onClick={downloadXLSX}
              disabled={isLoading}
              className="border-2 border-[#3941FF] text-[#3941FF] justify-end py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] hover:text-white hover:border-[#2C36CC] transition"
            >
              Download XLSX
            </button>
            <button
              onClick={triggerFileUpload}
              disabled={isLoading}
              className="border-2 border-[#3941FF] text-[#3941FF] justify-end py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] hover:text-white hover:border-[#2C36CC] transition"
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
        </div>

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
                  if (val === "" || /^[1-9]\d*$/.test(val)) {
                    setNumRowsToAdd(val);
                  }
                }}
                placeholder="Enter number of rows"
                className="border p-2 mb-4 w-full"
              />
              {addStudentModalError && (
                <p className="text-red-500 text-center mb-4 font-bold">{addStudentModalError}</p>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setNumRowsToAdd("");
                    setAddStudentModalError('')
                  }}
                  className="bg-gray-300 text-black py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const count = parseInt(numRowsToAdd, 10);
                    if (!isNaN(count) && count > 0) {
                      setAddStudentModalError('')
                      addRows(count);
                      setShowAddStudentModal(false);
                      setNumRowsToAdd("");
                    }
                    else{
                      setAddStudentModalError('Please provide a positive integer.')
                    }
                  }}
                  className={`bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC]`}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

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
        {isLoading && (
          <p className="text-red-500 mb-4 font-bold">{isLoading}</p>
        )}
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

        <div className="overflow-y-auto max-h-[500px] border border-gray-300">
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead className="">
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
                        className="border border-gray-300 px-4 py-2 bg-white text-black"
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
                    <td className="border border-gray-300 px-4 py-2 text-center bg-white text-black">
                      {total}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center bg-white text-black">
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
        {/* Bottom pagination container without white bg */}
        <div className="flex items-center justify-between mt-4 py-3 ">
          <div>
            <span>Rows per page: </span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="border-2 border-black text-black p-1 rounded bg-transparent"
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
              className="border-2 border-[#3941FF] text-[#3941FF] justify-end py-1 px-2 mx-2 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] hover:text-white hover:border-[#2C36CC] transition disabled:hover:bg-transparent disabled:hover:text-[#3941FF] disabled:hover:border-[#3941FF] disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="border-2 border-[#3941FF] text-[#3941FF] justify-end py-1 px-2 mx-2 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] hover:text-white hover:border-[#2C36CC] transition disabled:hover:bg-transparent disabled:hover:text-[#3941FF] disabled:hover:border-[#3941FF] disabled:cursor-not-allowed"
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
