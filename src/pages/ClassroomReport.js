// import React, { useState, useRef } from "react";
// import axios from "axios";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import Navbar from "../components/Navbar";
// import { useLocation } from "react-router-dom";
// import * as XLSX from "xlsx";
// import BarChart from "../components/BarChart";

// axios.defaults.withCredentials = true; // Enables sending cookies with every request


// function ClassroomReport() {
//   const location = useLocation();
//   const { classroom_id, teacher_access, committee_access, classroom_name } =
//     location.state;

//   const [student_id, setstudent_id] = useState("");
//   const [reportData, setReportData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Toggles for different report types
//   const [studentReport, setStudentReport] = useState(false);
//   const [averageReport, setAverageReport] = useState(false);
//   const [overallReport, setOverallReport] = useState(false);

//   // Determine initial access type
//   const initialAccessType =
//     teacher_access && !committee_access
//       ? "teacher"
//       : !teacher_access && committee_access
//       ? "committee"
//       : "teacher";
//   const [accessType, setAccessType] = useState(initialAccessType);

//   const navItems = [];
//   const actionButton = { label: "Logout", path: "/logout" };

//   // Refs for chart components (for PDF capture)
//   const poChartRef = useRef(null);
//   const cogChartRef = useRef(null);

//   // ------------------------------
//   // FETCHING FUNCTIONS
//   // ------------------------------
//   const fetchStudentReport = async () => {
//     if (!student_id) {
//       setError("Please enter a valid Student ID.");
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     const token = localStorage.getItem("accessToken");
//     if (!token) {
//       setError("Access token not found.");
//       setLoading(false);
//       return;
//     }
//     try {
//       const response = await axios.get(
//         `http://localhost:8000/report/classroom/${classroom_id}/${accessType}/${student_id}`,
//         { headers: { accessToken: token } }
//       );
//       if (response.data.success) {
//         // Expecting new structure: { summary, grades: { po_grades, cognitive_grades } }
//         setReportData(response.data.data);
//         setStudentReport(true);
//         setAverageReport(false);
//         setOverallReport(false);
//       } else {
//         setError("Failed to fetch report.");
//         setReportData(null);
//       }
//     } catch (err) {
//       setError("Error while fetching report.");
//       setReportData(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchAverageReport = async () => {
//     setLoading(true);
//     setError(null);
//     const token = localStorage.getItem("accessToken");
//     if (!token) {
//       setError("Access token not found.");
//       setLoading(false);
//       return;
//     }
//     try {
//       const response = await axios.get(
//         `http://localhost:8000/report/classroom/${classroom_id}/${accessType}/average`,
//         { headers: { accessToken: token } }
//       );
//       if (response.data.success) {
//         // Expecting structure: { summary, grades: { po_grades, cognitive_grades } }
//         setReportData(response.data.data);
//         setStudentReport(false);
//         setAverageReport(true);
//         setOverallReport(false);
//       } else {
//         setError("Failed to fetch report.");
//         setReportData(null);
//       }
//     } catch (err) {
//       setError("Error while fetching report.");
//       setReportData(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchOverallReport = async () => {
//     setLoading(true);
//     setError(null);
//     const token = localStorage.getItem("accessToken");
//     if (!token) {
//       setError("Access token not found.");
//       setLoading(false);
//       return;
//     }
//     try {
//       const response = await axios.get(
//         `http://localhost:8000/report/classroom/${classroom_id}/${accessType}/overall`,
//         { headers: { accessToken: token } }
//       );
//       if (response.data.success) {
//         // Overall report remains an array of objects keyed by student ID
//         setReportData(response.data.data);
//         setStudentReport(false);
//         setAverageReport(false);
//         setOverallReport(true);
//       } else {
//         setError("Failed to fetch overall report.");
//         setReportData(null);
//       }
//     } catch (error) {
//       setError(error.response?.data?.message);
//       setReportData(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ------------------------------
//   // DOWNLOAD HANDLER
//   // ------------------------------
//   const downloadReport = () => {
//     if (overallReport && reportData && reportData.length > 0) {
//       // Download overall report as XLSX (unchanged)
//       const firstItem = reportData[0];
//       const firstStudentId = Object.keys(firstItem)[0];
//       const { po_grades: firstPo, cognitive_grades: firstCog } =
//         firstItem[firstStudentId];
//       const poKeys = Object.keys(firstPo);
//       const cogKeys = Object.keys(firstCog);

//       const row0 = ["Student ID"];
//       row0.push("PO%");
//       for (let i = 1; i < poKeys.length; i++) {
//         row0.push("");
//       }
//       row0.push("Cognitive Domain%");
//       for (let i = 1; i < cogKeys.length; i++) {
//         row0.push("");
//       }

//       const row1 = [""].concat(poKeys, cogKeys);
//       const sheetData = [row0, row1];

//       reportData.forEach((item) => {
//         const studentId = Object.keys(item)[0];
//         const { po_grades, cognitive_grades } = item[studentId];
//         const row = [
//           studentId,
//           ...poKeys.map((poKey) => po_grades[poKey]),
//           ...cogKeys.map((cogKey) => cognitive_grades[cogKey]),
//         ];
//         sheetData.push(row);
//       });

//       const ws = XLSX.utils.aoa_to_sheet(sheetData);
//       ws["!merges"] = [
//         { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
//         { s: { r: 0, c: 1 }, e: { r: 0, c: 1 + poKeys.length - 1 } },
//         {
//           s: { r: 0, c: 1 + poKeys.length },
//           e: { r: 0, c: 1 + poKeys.length + cogKeys.length - 1 },
//         },
//       ];

//       const totalHeaderCols = 1 + poKeys.length + cogKeys.length;
//       for (let R = 0; R < 2; ++R) {
//         for (let C = 0; C < totalHeaderCols; ++C) {
//           const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
//           if (!ws[cellAddress]) continue;
//           ws[cellAddress].s = {
//             fill: { fgColor: { rgb: "D3D3D3" } },
//             alignment: { horizontal: "center", vertical: "center" },
//             border: {
//               top: { style: "thin", color: { rgb: "000000" } },
//               bottom: { style: "thin", color: { rgb: "000000" } },
//               left: { style: "thin", color: { rgb: "000000" } },
//               right: { style: "thin", color: { rgb: "000000" } },
//             },
//           };
//         }
//       }

//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(wb, ws, "Overall Report");
//       XLSX.writeFile(wb, "Overall_Report.xlsx");
//       return;
//     }

//     // For Student and Average Reports, include summary and chart images in the PDF.
//     const doc = new jsPDF();
//     const margin = 15;
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();

//     // Title section
//     doc.setFontSize(16);
//     doc.text(`Report for: ${classroom_name}`, pageWidth / 2, 20, {
//       align: "center",
//     });
//     if (studentReport) {
//       doc.text(`Student ID: ${student_id}`, pageWidth / 2, 30, {
//         align: "center",
//       });
//     } else if (averageReport) {
//       doc.text("Average Report", pageWidth / 2, 30, { align: "center" });
//     }

//     let yPosition = 40;
//     // Add summary if available (left-aligned and wrapped)
//     if (reportData.summary) {
//       doc.setFontSize(12);
//       const summaryText = `Summary: ${reportData.summary}`;
//       const splitSummary = doc.splitTextToSize(
//         summaryText,
//         pageWidth - margin * 2
//       );
//       doc.text(splitSummary, margin, yPosition, { align: "left" });
//       yPosition += splitSummary.length * 10 + 5;
//     }

//     // PO Grades Table using new structure (reportData.grades)
//     if (
//       reportData.grades?.po_grades &&
//       Object.keys(reportData.grades.po_grades).length > 0
//     ) {
//       doc.setFontSize(12);
//       doc.text("PO Grades", pageWidth / 2, yPosition, { align: "center" });
//       yPosition += 5;
//       autoTable(doc, {
//         startY: yPosition + 5,
//         head: [["PO", "Grade (%)"]],
//         body: Object.entries(reportData.grades.po_grades).map(
//           ([key, value]) => [key, `${value}%`]
//         ),
//         theme: "grid",
//         styles: { halign: "center" },
//       });
//       yPosition = doc.lastAutoTable.finalY + 10;
//     }

//     // Cognitive Grades Table using new structure
//     if (
//       reportData.grades?.cognitive_grades &&
//       Object.keys(reportData.grades.cognitive_grades).length > 0
//     ) {
//       doc.setFontSize(12);
//       doc.text("Cognitive Grades", pageWidth / 2, yPosition, {
//         align: "center",
//       });
//       yPosition += 5;
//       autoTable(doc, {
//         startY: yPosition + 5,
//         head: [["Category", "Grade (%)"]],
//         body: Object.entries(reportData.grades.cognitive_grades).map(
//           ([key, value]) => [key, `${value}%`]
//         ),
//         theme: "grid",
//         styles: { halign: "center" },
//       });
//       yPosition = doc.lastAutoTable.finalY + 10;
//     }

//     // Add chart images (ensuring nothing is cropped)
//     try {
//       if (poChartRef.current) {
//         const poChartImage = poChartRef.current.toBase64Image();
//         if (yPosition + 80 > pageHeight) {
//           doc.addPage();
//           yPosition = margin;
//         }
//         doc.addImage(
//           poChartImage,
//           "PNG",
//           margin,
//           yPosition,
//           pageWidth - margin * 2,
//           80
//         );
//         yPosition += 90;
//       }
//       if (cogChartRef.current) {
//         const cogChartImage = cogChartRef.current.toBase64Image();
//         if (yPosition + 80 > pageHeight) {
//           doc.addPage();
//           yPosition = margin;
//         }
//         doc.addImage(
//           cogChartImage,
//           "PNG",
//           margin,
//           yPosition,
//           pageWidth - margin * 2,
//           80
//         );
//       }
//     } catch (err) {
//       console.error("Error adding chart images: ", err);
//     }

//     if (studentReport) {
//       doc.save(`Report_${student_id}.pdf`);
//     } else if (averageReport) {
//       doc.save("Average_Report.pdf");
//     }
//   };

//   // ------------------------------
//   // RENDERING
//   // ------------------------------
//   return (
//     <div>
//       <Navbar
//         navItems={navItems}
//         actionButton={actionButton}
//         buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
//       />
//       <div className="container mx-auto px-6 mt-24">
//         <div className="flex items-center gap-4 mb-6">
//           {/* Show radio buttons only if both access types are available */}
//           {teacher_access && committee_access && (
//             <div className="flex items-center gap-4">
//               <label>
//                 <input
//                   type="radio"
//                   value="teacher"
//                   checked={accessType === "teacher"}
//                   onChange={() => setAccessType("teacher")}
//                   className="mr-1"
//                 />
//                 Teacher
//               </label>
//               <label>
//                 <input
//                   type="radio"
//                   value="committee"
//                   checked={accessType === "committee"}
//                   onChange={() => setAccessType("committee")}
//                   className="mr-1"
//                 />
//                 Committee
//               </label>
//             </div>
//           )}
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
//           <button
//             onClick={fetchOverallReport}
//             className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
//           >
//             Get Overall Report
//           </button>
//           {reportData && (
//             <button
//               onClick={downloadReport}
//               className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
//             >
//               Download Report
//             </button>
//           )}
//         </div>

//         {loading && <p>Loading report...</p>}
//         {error && <p className="text-red-500">{error}</p>}

//         {/* Student / Average Report with summary and charts */}
//         {reportData && (studentReport || averageReport) && (
//           <div className="mt-6 flex flex-col items-center w-full">
//             {studentReport && (
//               <h2 className="text-xl font-bold mb-2 text-center">
//                 {`Report of Student ID : ${student_id}`}
//               </h2>
//             )}
//             {averageReport && (
//               <h2 className="text-xl font-bold mb-2 text-center">
//                 Average Report
//               </h2>
//             )}
//             {reportData.summary && (
//               <div className="mb-4">
//                 <h2 className="text-xl font-bold text-center">Summary</h2>
//                 <p className="text-center">{reportData.summary}</p>
//               </div>
//             )}
//             <div className="flex flex-row w-full justify-between">
//               <div className="w-1/2">
//                 <h2 className="text-xl font-bold mb-2 text-center">
//                   PO Grades
//                 </h2>
//                 <table className="table-fixed w-full border-collapse border border-gray-300 mb-4">
//                   <thead>
//                     <tr>
//                       <th className="border border-gray-300 px-4 py-2 text-center">
//                         PO
//                       </th>
//                       <th className="border border-gray-300 px-4 py-2 text-center">
//                         Grade (%)
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {Object.entries(reportData.grades?.po_grades || {}).map(
//                       ([key, value]) => (
//                         <tr key={key}>
//                           <td className="border border-gray-300 px-4 py-2 text-center">
//                             {key}
//                           </td>
//                           <td className="border border-gray-300 px-4 py-2 text-center">
//                             {value}
//                           </td>
//                         </tr>
//                       )
//                     )}
//                   </tbody>
//                 </table>

//                 <h2 className="text-xl font-bold mb-2 text-center">
//                   Cognitive Grades
//                 </h2>
//                 <table className="table-fixed w-full border-collapse border border-gray-300 mb-4">
//                   <thead>
//                     <tr>
//                       <th className="border border-gray-300 px-4 py-2 text-center">
//                         Cognitive Domain
//                       </th>
//                       <th className="border border-gray-300 px-4 py-2 text-center">
//                         Grade (%)
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {Object.entries(
//                       reportData.grades?.cognitive_grades || {}
//                     ).map(([key, value]) => (
//                       <tr key={key}>
//                         <td className="border border-gray-300 px-4 py-2 text-center">
//                           {key}
//                         </td>
//                         <td className="border border-gray-300 px-4 py-2 text-center">
//                           {value}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Bar charts on the right */}
//               <div className="w-1/2 flex flex-col gap-6">
//                 <BarChart
//                   ref={poChartRef}
//                   title="PO Grades"
//                   labels={Object.keys(reportData.grades?.po_grades || {})}
//                   data={reportData.grades?.po_grades || {}}
//                 />
//                 <BarChart
//                   ref={cogChartRef}
//                   title="Cognitive Grades"
//                   labels={Object.keys(
//                     reportData.grades?.cognitive_grades || {}
//                   )}
//                   data={reportData.grades?.cognitive_grades || {}}
//                 />
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Overall Report Table */}
//         {reportData && overallReport && reportData.length > 0 && (
//           <div className="mt-6">
//             <h2 className="text-xl font-bold mb-4 text-center">
//               Overall Report
//             </h2>
//             <div className="overflow-x-auto">
//               {(() => {
//                 const firstItem = reportData[0];
//                 const firstStudentId = Object.keys(firstItem)[0];
//                 const { po_grades: firstPo, cognitive_grades: firstCog } =
//                   firstItem[firstStudentId];
//                 const poKeys = Object.keys(firstPo);
//                 const cogKeys = Object.keys(firstCog);
//                 return (
//                   <table className="table-auto w-full border-collapse border border-gray-300">
//                     <thead className="bg-gray-300">
//                       <tr>
//                         <th
//                           rowSpan={2}
//                           className="border border-gray-300 px-4 py-2 text-center"
//                         >
//                           Student ID
//                         </th>
//                         <th
//                           colSpan={poKeys.length}
//                           className="border border-gray-300 px-4 py-2 text-center"
//                         >
//                           PO%
//                         </th>
//                         <th
//                           colSpan={cogKeys.length}
//                           className="border border-gray-300 px-4 py-2 text-center"
//                         >
//                           Cognitive Domain%
//                         </th>
//                       </tr>
//                       <tr>
//                         {poKeys.map((poKey) => (
//                           <th
//                             key={poKey}
//                             className="border border-gray-300 px-4 py-2 text-center"
//                           >
//                             {poKey}
//                           </th>
//                         ))}
//                         {cogKeys.map((cogKey) => (
//                           <th
//                             key={cogKey}
//                             className="border border-gray-300 px-4 py-2 text-center"
//                           >
//                             {cogKey}
//                           </th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {reportData.map((item) => {
//                         const studentId = Object.keys(item)[0];
//                         const { po_grades, cognitive_grades } = item[studentId];
//                         return (
//                           <tr key={studentId}>
//                             <td className="border border-gray-300 px-4 py-2 text-center">
//                               {studentId}
//                             </td>
//                             {poKeys.map((poKey) => (
//                               <td
//                                 key={poKey}
//                                 className="border border-gray-300 px-4 py-2 text-center"
//                               >
//                                 {po_grades[poKey]}
//                               </td>
//                             ))}
//                             {cogKeys.map((cogKey) => (
//                               <td
//                                 key={cogKey}
//                                 className="border border-gray-300 px-4 py-2 text-center"
//                               >
//                                 {cognitive_grades[cogKey]}
//                               </td>
//                             ))}
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 );
//               })()}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ClassroomReport;


import React, { useState, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../components/Navbar";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import BarChart from "../components/BarChart";

axios.defaults.withCredentials = true; // Enables sending cookies with every request

function ClassroomReport() {
  const location = useLocation();
  const { classroom_id, teacher_access, committee_access, classroom_name } =
    location.state;

  // State variables
  const [studentId, setStudentId] = useState("");
  const [reportType, setReportType] = useState("student"); // "student", "average", or "overall"
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine initial role
  const initialRole =
    teacher_access && !committee_access
      ? "teacher"
      : !teacher_access && committee_access
      ? "committee"
      : "teacher";
  const [role, setRole] = useState(initialRole);

  // Refs for chart components (used for PDF capture)
  const poChartRef = useRef(null);
  const cogChartRef = useRef(null);

  // ------------------------------
  // Navbar setup
  // ------------------------------
  const navItems = [];
  const actionButton = { label: "Logout", path: "/logout" };

  // ------------------------------
  // Fetching functions
  // ------------------------------
  const fetchStudentReport = async () => {
    if (!studentId) {
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
        `http://localhost:8000/report/classroom/${classroom_id}/${role}/${studentId}`,
        { headers: { accessToken: token } }
      );
      if (response.data.success) {
        setReportData(response.data.data);
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
        `http://localhost:8000/report/classroom/${classroom_id}/${role}/average`,
        { headers: { accessToken: token } }
      );
      if (response.data.success) {
        setReportData(response.data.data);
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
        `http://localhost:8000/report/classroom/${classroom_id}/${role}/overall`,
        { headers: { accessToken: token } }
      );
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError("Failed to fetch overall report.");
        setReportData(null);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error while fetching report.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // Unified Generate Report handler
  // ------------------------------
  const handleGenerateReport = () => {
    setReportData(null);
    setError(null);

    if (reportType === "student") {
      fetchStudentReport();
    } else if (reportType === "average") {
      fetchAverageReport();
    } else if (reportType === "overall") {
      fetchOverallReport();
    }
  };

  // ------------------------------
  // Download handler
  // ------------------------------
  const downloadReport = () => {
    // If "Overall" report, download as XLSX
    if (reportType === "overall" && Array.isArray(reportData) && reportData.length > 0) {
      const firstItem = reportData[0];
      const firstStudentId = Object.keys(firstItem)[0];
      const { po_grades: firstPo, cognitive_grades: firstCog } = firstItem[firstStudentId];
      const poKeys = Object.keys(firstPo);
      const cogKeys = Object.keys(firstCog);

      const row0 = ["Student ID"];
      row0.push("PO%");
      for (let i = 1; i < poKeys.length; i++) {
        row0.push("");
      }
      row0.push("Cognitive Domain%");
      for (let i = 1; i < cogKeys.length; i++) {
        row0.push("");
      }

      const row1 = [""].concat(poKeys, cogKeys);
      const sheetData = [row0, row1];

      reportData.forEach((item) => {
        const studentId = Object.keys(item)[0];
        const { po_grades, cognitive_grades } = item[studentId];
        const row = [
          studentId,
          ...poKeys.map((poKey) => po_grades[poKey]),
          ...cogKeys.map((cogKey) => cognitive_grades[cogKey]),
        ];
        sheetData.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      // Merge the header cells
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
        { s: { r: 0, c: 1 }, e: { r: 0, c: 1 + poKeys.length - 1 } },
        {
          s: { r: 0, c: 1 + poKeys.length },
          e: { r: 0, c: 1 + poKeys.length + cogKeys.length - 1 },
        },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Overall Report");
      XLSX.writeFile(wb, "Overall_Report.xlsx");
      return;
    }

    // For "Student" or "Average" reports, download as PDF (with tables & charts)
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(16);
    doc.text(`Report for: ${classroom_name}`, pageWidth / 2, 20, {
      align: "center",
    });

    if (reportType === "student") {
      doc.text(`Student ID: ${studentId}`, pageWidth / 2, 30, { align: "center" });
    } else if (reportType === "average") {
      doc.text("Average Report", pageWidth / 2, 30, { align: "center" });
    }

    let yPosition = 40;
    // Add summary if available
    if (reportData?.summary) {
      doc.setFontSize(12);
      const summaryText = `Summary: ${reportData.summary}`;
      const splitSummary = doc.splitTextToSize(summaryText, pageWidth - margin * 2);
      doc.text(splitSummary, margin, yPosition, { align: "left" });
      yPosition += splitSummary.length * 10 + 5;
    }

    // PO Grades table
    if (reportData?.grades?.po_grades && Object.keys(reportData.grades.po_grades).length > 0) {
      doc.setFontSize(12);
      doc.text("PO Grades", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 5;
      autoTable(doc, {
        startY: yPosition + 5,
        head: [["PO", "Grade (%)"]],
        body: Object.entries(reportData.grades.po_grades).map(([key, value]) => [
          key,
          `${value}%`,
        ]),
        theme: "grid",
        styles: { halign: "center" },
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Cognitive Grades table
    if (
      reportData?.grades?.cognitive_grades &&
      Object.keys(reportData.grades.cognitive_grades).length > 0
    ) {
      doc.setFontSize(12);
      doc.text("Cognitive Grades", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 5;
      autoTable(doc, {
        startY: yPosition + 5,
        head: [["Category", "Grade (%)"]],
        body: Object.entries(reportData.grades.cognitive_grades).map(([key, value]) => [
          key,
          `${value}%`,
        ]),
        theme: "grid",
        styles: { halign: "center" },
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Charts
    try {
      if (poChartRef.current) {
        const poChartImage = poChartRef.current.toBase64Image();
        if (yPosition + 80 > pageHeight) {
          doc.addPage();
          yPosition = margin;
        }
        doc.addImage(
          poChartImage,
          "PNG",
          margin,
          yPosition,
          pageWidth - margin * 2,
          80
        );
        yPosition += 90;
      }
      if (cogChartRef.current) {
        const cogChartImage = cogChartRef.current.toBase64Image();
        if (yPosition + 80 > pageHeight) {
          doc.addPage();
          yPosition = margin;
        }
        doc.addImage(
          cogChartImage,
          "PNG",
          margin,
          yPosition,
          pageWidth - margin * 2,
          80
        );
      }
    } catch (err) {
      console.error("Error adding chart images: ", err);
    }

    if (reportType === "student") {
      doc.save(`Report_${studentId}.pdf`);
    } else if (reportType === "average") {
      doc.save("Average_Report.pdf");
    }
  };

  // ------------------------------
  // Render
  // ------------------------------
  const isStudentOrAverage =
    reportType === "student" || reportType === "average";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />

      {/* Main container */}
      <div className="max-w-7xl mx-auto px-4 mt-16 mb-10">
        {/* Top Card / Heading */}
        <div className="bg-white rounded-md shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Student Report Summary</h1>
          <p className="text-gray-600 mb-6">
            Please select all the fields to generate Student Report Summary
          </p>

          {/* Form row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Student ID */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="border border-gray-300 w-full px-3 py-2 rounded-md focus:outline-none"
                placeholder="Enter Student ID"
                disabled={reportType !== "student"}
              />
            </div>

            {/* Role */}
            {(teacher_access || committee_access) && (
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="border border-gray-300 w-full px-3 py-2 rounded-md focus:outline-none"
                >
                  {/* If user can be both teacher and committee, show both */}
                  {teacher_access && (
                    <option value="teacher">Teacher</option>
                  )}
                  {committee_access && (
                    <option value="committee">Committee</option>
                  )}
                </select>
              </div>
            )}

            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="border border-gray-300 w-full px-3 py-2 rounded-md focus:outline-none"
              >
                <option value="student">Student</option>
                <option value="average">Average</option>
                <option value="overall">Overall</option>
              </select>
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md w-full md:w-auto"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Error Messages */}
        {loading && (
          <p className="text-blue-500 font-semibold mt-4">Loading report...</p>
        )}
        {error && <p className="text-red-500 font-semibold mt-4">{error}</p>}

        {/* Show the result card if reportData is present */}
        {reportData && (
          <div className="bg-white rounded-md shadow p-6 mt-8">
            {/* Top row: Summary Title + Download Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {reportType === "student"
                  ? `Report of Student ID: ${studentId}`
                  : reportType === "average"
                  ? "Average Report"
                  : "Overall Report"}
              </h2>
              <button
                onClick={downloadReport}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md"
              >
                Download Report
              </button>
            </div>

            {/* If Student or Average Report */}
            {isStudentOrAverage && reportData.grades && (
              <>
                {/* Summary */}
                {reportData.summary && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold mb-2">Summary</h3>
                    <p className="text-gray-700">{reportData.summary}</p>
                  </div>
                )}

                {/* Tables and Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: PO Grades & Cognitive Domain Tables */}
                  <div>
                    {/* PO Grades Table */}
                    <h3 className="text-lg font-bold mb-2">PO Grades</h3>
                    <table className="w-full border border-gray-200 mb-6">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 border border-gray-200 text-center">
                            PO
                          </th>
                          <th className="px-4 py-2 border border-gray-200 text-center">
                            Grade (%)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(reportData.grades.po_grades).map(
                          ([poKey, poValue]) => (
                            <tr key={poKey}>
                              <td className="px-4 py-2 border border-gray-200 text-center">
                                {poKey}
                              </td>
                              <td className="px-4 py-2 border border-gray-200 text-center">
                                {poValue}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>

                    {/* Cognitive Domain Table */}
                    <h3 className="text-lg font-bold mb-2">Cognitive Domain</h3>
                    <table className="w-full border border-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 border border-gray-200 text-center">
                            Category
                          </th>
                          <th className="px-4 py-2 border border-gray-200 text-center">
                            Grade (%)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(reportData.grades.cognitive_grades).map(
                          ([cogKey, cogValue]) => (
                            <tr key={cogKey}>
                              <td className="px-4 py-2 border border-gray-200 text-center">
                                {cogKey}
                              </td>
                              <td className="px-4 py-2 border border-gray-200 text-center">
                                {cogValue}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Right Column: Bar Charts */}
                  <div className="flex flex-col gap-8">
                    {/* PO Grades Chart */}
                    <div className="bg-white border border-gray-200 rounded-md p-4">
                      <BarChart
                        ref={poChartRef}
                        title="PO Grades"
                        labels={Object.keys(reportData.grades.po_grades || {})}
                        data={reportData.grades.po_grades || {}}
                      />
                    </div>

                    {/* Cognitive Domain Chart */}
                    <div className="bg-white border border-gray-200 rounded-md p-4">
                      <BarChart
                        ref={cogChartRef}
                        title="Cognitive Grades"
                        labels={Object.keys(
                          reportData.grades.cognitive_grades || {}
                        )}
                        data={reportData.grades.cognitive_grades || {}}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Overall Report Table */}
            {reportType === "overall" && Array.isArray(reportData) && reportData.length > 0 && (
              <div className="overflow-x-auto">
                {/* Construct table headers from first row */}
                {(() => {
                  const firstItem = reportData[0];
                  const firstStudentId = Object.keys(firstItem)[0];
                  const { po_grades: firstPo, cognitive_grades: firstCog } =
                    firstItem[firstStudentId];
                  const poKeys = Object.keys(firstPo);
                  const cogKeys = Object.keys(firstCog);

                  return (
                    <table className="w-full border border-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th
                            rowSpan={2}
                            className="border border-gray-300 px-4 py-2 text-center"
                          >
                            Student ID
                          </th>
                          <th
                            colSpan={poKeys.length}
                            className="border border-gray-300 px-4 py-2 text-center"
                          >
                            PO%
                          </th>
                          <th
                            colSpan={cogKeys.length}
                            className="border border-gray-300 px-4 py-2 text-center"
                          >
                            Cognitive Domain%
                          </th>
                        </tr>
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
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                {studentId}
                              </td>
                              {poKeys.map((poKey) => (
                                <td
                                  key={poKey}
                                  className="border border-gray-300 px-4 py-2 text-center"
                                >
                                  {po_grades[poKey]}
                                </td>
                              ))}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassroomReport;
