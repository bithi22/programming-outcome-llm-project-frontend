// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import Navbar from '../components/Navbar';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';

// function QuestionResult() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { question } = location.state || {};
//   const { classroom_id } = location.state || {};
//   const [headers, setHeaders] = useState([]);
//   const [popupMessage, setPopupMessage] = useState('');
//   const [data, setData] = useState([]);
//   const [popupVisible, setPopupVisible] = useState(false);
//   const [totalColumns, setTotalColumns] = useState(0)
//   // console.log(question);
//   const question_id = location.state?.question_id;

//   const navItems = [
//     { label: 'Join Class', path: '/joinclass' },
//     { label: 'Generate Report', path: '/generatereport' },
//   ];
//   const actionButton = { label: 'Logout', path: '/logout' };
  
  
//   const downloadXLSX = () => {
//     // Build a header matrix from hierarchical headers.
//     const headerRowCount = headers.length;
//     // Create an empty matrix with headerRowCount rows and totalColumns columns.
//     const headerMatrix = Array.from({ length: headerRowCount }, () =>
//       Array(totalColumns).fill("")
//     );
  
//     // Collect merge ranges for cells with colSpan/rowSpan > 1.
//     const merges = [];
  
//     // Iterate over each header row from our hierarchical headers.
//     headers.forEach((row, rowIndex) => {
//       let colIndex = 0;
//       row.forEach((cell) => {
//         // Find the next available empty cell in the current row.
//         while (headerMatrix[rowIndex][colIndex] !== "") {
//           colIndex++;
//         }
//         // Place the header label.
//         headerMatrix[rowIndex][colIndex] = cell.label;
  
//         // Determine span values.
//         const colSpan = cell.colSpan || 1;
//         const rowSpan = cell.rowSpan || 1;
//         if (colSpan > 1 || rowSpan > 1) {
//           // Record merge range (using zero-based indices).
//           merges.push({
//             s: { r: rowIndex, c: colIndex },
//             e: { r: rowIndex + rowSpan - 1, c: colIndex + colSpan - 1 }
//           });
//           // Mark merged cells (except the top-left one) with null so they aren’t overwritten.
//           for (let i = rowIndex; i < rowIndex + rowSpan; i++) {
//             for (let j = colIndex; j < colIndex + colSpan; j++) {
//               if (i === rowIndex && j === colIndex) continue;
//               headerMatrix[i][j] = null;
//             }
//           }
//         }
//         // Move colIndex forward by colSpan.
//         colIndex += colSpan;
//       });
//     });
  
//     // Combine header rows and data rows.
//     const sheetData = [...headerMatrix, ...data];
  
//     // Create worksheet from the array-of-arrays.
//     const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
//     // Apply the merges.
//     worksheet["!merges"] = merges;
  
//     // Create a new workbook and append the worksheet.
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
//     // Write the workbook to a binary array.
//     const workbookBinary = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  
//     // Trigger file download using file-saver.
//     saveAs(
//       new Blob([workbookBinary], {
//         type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
//       }),
//       "report.xlsx"
//     );
//   };
  

//   useEffect(() => {
//     if (!question) {
//       console.error('Question details or current record not provided.');
//       return;
//     }
  
//     const { current_record, co_po_mapping } = question;
  
//     let maxRow = 0
//     let t_columns = 1

//     // Build hierarchical headers from co_po_mapping and append marks to lowest-level headers
//     const buildHeaders = (mapping) => {
//       const headerLevels = [];
  
//       const getMaxRows = (key,value)=>{

//         if(value['sub-sections']){
//           maxRow = Math.max(1,maxRow)
          
//           Object.entries(value['sub-sections']).forEach(([sub_key,sub_value])=>{
//             getMaxRows(sub_key,sub_value)
//           })
//         }
//         else if(value['sub-sub-sections']){
//           maxRow = Math.max(2,maxRow)
//         }
        
//       }

//       Object.entries(mapping).forEach(([key,value]) => {
//         getMaxRows(key,value)
//       })


//       const co_po_dfs = (key,value,level,parentLabel)=>{
//         if (!headerLevels[level]) headerLevels[level] = [];

//         let label = parentLabel ? `${key}` : key;
  
//         // If this node has a "marks" key, append marks to the label
//         if (value.marks !== undefined) {
//           label = `${key} (${value.marks})`;
//         }

//         headerLevels[level].push({ label, colSpan: 1, rowSpan : 1 });
//         let currentIndex = headerLevels[level].length-1

//         if(value['sub-sections']){
//           let child_counter = 0
//           Object.entries(value['sub-sections']).forEach(([sub_key,sub_value])=>{
//             child_counter += co_po_dfs(sub_key,sub_value,level+1,label)
//           })
//           return headerLevels[level][currentIndex].colSpan = child_counter
//         }
//         else if(value['sub-sub-sections']){
//           let child_counter = 0
//           Object.entries(value['sub-sub-sections']).forEach(([sub_key,sub_value])=>{
//             child_counter += co_po_dfs(sub_key,sub_value,level+1,label)
//           })
//           return headerLevels[level][currentIndex].colSpan = child_counter
//         }
//         else{
//           headerLevels[level][currentIndex].rowSpan = maxRow - level + 1
//           t_columns +=1
//           return 1
//         }

//       }

//       Object.entries(mapping).forEach(([key,value]) => {
//         co_po_dfs(key,value,0,'')
//       })
//       return headerLevels;
//     };
  
//     const hierarchicalHeaders = buildHeaders(co_po_mapping);
//     // After you compute hierarchicalHeaders and maxRow:
//     if (hierarchicalHeaders.length > 0) {
//       hierarchicalHeaders[0].unshift({
//         label: 'Student ID',
//         colSpan: 1,
//         rowSpan: maxRow + 1 // or maxRow if that lines up better with your data
//       });
//     }
//     setTotalColumns(t_columns)
//     setHeaders(hierarchicalHeaders);
  
//     // Function to transform current_record into row-wise data for the table
//     const transformData = (record) => {
//       if(record==null){
//         return []
//       }
//       return Object.entries(record).map(([studentId, studentData]) => {
//         let row = [studentId]; // First column is the student ID
  
//         // Flatten the nested structure
//         Object.entries(studentData).forEach(([questionId, questionData]) => {
//           if (questionData['sub-sections']) {
//             Object.entries(questionData['sub-sections']).forEach(([subSection, subData]) => {
//               // Ensure 0 values are not replaced with empty strings
//               row.push(subData.obtained_marks !== undefined ? subData.obtained_marks : '');
//             });
//           }
//         });
  
//         return row;
//       });
//     };
  
//     const initialData = transformData(current_record);
//     setData(initialData);
//   }, [question]);

  

//   const handleCellChange = (rowIndex, colIndex, value) => {
//     const updatedData = [...data];
//     updatedData[rowIndex][colIndex] = value;
//     setData(updatedData);
//   };

//   const addRow = () => {
//     // console.log(headers)
//     const newRow = Array(totalColumns).fill('');
//     // newRow.unshift(''); // Add an empty cell for the student name
//     setData((prevData) => [...prevData, newRow]);
//   };

//   const deleteRow = (rowIndex) => {
//     const updatedData = data.filter((_, index) => index !== rowIndex);
//     setData(updatedData);
//   };

//   const saveRecord = async () => {
//     // const currentRecord = data.map(row => row.join(',')).join('\n');
//     // const requestBody = {
//     //   current_record: currentRecord,
//     //   question_id: question_id,
//     // };
//     // console.log("Record Saving", requestBody);
//     // const token = localStorage.getItem('accessToken');

//     // if (!token) {
//     //   console.error('Access token not found');
//     //   return;
//     // }

//     // try {
//     //   const response = await axios.put(`http://127.0.0.1:8000/question/current-record`, requestBody, {
//     //     headers: {
//     //       accessToken: token,
//     //     },
//     //   });

//     //   if (response.status === 200) {
//     //     console.log("Setting popup visible");
//     //     setPopupVisible(true);
//     //     setTimeout(() => {
//     //       setPopupVisible(false);
//     //     }, 3000);
//     //   } else {
//     //     console.error('Failed to save record:', response.statusText);
//     //   }
//     // } catch (error) {
//     //   console.error('Error saving record:', error);
//     // }

//     return 
//   };

//   const generateResult = async () => {
//     const token = localStorage.getItem('accessToken');

//     if (!token) {
//       console.error('Access token not found');
//       return;
//     }

//     try {
//       const response = await axios.put(`http://127.0.0.1:8000/report/generate`, { question_id }, {
//         headers: {
//           accessToken: token,
//         },
//       });

//       if (response.status === 201) {
//         setPopupMessage(true);
//         setTimeout(() => setPopupMessage(false), 3000);
//       } else {
//         console.error('Failed to generate report:', response.statusText);
//       }
//     } catch (error) {
//       console.error('Error generating report:', error);
//     }
//   };

//   return (
//     <div>
//       <Navbar
//         navItems={navItems}
//         actionButton={actionButton}
//         buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
//       />
//       <div className="container mx-auto px-6 mt-24">
//         <div className="flex justify-between items-center mb-4">
//           <button
//             onClick={addRow}
//             className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
//           >
//             Add Student
//           </button>
//           <button
//             onClick={saveRecord}
//             className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 ml-2"
//           >
//             Save Record
//           </button>
//           <button
//             onClick={generateResult}
//             className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 ml-2"
//           >
//             Generate Result
//           </button>
//           <button
//   onClick={downloadXLSX}
//   className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 ml-2"
// >
//   Download CSV
// </button>
//         </div>
//         {/* Popup */}
//         {popupVisible && (
//           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
//             <div className="bg-blue-500 text-white px-6 py-4 rounded-md shadow-lg">
//               <div className="flex items-center">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   className="h-6 w-6 text-white mr-2"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
//                   />
//                 </svg>
//                 <span>Records have been saved successfully!</span>
               
//               </div>
//             </div>
//           </div>
//         )}

// {popupMessage && (
//           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
//             <div className="bg-blue-500 text-white px-6 py-4 rounded-md shadow-lg">
//               <div className="flex items-center">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   className="h-6 w-6 text-white mr-2"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
//                   />
//                 </svg>
//                 <span>Report Published!</span>
               
//               </div>
//             </div>
//           </div>
//         )}
//         {/* Table */}
//         <div className="overflow-x-auto">
//           <table className="table-auto w-full border-collapse border border-gray-300">
//             <thead>
//               {headers.map((headerRow, rowIndex) => (
//                 <tr key={rowIndex}>
//                   {headerRow.map((header, colIndex) => (
//                     <th
//                       key={`${rowIndex}-${colIndex}`}
//                       colSpan={header.colSpan}
//                       rowSpan={header.rowSpan}
//                       className="border border-gray-300 px-4 py-2 bg-gray-100 text-center"
//                     >
//                       {header.label}
//                     </th>
//                   ))}
//                 </tr>
//               ))}
//             </thead>
//             <tbody>
//               {data.map((row, rowIndex) => (
//                 <tr key={rowIndex}>
//                   {row.map((cell, colIndex) => (
//                     <td key={colIndex} className="border border-gray-300 px-4 py-2">
//                       <input
//                         type="text"
//                         value={cell}
//                         onChange={(e) =>
//                           handleCellChange(rowIndex, colIndex, e.target.value)
//                         }
//                         className="w-full border-none bg-transparent focus:outline-none"
//                       />
//                     </td>
//                   ))}
//                   <td className="border border-gray-300 px-4 py-2 text-center">
//                     <button onClick={() => deleteRow(rowIndex)}>
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         className="h-6 w-6 text-red-500 hover:text-red-700"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M6 18L18 6M6 6l12 12"
//                         />
//                       </svg>
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default QuestionResult;


import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function QuestionResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { question } = location.state || {};
  const { classroom_id } = location.state || {};
  const [headers, setHeaders] = useState([]);
  const [popupMessage, setPopupMessage] = useState('');
  const [data, setData] = useState([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [totalColumns, setTotalColumns] = useState(0);
  const fileInputRef = useRef(null);
  // console.log(question);
  const question_id = location.state?.question_id;

  const navItems = [
    { label: 'Join Class', path: '/joinclass' },
    { label: 'Generate Report', path: '/generatereport' },
  ];
  const actionButton = { label: 'Logout', path: '/logout' };

  const downloadXLSX = () => {
    // Build a header matrix from hierarchical headers.
    const headerRowCount = headers.length;
    const headerMatrix = Array.from({ length: headerRowCount }, () =>
      Array(totalColumns).fill("")
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
            e: { r: rowIndex + rowSpan - 1, c: colIndex + colSpan - 1 }
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
    });

    const sheetData = [...headerMatrix, ...data];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    worksheet["!merges"] = merges;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const workbookBinary = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([workbookBinary], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
      }),
      "report.xlsx"
    );
  };

  useEffect(() => {
    if (!question) {
      console.error('Question details or current record not provided.');
      return;
    }

    const { current_record, co_po_mapping } = question;
    let maxRow = 0;
    let t_columns = 1;

    // Build hierarchical headers from co_po_mapping and append marks to lowest-level headers
    const buildHeaders = (mapping) => {
      const headerLevels = [];

      const getMaxRows = (key, value) => {
        if (value['sub-sections']) {
          maxRow = Math.max(1, maxRow);
          Object.entries(value['sub-sections']).forEach(([sub_key, sub_value]) => {
            getMaxRows(sub_key, sub_value);
          });
        } else if (value['sub-sub-sections']) {
          maxRow = Math.max(2, maxRow);
        }
      };

      Object.entries(mapping).forEach(([key, value]) => {
        getMaxRows(key, value);
      });

      const co_po_dfs = (key, value, level, parentLabel) => {
        if (!headerLevels[level]) headerLevels[level] = [];
        let label = parentLabel ? `${key}` : key;
        if (value.marks !== undefined) {
          label = `${key} (${value.marks})`;
        }
        headerLevels[level].push({ label, colSpan: 1, rowSpan: 1 });
        let currentIndex = headerLevels[level].length - 1;

        if (value['sub-sections']) {
          let child_counter = 0;
          Object.entries(value['sub-sections']).forEach(([sub_key, sub_value]) => {
            child_counter += co_po_dfs(sub_key, sub_value, level + 1, label);
          });
          headerLevels[level][currentIndex].colSpan = child_counter;
          return child_counter;
        } else if (value['sub-sub-sections']) {
          let child_counter = 0;
          Object.entries(value['sub-sub-sections']).forEach(([sub_key, sub_value]) => {
            child_counter += co_po_dfs(sub_key, sub_value, level + 1, label);
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
        co_po_dfs(key, value, 0, '');
      });
      return headerLevels;
    };

    const hierarchicalHeaders = buildHeaders(co_po_mapping);
    if (hierarchicalHeaders.length > 0) {
      hierarchicalHeaders[0].unshift({
        label: 'Student ID',
        colSpan: 1,
        rowSpan: maxRow + 1
      });
    }
    setTotalColumns(t_columns);
    setHeaders(hierarchicalHeaders);

    const transformData = (record) => {
      if (record == null) {
        return [];
      }
      return Object.entries(record).map(([studentId, studentData]) => {
        let row = [studentId];
        Object.entries(studentData).forEach(([questionId, questionData]) => {
          if (questionData['sub-sections']) {
            Object.entries(questionData['sub-sections']).forEach(([subSection, subData]) => {
              row.push(subData.obtained_marks !== undefined ? subData.obtained_marks : '');
            });
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
    updatedData[rowIndex][colIndex] = value;
    setData(updatedData);
  };

  const addRow = () => {
    const newRow = Array(totalColumns).fill('');
    setData((prevData) => [...prevData, newRow]);
  };

  const deleteRow = (rowIndex) => {
    const updatedData = data.filter((_, index) => index !== rowIndex);
    setData(updatedData);
  };

  const saveRecord = async () => {
    // The saveRecord logic is currently commented out.
    return;
  };

  const generateResult = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('Access token not found');
      return;
    }
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/report/generate`,
        { question_id },
        { headers: { accessToken: token } }
      );
      if (response.status === 201) {
        setPopupMessage(true);
        setTimeout(() => setPopupMessage(false), 3000);
      } else {
        console.error('Failed to generate report:', response.statusText);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (evt) => {
      const binaryStr = evt.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
  
      // Convert the worksheet to a 2D array (array-of-arrays).
      const fileData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Number of header rows in your table (based on your hierarchical headers).
      const headerRowCount = headers.length || 0;
  
      // 1) Remove the header rows from the data
      const dataRows = fileData.slice(headerRowCount);
  
      // 2) Filter out rows that do NOT have a "Student ID" in the first column
      //    (i.e., skip rows where the first cell is empty/undefined).
      const filteredRows = dataRows.filter(
        (row) => row[0] !== undefined && row[0] !== null && row[0] !== ''
      );
  
      // 4) Pad each row so all rows have the same number of columns,
      //    turning undefined cells into empty strings
      const finalData = filteredRows.map((row) => {
        const newRow = [];
        for (let i = 0; i < totalColumns; i++) {
          newRow[i] = row[i] ?? '';
        }
        return newRow;
      });
  
      // 5) Update your table data and totalColumns (so the table can display all columns)
      setData(finalData);
    };
  
    reader.readAsBinaryString(file);
  };
  
  // Trigger the hidden file input.
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
          <button
            onClick={generateResult}
            className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 ml-2"
          >
            Generate Result
          </button>
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
            style={{ display: 'none' }}
          />
        </div>
        {/* Popup */}
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
        {/* Table */}
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
                </tr>
              ))}
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default QuestionResult;
