// import React, { useState } from 'react';
// import axios from 'axios';
// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import Navbar from '../components/Navbar';
// import { useLocation } from 'react-router-dom';

// function QuestionReport() {
//   const location = useLocation()
//   const {question_id, question_name} = location.state
//   const [student_id, setstudent_id] = useState('');
//   const [reportData, setReportData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [studentReport,setStudentReport] = useState(false)
//   const [averageReport,setAverageReport] = useState(false)
//   const [overallReport,setOverallReport] = useState(false)

//   const navItems = [
//     { label: 'Join Class', path: '/joinclass' },
//     { label: 'Generate Report', path: '/generatereport' },
//   ];

//   const actionButton = { label: 'Logout', path: '/logout' };

//   const downloadPDF = () => {
//     const doc = new jsPDF();

//     // Set title
//     doc.setFontSize(16);
//     doc.text(`Report for: ${question_name}`, doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });

//     // Student ID
//     doc.setFontSize(14);
//     if(studentReport){
//       doc.text(`Student ID: ${student_id}`, doc.internal.pageSize.getWidth() / 2, 30, { align: "center" });
//     }
//     else if(averageReport){
//       doc.text(`Average Report`, doc.internal.pageSize.getWidth() / 2, 30, { align: "center" });
//     }

//     // Define starting y position for tables
//     let yPosition = 50;

//     // PO Grades Table
//     if (reportData.po_grades && Object.keys(reportData.po_grades).length > 0) {
//       doc.setFontSize(12);
//       doc.text("PO Grades", doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" });

//       yPosition += 5;

//       autoTable(doc,{
//         startY: yPosition + 5,
//         head: [["PO", "Grade (%)"]],
//         body: Object.entries(reportData.po_grades).map(([key, value]) => [key, `${value}%`]),
//         theme: "grid",
//         styles: { halign: "center" },
//       })

//       yPosition = doc.lastAutoTable.finalY + 10;
//     }

//     // Cognitive Grades Table
//     if (reportData.cognitive_grades && Object.keys(reportData.cognitive_grades).length > 0) {
//       doc.setFontSize(12);
//       doc.text("Cognitive Grades", doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" });

//       yPosition += 5;

//       autoTable(doc,{
//         startY: yPosition + 5,
//         head: [["Category", "Grade (%)"]],
//         body: Object.entries(reportData.cognitive_grades).map(([key, value]) => [key, `${value}%`]),
//         theme: "grid",
//         styles: { halign: "center" },
//       });
//     }

//     // Save the PDF
//     if(studentReport){
//       doc.save(`Report_${student_id}.pdf`);
//     }
//     else if(averageReport){
//       doc.save(`Average Report.pdf`);
//     }
//   };

//   const fetchStudentReport = async () => {
//     if (!student_id) {
//       setError('Please enter a valid Student ID.');
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     const token = localStorage.getItem('accessToken');

//     if (!token) {
//       setError('Access token not found.');
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await axios.get(
//         `http://127.0.0.1:8000/report/question/${question_id}/${student_id}`,
//         {
//           headers: { accessToken: token },
//         }
//       );

//       if (response.data.success) {
//         setReportData(response.data.data);
//         setStudentReport(true)
//         setAverageReport(false)
//         setOverallReport(false)
//       } else {
//         setError('Failed to fetch report.');
//         setReportData(null)
//       }
//     } catch (err) {
//       setError('Error while fetching report.');
//       setReportData(null)
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchAverageReport = async () => {
//     setLoading(true);
//     setError(null);
//     const token = localStorage.getItem('accessToken');

//     if (!token) {
//       setError('Access token not found.');
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await axios.get(
//         `http://127.0.0.1:8000/report/question/${question_id}/average`,
//         {
//           headers: { accessToken: token },
//         }
//       );

//       if (response.data.success) {
//         setReportData(response.data.data);
//         setStudentReport(false)
//         setAverageReport(true)
//         setOverallReport(false)
//       } else {
//         setError('Failed to fetch report.');
//         setReportData(null)
//       }
//     } catch (err) {
//       setError('Error while fetching report.');
//       setReportData(null)
//     } finally {
//       setLoading(false);
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
//         <div className="flex items-center gap-4 mb-6">
//           <input
//             type="text"
//             value={student_id}
//             onChange={(e) => setstudent_id(e.target.value)}
//             placeholder="Enter Student ID"
//             className="border border-gray-300 px-4 py-2 rounded-md"
//           />
//           <button
//             onClick={fetchStudentReport}
//             className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
//           >
//             Get Student Report
//           </button>
//           <button
//             onClick={fetchAverageReport}
//             className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
//           >
//             Get Average Report
//           </button>
//           {reportData && (
//             <button
//             onClick={downloadPDF}
//             className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
//           >
//             Download Report
//           </button>
//           )}
//         </div>

//         {loading && <p>Loading report...</p>}
//         {error && <p className="text-red-500">{error}</p>}

//         {reportData && (
//           <div className="mt-6 flex flex-col items-center w-full">
//           <div className="w-full max-w-2xl">
//             {studentReport && (
//             <h2 className="text-xl font-bold mb-2 text-center">{`Report of Student ID : ${student_id}`}</h2>
//             )}
//             {averageReport && (
//             <h2 className="text-xl font-bold mb-2 text-center">{`Average Report`}</h2>
//             )}
//             <h2 className="text-xl font-bold mb-2 text-center">PO Grades</h2>
//             <table className="table-fixed w-full border-collapse border border-gray-300 mb-4">
//               <thead>
//                 <tr>
//                   <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">PO</th>
//                   <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">Grade (%)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {Object.entries(reportData.po_grades).map(([key, value]) => (
//                   <tr key={key}>
//                     <td className="border border-gray-300 px-4 py-2 text-center">{key}</td>
//                     <td className="border border-gray-300 px-4 py-2 text-center">{value}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <div className="w-full max-w-2xl mt-4">
//             <h2 className="text-xl font-bold mb-2 text-center">Cognitive Grades</h2>
//             <table className="table-fixed w-full border-collapse border border-gray-300 mb-4">
//               <thead>
//                 <tr>
//                   <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">Cognitive Domain</th>
//                   <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">Grade (%)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {Object.entries(reportData.cognitive_grades).map(([key, value]) => (
//                   <tr key={key}>
//                     <td className="border border-gray-300 px-4 py-2 text-center">{key}</td>
//                     <td className="border border-gray-300 px-4 py-2 text-center">{value}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//         )}
//         <div className='mt-6'></div>
//       </div>
//     </div>
//   );
// }

// export default QuestionReport;

import React, { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../components/Navbar";
import { useLocation } from "react-router-dom";
// 1) Import XLSX
import * as XLSX from "xlsx";

function QuestionReport() {
  const location = useLocation();
  const { question_id, question_name } = location.state;

  const [student_id, setstudent_id] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Toggles for different report types
  const [studentReport, setStudentReport] = useState(false);
  const [averageReport, setAverageReport] = useState(false);
  const [overallReport, setOverallReport] = useState(false);

  const navItems = [
    { label: "Join Class", path: "/joinclass" },
    { label: "Generate Report", path: "/generatereport" },
  ];
  const actionButton = { label: "Logout", path: "/logout" };

  // ------------------------------
  // FETCHING FUNCTIONS
  // ------------------------------
  const fetchStudentReport = async () => {
    if (!student_id) {
      setError("Please enter a valid Student ID.");
      return;
    }

    setLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Access token not found.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/report/question/${question_id}/${student_id}`,
        {
          headers: { accessToken: token },
        }
      );

      if (response.data.success) {
        setReportData(response.data.data);
        setStudentReport(true);
        setAverageReport(false);
        setOverallReport(false);
      } else {
        setError("Failed to fetch report.");
        setReportData(null);
      }
    } catch (err) {
      setError("Error while fetching report.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAverageReport = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Access token not found.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/report/question/${question_id}/average`,
        {
          headers: { accessToken: token },
        }
      );

      if (response.data.success) {
        setReportData(response.data.data);
        setStudentReport(false);
        setAverageReport(true);
        setOverallReport(false);
      } else {
        setError("Failed to fetch report.");
        setReportData(null);
      }
    } catch (err) {
      setError("Error while fetching report.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // 2) NEW: Fetch Overall Report
  const fetchOverallReport = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Access token not found.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/report/question/${question_id}/overall`,
        {
          headers: { accessToken: token },
        }
      );

      if (response.data.success) {
        // NOTE: This data is an array of objects, each keyed by student ID
        setReportData(response.data.data);
        setStudentReport(false);
        setAverageReport(false);
        setOverallReport(true);
      } else {
        setError("Failed to fetch overall report.");
        setReportData(null);
      }
    } catch (err) {
      setError("Error while fetching overall report.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // DOWNLOAD HANDLER
  // ------------------------------
  const downloadReport = () => {
    // If Overall Report => download XLSX
    if (overallReport && reportData && reportData.length > 0) {
      // 1) Figure out dynamic keys from the first student
      const firstItem = reportData[0];
      const firstStudentId = Object.keys(firstItem)[0];
      const { po_grades: firstPo, cognitive_grades: firstCog } = firstItem[firstStudentId];
      const poKeys = Object.keys(firstPo);     // e.g. ["PO2", "PO8", "PO3", ...]
      const cogKeys = Object.keys(firstCog);   // e.g. ["Analyzing", "Evaluating", "Knowledge", ...]
    
      // 2) Build the 2D array for the sheet
    
      // Row 0: top-level headers
      // "Student ID" + "PO" (with placeholders) + "Cognitive Domain" (with placeholders)
      const row0 = ["Student ID"];
      // Put "PO"
      row0.push("PO%");
      // Fill placeholders for the rest of the PO columns - 1
      for (let i = 1; i < poKeys.length; i++) {
        row0.push("");
      }
      // Put "Cognitive Domain"
      row0.push("Cognitive Domain%");
      // Fill placeholders for the rest of the Cognitive columns - 1
      for (let i = 1; i < cogKeys.length; i++) {
        row0.push("");
      }
    
      // Row 1: sub-headers (empty cell under "Student ID", then all poKeys, then all cogKeys)
      const row1 = [""].concat(poKeys, cogKeys);
    
      // Start with these two header rows
      const sheetData = [row0, row1];
    
      // 3) Now append each student's data
      //    [ studentId, ...poKeys, ...cogKeys ]
      reportData.forEach((item) => {
        const studentId = Object.keys(item)[0];
        const { po_grades, cognitive_grades } = item[studentId];
    
        // Build the row
        const row = [
          studentId,
          ...poKeys.map((poKey) => po_grades[poKey]),
          ...cogKeys.map((cogKey) => cognitive_grades[cogKey]),
        ];
        sheetData.push(row);
      });
    
      // 4) Convert to worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
    
      // 5) Add merges for the multi-level header
      // "Student ID" merges from row 0 col 0 to row 1 col 0
      // "PO" merges from row 0 col 1 to row 0 col (1 + poKeys.length - 1)
      // "Cognitive Domain" merges from row 0 col (1 + poKeys.length) to row 0 col (1 + poKeys.length + cogKeys.length - 1)
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Student ID
        {
          s: { r: 0, c: 1 },
          e: { r: 0, c: 1 + poKeys.length - 1 },
        },
        {
          s: { r: 0, c: 1 + poKeys.length },
          e: { r: 0, c: 1 + poKeys.length + cogKeys.length - 1 },
        },
      ];
    
      // 6) (Optional) Style the two header rows
      //    e.g. Gray background, center alignment, thin borders
      const totalHeaderCols = 1 + poKeys.length + cogKeys.length; // total columns in row 0 & 1
      for (let R = 0; R < 2; ++R) {
        for (let C = 0; C < totalHeaderCols; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          ws[cellAddress].s = {
            fill: { fgColor: { rgb: "D3D3D3" } }, // light gray
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top:    { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left:   { style: "thin", color: { rgb: "000000" } },
              right:  { style: "thin", color: { rgb: "000000" } },
            },
          };
        }
      }
    
      // 7) Create a new workbook & download
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Overall Report");
      XLSX.writeFile(wb, "Overall_Report.xlsx");
      return;
    }
    

    // Otherwise => download PDF (Student or Average Report)
    const doc = new jsPDF();

    // Set title
    doc.setFontSize(16);
    doc.text(
      `Report for: ${question_name}`,
      doc.internal.pageSize.getWidth() / 2,
      20,
      {
        align: "center",
      }
    );

    // Student or Average header
    doc.setFontSize(14);
    if (studentReport) {
      doc.text(
        `Student ID: ${student_id}`,
        doc.internal.pageSize.getWidth() / 2,
        30,
        {
          align: "center",
        }
      );
    } else if (averageReport) {
      doc.text("Average Report", doc.internal.pageSize.getWidth() / 2, 30, {
        align: "center",
      });
    }

    let yPosition = 50;

    // PO Grades Table
    if (reportData.po_grades && Object.keys(reportData.po_grades).length > 0) {
      doc.setFontSize(12);
      doc.text("PO Grades", doc.internal.pageSize.getWidth() / 2, yPosition, {
        align: "center",
      });

      yPosition += 5;

      autoTable(doc, {
        startY: yPosition + 5,
        head: [["PO", "Grade (%)"]],
        body: Object.entries(reportData.po_grades).map(([key, value]) => [
          key,
          `${value}%`,
        ]),
        theme: "grid",
        styles: { halign: "center" },
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Cognitive Grades Table
    if (
      reportData.cognitive_grades &&
      Object.keys(reportData.cognitive_grades).length > 0
    ) {
      doc.setFontSize(12);
      doc.text(
        "Cognitive Grades",
        doc.internal.pageSize.getWidth() / 2,
        yPosition,
        {
          align: "center",
        }
      );

      yPosition += 5;

      autoTable(doc, {
        startY: yPosition + 5,
        head: [["Category", "Grade (%)"]],
        body: Object.entries(reportData.cognitive_grades).map(
          ([key, value]) => [key, `${value}%`]
        ),
        theme: "grid",
        styles: { halign: "center" },
      });
    }

    // Finally, save the PDF
    if (studentReport) {
      doc.save(`Report_${student_id}.pdf`);
    } else if (averageReport) {
      doc.save(`Average_Report.pdf`);
    }
  };

  // ------------------------------
  // RENDER
  // ------------------------------
  return (
    <div>
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />
      <div className="container mx-auto px-6 mt-24">
        <div className="flex items-center gap-4 mb-6">
          <input
            type="text"
            value={student_id}
            onChange={(e) => setstudent_id(e.target.value)}
            placeholder="Enter Student ID"
            className="border border-gray-300 px-4 py-2 rounded-md"
          />
          <button
            onClick={fetchStudentReport}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Get Student Report
          </button>
          <button
            onClick={fetchAverageReport}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Get Average Report
          </button>

          {/* 3) NEW: Overall Report Button */}
          <button
            onClick={fetchOverallReport}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Get Overall Report
          </button>

          {/* Show Download button only if we have reportData */}
          {reportData && (
            <button
              onClick={downloadReport}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Download Report
            </button>
          )}
        </div>

        {loading && <p>Loading report...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {/* STUDENT / AVERAGE REPORTS */}
        {reportData && (studentReport || averageReport) && (
          <div className="mt-6 flex flex-col items-center w-full">
            <div className="w-full max-w-2xl">
              {studentReport && (
                <h2 className="text-xl font-bold mb-2 text-center">
                  {`Report of Student ID : ${student_id}`}
                </h2>
              )}
              {averageReport && (
                <h2 className="text-xl font-bold mb-2 text-center">
                  Average Report
                </h2>
              )}

              <h2 className="text-xl font-bold mb-2 text-center">PO Grades</h2>
              <table className="table-fixed w-full border-collapse border border-gray-300 mb-4">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">
                      PO
                    </th>
                    <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">
                      Grade (%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.po_grades).map(([key, value]) => (
                    <tr key={key}>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {key}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="w-full max-w-2xl mt-4">
              <h2 className="text-xl font-bold mb-2 text-center">
                Cognitive Grades
              </h2>
              <table className="table-fixed w-full border-collapse border border-gray-300 mb-4">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">
                      Cognitive Domain
                    </th>
                    <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">
                      Grade (%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.cognitive_grades).map(
                    ([key, value]) => (
                      <tr key={key}>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {key}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {value}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportData && overallReport && reportData.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4 text-center">
              Overall Report
            </h2>
            <div className="overflow-x-auto">
              {/* 1. Get the first student's structure to figure out the keys */}
              {(() => {
                const firstItem = reportData[0];
                const firstStudentId = Object.keys(firstItem)[0];
                const { po_grades: firstPo, cognitive_grades: firstCog } =
                  firstItem[firstStudentId];
                const poKeys = Object.keys(firstPo); // e.g. ["PO2", "PO8", "PO3", ...]
                const cogKeys = Object.keys(firstCog); // e.g. ["Analyzing", "Evaluating", "Knowledge", ...]

                return (
                  <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-300">
                      {/* Top row of the header */}
                      <tr>
                        {/* "Student ID" occupies 2 rows */}
                        <th
                          rowSpan={2}
                          className="border border-gray-300 px-4 py-2 text-center"
                        >
                          Student ID
                        </th>

                        {/* "PO" spans however many PO keys exist */}
                        <th
                          colSpan={poKeys.length}
                          className="border border-gray-300 px-4 py-2 text-center"
                        >
                          PO%
                        </th>

                        {/* "Cognitive Domain" spans however many Cognitive keys exist */}
                        <th
                          colSpan={cogKeys.length}
                          className="border border-gray-300 px-4 py-2 text-center"
                        >
                          Cognitive Domain%
                        </th>
                      </tr>

                      {/* Second row of the header: each PO key, then each cognitive key */}
                      <tr>
                        {poKeys.map((poKey) => (
                          <th
                            key={poKey}
                            className="border border-gray-300 px-4 py-2 text-center"
                          >
                            {poKey}
                          </th>
                        ))}
                        {cogKeys.map((cogKey) => (
                          <th
                            key={cogKey}
                            className="border border-gray-300 px-4 py-2 text-center"
                          >
                            {cogKey}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {reportData.map((item) => {
                        const studentId = Object.keys(item)[0];
                        const { po_grades, cognitive_grades } = item[studentId];

                        return (
                          <tr key={studentId}>
                            {/* Student ID */}
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {studentId}
                            </td>

                            {/* PO columns */}
                            {poKeys.map((poKey) => (
                              <td
                                key={poKey}
                                className="border border-gray-300 px-4 py-2 text-center"
                              >
                                {po_grades[poKey]}
                              </td>
                            ))}

                            {/* Cognitive columns */}
                            {cogKeys.map((cogKey) => (
                              <td
                                key={cogKey}
                                className="border border-gray-300 px-4 py-2 text-center"
                              >
                                {cognitive_grades[cogKey]}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionReport;
