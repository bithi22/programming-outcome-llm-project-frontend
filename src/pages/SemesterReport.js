// import React, { useState, useRef } from "react";
// import axios from "axios";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import Navbar from "../components/Navbar";
// import BarChart from "../components/BarChart";

// axios.defaults.withCredentials = true; // Enables sending cookies with every request


// function SemesterReport() {
//   const [student_id, setstudent_id] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [reportData, setReportData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Toggles for different report types
//   const [studentReport, setStudentReport] = useState(false);

//   const navItems = [];
//   const actionButton = { label: "Logout", path: "/logout" };

//   // Refs for the bar chart components (for PDF capture)
//   const poChartRef = useRef(null);
//   const cogChartRef = useRef(null);

//   // ------------------------------
//   // FETCHING FUNCTIONS
//   // ------------------------------
//   const fetchStudentReport = async () => {
//     // Validate fields
//     if (!student_id || !startDate || !endDate) {
//       setError("Please fill in all fields (Student ID, Semester Start Date, Semester End Date).");
//       return;
//     }
    
//     if (new Date(startDate) >= new Date(endDate)) {
//       setError("Semester Start Date must be earlier than Semester End Date.");
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
//       const response = await axios.post(
//         `http://localhost:8000/report/overall/${student_id}`,
//         {
//           start_date: startDate, // format: YYYY-MM-DD
//           end_date: endDate,     // format: YYYY-MM-DD
//         },
//         {
//           headers: { accessToken: token },
//         }
//       );

//       if (response.data.success) {
//         // Note: Now data has { summary, grades }
//         setReportData(response.data.data);
//         setStudentReport(true);
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

//   // ------------------------------
//   // DOWNLOAD HANDLER
//   // ------------------------------
//   const downloadReport = () => {
//     // For Student report include summary and charts in the PDF.
//     const doc = new jsPDF();
//     const margin = 15;
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();

//     // Set title
//     doc.setFontSize(16);
//     doc.text(`Report for: ${""}`, pageWidth / 2, 20, { align: "center" });

//     if (studentReport) {
//       doc.text(`Student ID: ${student_id}`, pageWidth / 2, 30, { align: "center" });
//       doc.text(`Semester: ${startDate} to ${endDate}`, pageWidth / 2, 40, { align: "center" });
//     }

//     // Add summary if available, left-aligned with text wrapping
//     let yPosition = 50;
//     if (reportData.summary) {
//       doc.setFontSize(12);
//       const summaryText = `Summary: ${reportData.summary}`;
//       const splitSummary = doc.splitTextToSize(summaryText, pageWidth - margin * 2);
//       doc.text(splitSummary, margin, yPosition, { align: "left" });
//       yPosition += splitSummary.length * 10 + 5;
//     }

//     // PO Grades Table using the new grades field
//     if (reportData.grades?.po_grades && Object.keys(reportData.grades.po_grades).length > 0) {
//       doc.setFontSize(12);
//       doc.text("PO Grades", pageWidth / 2, yPosition, { align: "center" });
//       yPosition += 5;

//       autoTable(doc, {
//         startY: yPosition + 5,
//         head: [["PO", "Grade (%)"]],
//         body: Object.entries(reportData.grades.po_grades).map(([key, value]) => [key, `${value}%`]),
//         theme: "grid",
//         styles: { halign: "center" },
//       });

//       yPosition = doc.lastAutoTable.finalY + 10;
//     }

//     // Cognitive Grades Table using the new grades field
//     if (reportData.grades?.cognitive_grades && Object.keys(reportData.grades.cognitive_grades).length > 0) {
//       doc.setFontSize(12);
//       doc.text("Cognitive Grades", pageWidth / 2, yPosition, { align: "center" });
//       yPosition += 5;

//       autoTable(doc, {
//         startY: yPosition + 5,
//         head: [["Category", "Grade (%)"]],
//         body: Object.entries(reportData.grades.cognitive_grades).map(([key, value]) => [key, `${value}%`]),
//         theme: "grid",
//         styles: { halign: "center" },
//       });
//       yPosition = doc.lastAutoTable.finalY + 10;
//     }

//     // Add the chart images ensuring nothing is cropped:
//     try {
//       if (poChartRef.current) {
//         const poChartImage = poChartRef.current.toBase64Image();
//         if (yPosition + 80 > pageHeight) {
//           doc.addPage();
//           yPosition = margin;
//         }
//         doc.addImage(poChartImage, "PNG", margin, yPosition, pageWidth - 2 * margin, 80);
//         yPosition += 90;
//       }
//       if (cogChartRef.current) {
//         const cogChartImage = cogChartRef.current.toBase64Image();
//         if (yPosition + 80 > pageHeight) {
//           doc.addPage();
//           yPosition = margin;
//         }
//         doc.addImage(cogChartImage, "PNG", margin, yPosition, pageWidth - 2 * margin, 80);
//       }
//     } catch (err) {
//       console.error("Error adding chart images: ", err);
//     }

//     // Save the PDF
//     if (studentReport) {
//       doc.save(`Report_${student_id}.pdf`);
//     }
//   };

//   // ------------------------------
//   // RENDER
//   // ------------------------------
//   return (
//     <div>
//       <Navbar
//         navItems={navItems}
//         actionButton={actionButton}
//         buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
//       />
//       <div className="container mx-auto px-6 mt-24">
//         <div className="flex flex-col gap-4 mb-6">
//           <div className="flex items-center gap-4">
//             <div className="flex flex-col">
//               <label htmlFor="student_id" className="mb-1 font-medium">Student ID</label>
//               <input
//                 id="student_id"
//                 type="text"
//                 value={student_id}
//                 onChange={(e) => setstudent_id(e.target.value)}
//                 placeholder="Enter Student ID"
//                 className="border border-gray-300 px-4 py-2 rounded-md"
//               />
//             </div>
//             <div className="flex flex-col">
//               <label htmlFor="startDate" className="mb-1 font-medium">Semester Start Date</label>
//               <input
//                 id="startDate"
//                 type="date"
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//                 className="border border-gray-300 px-4 py-2 rounded-md"
//               />
//             </div>
//             <div className="flex flex-col">
//               <label htmlFor="endDate" className="mb-1 font-medium">Semester End Date</label>
//               <input
//                 id="endDate"
//                 type="date"
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//                 className="border border-gray-300 px-4 py-2 rounded-md"
//               />
//             </div>
//           </div>
//           <div className="flex items-center gap-4">
//             <button
//               onClick={fetchStudentReport}
//               className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
//             >
//               Get Student Report
//             </button>
//             {reportData && (
//               <button
//                 onClick={downloadReport}
//                 className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
//               >
//                 Download Report
//               </button>
//             )}
//           </div>
//         </div>

//         {loading && <p>Loading report...</p>}
//         {error && <p className="text-red-500">{error}</p>}

//         {/* STUDENT Report */}
//         {reportData && studentReport && (
//           <div className="mt-6 flex flex-col items-center w-full">
//             {/* Display Summary */}
//             {reportData.summary && (
//               <div className="mb-4">
//                 <h2 className="text-xl font-bold text-center">Summary</h2>
//                 <p className="text-center">{reportData.summary}</p>
//               </div>
//             )}
//             <div className="flex flex-row w-full justify-between">
//               <div className="w-1/2">
//                 {studentReport && (
//                   <h2 className="text-xl font-bold mb-2 text-center">
//                     {`Report of Student ID : ${student_id}`}
//                   </h2>
//                 )}
//                 <h2 className="text-xl font-bold mb-2 text-center">PO Grades</h2>
//                 <table className="table-fixed w-full border-collapse border border-gray-300 mb-4">
//                   <thead>
//                     <tr>
//                       <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">PO</th>
//                       <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">Grade (%)</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {Object.entries(reportData.grades.po_grades).map(([key, value]) => (
//                       <tr key={key}>
//                         <td className="border border-gray-300 px-4 py-2 text-center">{key}</td>
//                         <td className="border border-gray-300 px-4 py-2 text-center">{value}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>

//                 <h2 className="text-xl font-bold mb-2 text-center">Cognitive Grades</h2>
//                 <table className="table-fixed w-full border-collapse border border-gray-300 mb-4">
//                   <thead>
//                     <tr>
//                       <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">Cognitive Domain</th>
//                       <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">Grade (%)</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {Object.entries(reportData.grades.cognitive_grades).map(([key, value]) => (
//                       <tr key={key}>
//                         <td className="border border-gray-300 px-4 py-2 text-center">{key}</td>
//                         <td className="border border-gray-300 px-4 py-2 text-center">{value}</td>
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
//                   labels={Object.keys(reportData.grades.po_grades)}
//                   data={reportData.grades.po_grades}
//                 />
//                 <BarChart
//                   ref={cogChartRef}
//                   title="Cognitive Grades"
//                   labels={Object.keys(reportData.grades.cognitive_grades)}
//                   data={reportData.grades.cognitive_grades}
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default SemesterReport;


import React, { useState, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../components/Navbar";
import BarChart from "../components/BarChart";

axios.defaults.withCredentials = true; // Enables sending cookies with every request

function SemesterReport() {
  // Form fields
  const [studentId, setStudentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Report data & states
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // We only have one type of report, so we'll use `studentReport` as a toggle
  const [studentReport, setStudentReport] = useState(false);

  // Navbar items
  const navItems = [];
  const actionButton = { label: "Logout", path: "/logout" };

  // Refs for the bar charts
  const poChartRef = useRef(null);
  const cogChartRef = useRef(null);

  // ------------------------------
  // Fetching function (single type)
  // ------------------------------
  const handleGenerateReport = async () => {
    // Validate fields
    if (!studentId || !startDate || !endDate) {
      setError("Please fill in all fields (Student ID, Semester Start Date, Semester End Date).");
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError("Semester Start Date must be earlier than Semester End Date.");
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
      // POST request with start_date, end_date in the body
      const response = await axios.post(
        `http://localhost:8000/report/overall/${studentId}`,
        {
          start_date: startDate, // format: YYYY-MM-DD
          end_date: endDate,     // format: YYYY-MM-DD
        },
        {
          headers: { accessToken: token },
        }
      );

      if (response.data.success) {
        // { summary, grades }
        setReportData(response.data.data);
        setStudentReport(true);
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

  // ------------------------------
  // Download handler
  // ------------------------------
  const downloadReport = () => {
    if (!reportData) return;

    // We only have a single Student Report scenario
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(16);
    doc.text("Semester Report Summary", pageWidth / 2, 20, { align: "center" });
    doc.text(`Student ID: ${studentId}`, pageWidth / 2, 30, { align: "center" });
    doc.text(`Semester: ${startDate} to ${endDate}`, pageWidth / 2, 40, { align: "center" });

    let yPosition = 50;

    // Summary
    if (reportData.summary) {
      doc.setFontSize(12);
      const summaryText = `Summary: ${reportData.summary}`;
      const splitSummary = doc.splitTextToSize(summaryText, pageWidth - margin * 2);
      doc.text(splitSummary, margin, yPosition, { align: "left" });
      yPosition += splitSummary.length * 10 + 5;
    }

    // PO Grades table
    if (reportData.grades?.po_grades && Object.keys(reportData.grades.po_grades).length > 0) {
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
      reportData.grades?.cognitive_grades &&
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
        doc.addImage(poChartImage, "PNG", margin, yPosition, pageWidth - 2 * margin, 80);
        yPosition += 90;
      }
      if (cogChartRef.current) {
        const cogChartImage = cogChartRef.current.toBase64Image();
        if (yPosition + 80 > pageHeight) {
          doc.addPage();
          yPosition = margin;
        }
        doc.addImage(cogChartImage, "PNG", margin, yPosition, pageWidth - 2 * margin, 80);
      }
    } catch (err) {
      console.error("Error adding chart images: ", err);
    }

    doc.save(`Semester_Report_${studentId}.pdf`);
  };

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />

      <div className="max-w-7xl mx-auto px-4 mt-16 mb-10">
        {/* Top Card: Input Form */}
        <div className="bg-white rounded-md shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Semester Report Summary</h1>
          <p className="text-gray-600 mb-6">
            Please fill in all fields to generate the semester report summary
          </p>

          {/* Form row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Student ID */}
            <div>
              <label className="block text-sm font-medium mb-1">Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="border border-gray-300 w-full px-3 py-2 rounded-md focus:outline-none"
                placeholder="Enter Student ID"
              />
            </div>

            {/* Semester Start Date */}
            <div>
              <label className="block text-sm font-medium mb-1">Semester Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 w-full px-3 py-2 rounded-md focus:outline-none"
              />
            </div>

            {/* Semester End Date */}
            <div>
              <label className="block text-sm font-medium mb-1">Semester End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 w-full px-3 py-2 rounded-md focus:outline-none"
              />
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
        {loading && <p className="text-blue-500 font-semibold mt-4">Loading report...</p>}
        {error && <p className="text-red-500 font-semibold mt-4">{error}</p>}

        {/* Second Card: Display the Report */}
        {reportData && studentReport && (
          <div className="bg-white rounded-md shadow p-6 mt-8">
            {/* Header row: Title + Download button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {`Report of Student ID: ${studentId}`}
              </h2>
              <button
                onClick={downloadReport}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md"
              >
                Download Report
              </button>
            </div>

            {/* Summary */}
            {reportData.summary && (
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-2">Summary</h3>
                <p className="text-gray-700">{reportData.summary}</p>
              </div>
            )}

            {/* PO & Cognitive Grades with charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left column: Tables */}
              <div>
                {/* PO Grades Table */}
                <h3 className="text-lg font-bold mb-2">PO Grades</h3>
                <table className="w-full border border-gray-200 mb-6">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border border-gray-200 text-center">PO</th>
                      <th className="px-4 py-2 border border-gray-200 text-center">Grade (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reportData.grades.po_grades).map(([key, value]) => (
                      <tr key={key}>
                        <td className="px-4 py-2 border border-gray-200 text-center">{key}</td>
                        <td className="px-4 py-2 border border-gray-200 text-center">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Cognitive Grades Table */}
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
                    {Object.entries(reportData.grades.cognitive_grades).map(([key, value]) => (
                      <tr key={key}>
                        <td className="px-4 py-2 border border-gray-200 text-center">{key}</td>
                        <td className="px-4 py-2 border border-gray-200 text-center">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right column: Charts */}
              <div className="flex flex-col gap-8">
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <BarChart
                    ref={poChartRef}
                    title="PO Grades"
                    labels={Object.keys(reportData.grades.po_grades)}
                    data={reportData.grades.po_grades}
                  />
                </div>
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <BarChart
                    ref={cogChartRef}
                    title="Cognitive Grades"
                    labels={Object.keys(reportData.grades.cognitive_grades)}
                    data={reportData.grades.cognitive_grades}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SemesterReport;
