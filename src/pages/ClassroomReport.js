import React, { useState, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../components/Navbar";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import BarChart from "../components/BarChart";

axios.defaults.withCredentials = true;

function ClassroomReport() {
  const location = useLocation();
  const { classroom_id, teacher_access, committee_access, classroom_name } = location.state;

  // State variables
  const [studentId, setStudentId] = useState("");
  const [reportType, setReportType] = useState("student"); // "student", "average", or "overall"
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewReportType,setViewReportType] = useState('')

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

  // Navbar setup
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
        setViewReportType('student')
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
        setViewReportType('average')
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
        setViewReportType('overall')
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
    // If "overall" -> XLSX
    if (
      viewReportType === "overall" &&
      Array.isArray(reportData) &&
      reportData.length > 0
    ) {
      const firstItem = reportData[0];
      const firstStudentId = Object.keys(firstItem)[0];
      const { po_grades: firstPo, cognitive_grades: firstCog } =
        firstItem[firstStudentId];
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
      // Merging header cells
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

    // Otherwise (student or average) -> PDF
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(16);
    doc.text(`Report for: ${classroom_name}`, pageWidth / 2, 20, {
      align: "center",
    });
    if (viewReportType === "student") {
      doc.text(`Student ID: ${studentId}`, pageWidth / 2, 30, {
        align: "center",
      });
    } else if (viewReportType === "average") {
      doc.text("Average Report", pageWidth / 2, 30, { align: "center" });
    }

    let yPosition = 40;
    // Summary
    if (reportData?.summary) {
      doc.setFontSize(12);
      const summaryText = `Summary: ${reportData.summary}`;
      const splitSummary = doc.splitTextToSize(
        summaryText,
        pageWidth - margin * 2
      );
      doc.text(splitSummary, margin, yPosition, { align: "left" });
      yPosition += splitSummary.length * 10 + 5;
    }

    // PO Grades table
    if (
      reportData?.grades?.po_grades &&
      Object.keys(reportData.grades.po_grades).length > 0
    ) {
      doc.setFontSize(12);
      doc.text("PO Grades", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 5;
      autoTable(doc, {
        startY: yPosition + 5,
        head: [["PO", "Grade (%)"]],
        body: Object.entries(reportData.grades.po_grades).map(
          ([key, value]) => [key, `${value}%`]
        ),
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
      doc.text("Cognitive Grades", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 5;
      autoTable(doc, {
        startY: yPosition + 5,
        head: [["Category", "Grade (%)"]],
        body: Object.entries(reportData.grades.cognitive_grades).map(
          ([key, value]) => [key, `${value}%`]
        ),
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
          pageWidth - 2 * margin,
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
          pageWidth - 2 * margin,
          80
        );
      }
    } catch (err) {
      console.error("Error adding chart images: ", err);
    }

    if (viewReportType === "student") {
      doc.save(`Report_${studentId}.pdf`);
    } else if (viewReportType === "average") {
      doc.save("Average_Report.pdf");
    }
  };

  const isStudentOrAverage = viewReportType === "student" || viewReportType === "average";

  return (
    <div className="min-h-screen bg-white flex flex-col flex-wrap">
      {/* Navbar */}
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />
      <div className="h-16"></div>
      {/* Top Card */}
      <div className="flex justify-between items-center my-4 mx-4 p-4 bg-white rounded-md shadow-md">
        {/* Left Form Section */}
        <div className="w-1/2 flex flex-col">
          <p className="font-inter font-semibold text-[24px] leading-[100%] tracking-[-0.04em] mb-2">
            Classroom Report Summary
          </p>
          <p className="font-inter font-medium text-[14px] leading-[100%] tracking-[-0.04em] mb-6">
            Please select all the fields to generate Classroom Report Summary
          </p>
          <label className="font-inter font-medium text-[14px] leading-[100%] tracking-[-0.04em] mb-2">
            Student ID
          </label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full px-3 py-2 mb-4 rounded-md border-2 border-black focus:outline-none"
            placeholder="Enter Student ID"
            disabled={reportType !== "student"}
          />
          <div className="flex space-x-4 mb-4">
            {(teacher_access || committee_access) && (
              <div className="w-1/2">
                <label className="font-inter font-medium text-[14px] leading-[100%] tracking-[-0.04em] mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="border-2 border-black rounded-lg w-full px-3 py-2 focus:outline-none"
                >
                  {teacher_access && <option value="teacher">Teacher</option>}
                  {committee_access && <option value="committee">Committee</option>}
                </select>
              </div>
            )}
            <div className="w-1/2">
              <label className="font-inter font-medium text-[14px] leading-[100%] tracking-[-0.04em] mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="border-2 border-black rounded-lg w-full px-3 py-2 focus:outline-none"
              >
                <option value="student">Student</option>
                <option value="average">Average</option>
                <option value="overall">Overall</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className={`w-full bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] transition easeInOut ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Generate Report
          </button>
        </div>
        {/* Right Image Section */}
        <div className="w-1/2 h-full px-4 py-4 flex items-center justify-center">
          <img
            src={`${process.env.PUBLIC_URL}/assets/classImage.png`}
            alt="Image Here"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      </div>
      <hr className="border-t border-gray-800 my-2 mx-4" />
      {/* Report Display Card */}
      {reportData && (
        <div className="flex flex-col justify-between items-center my-4 mx-4 p-4 bg-white rounded-md shadow-md">
          {/* Header Row: Title + Download Button */}
          <div className="w-full flex justify-between items-center mb-4">
            {viewReportType === "student" && (
              <p className="font-inter font-semibold text-[24px] leading-[100%] tracking-[-0.04em] mb-2">
                Student Report
              </p>
            )}
            {viewReportType === "average" && (
              <p className="font-inter font-semibold text-[24px] leading-[100%] tracking-[-0.04em] mb-2">
                Average Report
              </p>
            )}
            {viewReportType === "overall" && (
              <p className="font-inter font-semibold text-[24px] leading-[100%] tracking-[-0.04em] mb-2">
                Overall Report
              </p>
            )}
            <button
              onClick={downloadReport}
              className="border-2 border-[#3941FF] text-[#3941FF] py-2 px-4 rounded-md font-inter font-semibold text-[16px] leading-[100%] tracking-[-0.04em] text-center hover:bg-[#2C36CC] hover:text-white hover:border-[#2C36CC] transition easeInOut"
            >
              Download Report
            </button>
          </div>
          {/* Student/Average Report Details */}
          {isStudentOrAverage && reportData.grades && (
            <div className="flex flex-col space-y-4">
              {reportData.summary && (
                <div className="mb-8">
                  <p className="font-inter font-semibold text-[24px] leading-[100%] tracking-[-0.04em] mb-2">
                    Summary
                  </p>
                  <p className="text-black">{reportData.summary}</p>
                </div>
              )}
              <div className="w-full flex flex-wrap items-stretch justify-center mb-4">
                <div className="w-1/2 flex flex-col px-4">
                  <h3 className="text-lg font-bold text-center mb-2">PO Grades</h3>
                  <div className="h-full flex-grow">
                    <table className="w-full border border-gray-200 h-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 border border-gray-200 text-center">PO</th>
                          <th className="px-4 py-2 border border-gray-200 text-center">Grade (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(reportData.grades.po_grades).map(([poKey, poValue]) => (
                          <tr key={poKey}>
                            <td className="px-4 py-2 border border-gray-200 text-center">{poKey}</td>
                            <td className="px-4 py-2 border border-gray-200 text-center">{poValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="w-1/2 flex flex-col px-4">
                  <h3 className="text-lg font-bold text-center mb-2">Cognitive Grades</h3>
                  <div className="h-full flex-grow">
                    <table className="w-full border border-gray-200 h-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 border border-gray-200 text-center">Category</th>
                          <th className="px-4 py-2 border border-gray-200 text-center">Grade (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(reportData.grades.cognitive_grades).map(([cogKey, cogValue]) => (
                          <tr key={cogKey}>
                            <td className="px-4 py-2 border border-gray-200 text-center">{cogKey}</td>
                            <td className="px-4 py-2 border border-gray-200 text-center">{cogValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="w-full flex flex-wrap items-center justify-center mb-4">
                <div className="w-1/2 flex flex-col px-4">
                  <BarChart
                    ref={poChartRef}
                    title="PO Grades"
                    labels={Object.keys(reportData.grades.po_grades || {})}
                    data={reportData.grades.po_grades || {}}
                  />
                </div>
                <div className="w-1/2 flex flex-col px-4">
                  <BarChart
                    ref={cogChartRef}
                    title="Cognitive Grades"
                    labels={Object.keys(reportData.grades.cognitive_grades || {})}
                    data={reportData.grades.cognitive_grades || {}}
                  />
                </div>
              </div>
            </div>
          )}
          {/* Overall Report Table */}
          {viewReportType === "overall" && Array.isArray(reportData) && reportData.length > 0 && (
            <div className="w-full">
              {(() => {
                const firstItem = reportData[0];
                const firstStudentId = Object.keys(firstItem)[0];
                const { po_grades: firstPo, cognitive_grades: firstCog } = firstItem[firstStudentId];
                const poKeys = Object.keys(firstPo);
                const cogKeys = Object.keys(firstCog);
                return (
                  <table className="w-full border border-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center">
                          Student ID
                        </th>
                        <th colSpan={poKeys.length} className="border border-gray-300 px-4 py-2 text-center">
                          PO%
                        </th>
                        <th colSpan={cogKeys.length} className="border border-gray-300 px-4 py-2 text-center">
                          Cognitive Domain%
                        </th>
                      </tr>
                      <tr>
                        {poKeys.map((poKey) => (
                          <th key={poKey} className="border border-gray-300 px-4 py-2 text-center">
                            {poKey}
                          </th>
                        ))}
                        {cogKeys.map((cogKey) => (
                          <th key={cogKey} className="border border-gray-300 px-4 py-2 text-center">
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
                            <td className="border border-gray-300 px-4 py-2 text-center">{studentId}</td>
                            {poKeys.map((poKey) => (
                              <td key={poKey} className="border border-gray-300 px-4 py-2 text-center">
                                {po_grades[poKey]}
                              </td>
                            ))}
                            {cogKeys.map((cogKey) => (
                              <td key={cogKey} className="border border-gray-300 px-4 py-2 text-center">
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
      {loading && (
        <p className="text-blue-500 font-semibold mt-4 mx-4">
          Loading report...
        </p>
      )}
      {error && (
        <p className="text-red-500 font-semibold mt-4 mx-4">{error}</p>
      )}
    </div>
  );
}

export default ClassroomReport;
