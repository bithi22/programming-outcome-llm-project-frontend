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
  const [globalMaxRow,setGlobalMaxRow] = useState(0)
  const [totalMarks, setTotalMarks] = useState(0)
  // This array will hold the maximum allowed marks for each marks cell (excluding Student ID)
  const [maxMarksArray, setMaxMarksArray] = useState([]);
  const fileInputRef = useRef(null);
  const question_id = location.state?.question_id;

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
      if (rowIndex === headerRowCount - 1) {
        headerMatrix[rowIndex][totalColumnsWithTotal - 1] = "Total Marks";
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
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
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
    let t_marks = 0

    // Build hierarchical headers from co_po_mapping.
    const buildHeaders = (mapping) => {
      const headerLevels = [];

      const getMaxRows = (key, value) => {
        if (value["sub-sections"]) {
          maxRow = Math.max(1, maxRow);
          Object.entries(value["sub-sections"]).forEach(([sub_key, sub_value]) => {
            getMaxRows(sub_key, sub_value);
          });
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
          t_marks += value.marks
        }
        headerLevels[level].push(headerCell);
        let currentIndex = headerLevels[level].length - 1;

        if (value["sub-sections"]) {
          let child_counter = 0;
          Object.entries(value["sub-sections"]).forEach(([sub_key, sub_value]) => {
            child_counter += co_po_dfs(sub_key, sub_value, level + 1, headerCell.label);
          });
          headerLevels[level][currentIndex].colSpan = child_counter;
          return child_counter;
        } else if (value["sub-sub-sections"]) {
          let child_counter = 0;
          Object.entries(value["sub-sub-sections"]).forEach(([sub_key, sub_value]) => {
            child_counter += co_po_dfs(sub_key, sub_value, level + 1, headerCell.label);
          });
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
    setGlobalMaxRow(maxRow)
    setTotalMarks(t_marks)

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
            Object.entries(questionData["sub-sections"]).forEach(([subSection, subData]) => {
              if (subData["sub-sub-sections"]) {
                Object.entries(subData["sub-sub-sections"]).forEach(([sub_sub_section, sub_sub_data]) => {
                  row.push(
                    sub_sub_data.obtained_marks !== undefined
                      ? sub_sub_data.obtained_marks
                      : ""
                  );
                });
              } else {
                row.push(
                  subData.obtained_marks !== undefined
                    ? subData.obtained_marks
                    : ""
                );
              }
            });
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

  // Update cell value with validation for marks cells.
  const handleCellChange = (rowIndex, colIndex, value) => {
    const updatedData = [...data];
    // Student ID column: allow any input.
    if (colIndex === 0) {
      updatedData[rowIndex][colIndex] = value;
      setData(updatedData);
      return;
    }
    // Allow empty string.
    if (value === "") {
      updatedData[rowIndex][colIndex] = "";
      setData(updatedData);
      return;
    }
    // Only allow numeric digits (no spaces or letters).
    if (!/^\d+$/.test(value)) {
      return;
    }
    let numericValue = parseInt(value, 10);
    // Get maximum allowed for this cell (note: first marks cell is at index 1).
    const max = maxMarksArray[colIndex - 1];
    if (numericValue < 0) {
      numericValue = 0;
    }
    if (numericValue > max) {
      numericValue = max;
    }
    updatedData[rowIndex][colIndex] = numericValue.toString();
    setData(updatedData);
  };

  const addRow = () => {
    const newRow = Array(totalColumns).fill("");
    setData((prevData) => [...prevData, newRow]);
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
        Object.entries(value["sub-sections"]).forEach(([sub_key, sub_value]) => {
          construct_marks_mapping(sub_key, sub_value, current);
        });
      } else if (value["sub-sub-sections"]) {
        Object.entries(value["sub-sub-sections"]).forEach(([sub_key, sub_value]) => {
          construct_marks_mapping(sub_key, sub_value, current);
        });
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
              Object.hasOwn(current[first]["sub-sections"][second], "sub-sub-sections")
            ) {
              if (!Object.hasOwn(current[first]["sub-sections"][second]["sub-sub-sections"], third)) {
                current[first]["sub-sections"][second]["sub-sub-sections"][third] = {};
              }
            } else {
              current[first]["sub-sections"][second]["sub-sub-sections"] = {};
              current[first]["sub-sections"][second]["sub-sub-sections"][third] = {};
            }
          }

          if (j === value.length - 1) {
            if (j === 0) {
              current[first]["obtained_marks"] = data[i][counter];
            } else if (j === 1) {
              current[first]["sub-sections"][second]["obtained_marks"] = data[i][counter];
            } else {
              current[first]["sub-sections"][second]["sub-sub-sections"][third]["obtained_marks"] = data[i][counter];
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
          newRow[i] = row[i] ?? "";
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

  return (
    <div>
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />
      <div className="container mx-auto px-6 mt-24">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={addRow}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Add Student
          </button>
          <button
            onClick={saveRecord}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 ml-2"
          >
            Save Record
          </button>
          {!question?.report_submitted && (
            <button
              onClick={publishResult}
              className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 ml-2"
            >
              Publish Result
            </button>
          )}
          <button
            onClick={downloadXLSX}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 ml-2"
          >
            Download CSV
          </button>
          <button
            onClick={triggerFileUpload}
            className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 ml-2"
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
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              {headers.map((headerRow, rowIndex) => (
                <tr key={rowIndex}>
                  {headerRow.map((header, colIndex) => (
                    <th
                      key={`${rowIndex}-${colIndex}`}
                      colSpan={header.colSpan}
                      rowSpan={header.rowSpan}
                      className="border border-gray-300 px-4 py-2 bg-gray-100 text-center"
                    >
                      {header.label}
                    </th>
                  ))}
                  {rowIndex === 0 && (
                    <th 
                    colSpan={1}
                    rowSpan={globalMaxRow+1}                    
                    className="border border-gray-300 px-4 py-2 bg-gray-100 text-center">
                      {`Total Marks (${totalMarks})`}
                    </th>
                  )}
                </tr>
              ))}
            </thead>
            <tbody>
              {data.map((row, rowIndex) => {
                // Compute the total marks for this student (ignoring Student ID).
                let total = 0;
                for (let i = 1; i < row.length; i++) {
                  const num = parseFloat(row[i]);
                  total += isNaN(num) ? 0 : num;
                }
                return (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="border border-gray-300 px-4 py-2">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) =>
                            handleCellChange(rowIndex, colIndex, e.target.value)
                          }
                          className="w-full border-none bg-transparent focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {total}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <button onClick={() => deleteRow(rowIndex)}>
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
      </div>
    </div>
  );
}

export default QuestionResult;

