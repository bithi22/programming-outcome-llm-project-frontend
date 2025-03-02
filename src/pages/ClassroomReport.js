import React, { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../components/Navbar";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";

function ClassroomReport() {
  const location = useLocation();
  const { classroom_id, teacher_access, committee_access, classroom_name } = location.state;

  const [student_id, setstudent_id] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Toggles for different report types
  const [studentReport, setStudentReport] = useState(false);
  const [averageReport, setAverageReport] = useState(false);
  const [overallReport, setOverallReport] = useState(false);

  // Determine initial access type:
  // If only teacher_access is true => "teacher"
  // If only committee_access is true => "committee"
  // If both are true, default to "teacher" (radio buttons will let the user change)
  const initialAccessType =
    teacher_access && !committee_access
      ? "teacher"
      : !teacher_access && committee_access
      ? "committee"
      : "teacher";
  const [accessType, setAccessType] = useState(initialAccessType);

  const navItems = [
    { label: "Join Class", path: "/joinclass" },
    { label: "Generate Report", path: "/generatereport" },
  ];
  const actionButton = { label: "Logout", path: "/logout" };

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
        `http://127.0.0.1:8000/report/classroom/${classroom_id}/${accessType}/${student_id}`,
        { headers: { accessToken: token } }
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
        `http://127.0.0.1:8000/report/classroom/${classroom_id}/${accessType}/average`,
        { headers: { accessToken: token } }
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
        `http://127.0.0.1:8000/report/classroom/${classroom_id}/${accessType}/overall`,
        { headers: { accessToken: token } }
      );
      if (response.data.success) {
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

  const downloadReport = () => {
    if (overallReport && reportData && reportData.length > 0) {
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
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
        { s: { r: 0, c: 1 }, e: { r: 0, c: 1 + poKeys.length - 1 } },
        {
          s: { r: 0, c: 1 + poKeys.length },
          e: { r: 0, c: 1 + poKeys.length + cogKeys.length - 1 },
        },
      ];
    
      const totalHeaderCols = 1 + poKeys.length + cogKeys.length;
      for (let R = 0; R < 2; ++R) {
        for (let C = 0; C < totalHeaderCols; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          ws[cellAddress].s = {
            fill: { fgColor: { rgb: "D3D3D3" } },
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
    
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Overall Report");
      XLSX.writeFile(wb, "Overall_Report.xlsx");
      return;
    }
    
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(
      `Report for: ${classroom_name}`,
      doc.internal.pageSize.getWidth() / 2,
      20,
      { align: "center" }
    );
    
    doc.setFontSize(14);
    if (studentReport) {
      doc.text(
        `Student ID: ${student_id}`,
        doc.internal.pageSize.getWidth() / 2,
        30,
        { align: "center" }
      );
    } else if (averageReport) {
      doc.text("Average Report", doc.internal.pageSize.getWidth() / 2, 30, { align: "center" });
    }
    
    let yPosition = 50;
    
    if (reportData.po_grades && Object.keys(reportData.po_grades).length > 0) {
      doc.setFontSize(12);
      doc.text("PO Grades", doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" });
      yPosition += 5;
      autoTable(doc, {
        startY: yPosition + 5,
        head: [["PO", "Grade (%)"]],
        body: Object.entries(reportData.po_grades).map(([key, value]) => [key, `${value}%`]),
        theme: "grid",
        styles: { halign: "center" },
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
    
    if (reportData.cognitive_grades && Object.keys(reportData.cognitive_grades).length > 0) {
      doc.setFontSize(12);
      doc.text("Cognitive Grades", doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" });
      yPosition += 5;
      autoTable(doc, {
        startY: yPosition + 5,
        head: [["Category", "Grade (%)"]],
        body: Object.entries(reportData.cognitive_grades).map(([key, value]) => [key, `${value}%`]),
        theme: "grid",
        styles: { halign: "center" },
      });
    }
    
    if (studentReport) {
      doc.save(`Report_${student_id}.pdf`);
    } else if (averageReport) {
      doc.save(`Average_Report.pdf`);
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
        <div className="flex items-center gap-4 mb-6">
          {/* Show radio buttons only if both accesses are available */}
          {teacher_access && committee_access && (
            <div className="flex items-center gap-4">
              <label>
                <input
                  type="radio"
                  value="teacher"
                  checked={accessType === "teacher"}
                  onChange={() => setAccessType("teacher")}
                  className="mr-1"
                />
                Teacher
              </label>
              <label>
                <input
                  type="radio"
                  value="committee"
                  checked={accessType === "committee"}
                  onChange={() => setAccessType("committee")}
                  className="mr-1"
                />
                Committee
              </label>
            </div>
          )}
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
          <button
            onClick={fetchOverallReport}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Get Overall Report
          </button>
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

        {reportData && (studentReport || averageReport) && (
          <div className="mt-6 flex flex-col items-center w-full">
            <div className="w-full max-w-2xl">
              {studentReport && (
                <h2 className="text-xl font-bold mb-2 text-center">
                  {`Report of Student ID : ${student_id}`}
                </h2>
              )}
              {averageReport && (
                <h2 className="text-xl font-bold mb-2 text-center">Average Report</h2>
              )}
              <h2 className="text-xl font-bold mb-2 text-center">PO Grades</h2>
              <table className="table-fixed w-full border-collapse border border-gray-300 mb-4">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">PO</th>
                    <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">Grade (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.po_grades).map(([key, value]) => (
                    <tr key={key}>
                      <td className="border border-gray-300 px-4 py-2 text-center">{key}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="w-full max-w-2xl mt-4">
              <h2 className="text-xl font-bold mb-2 text-center">Cognitive Grades</h2>
              <table className="table-fixed w-full border-collapse border border-gray-300 mb-4">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">Cognitive Domain</th>
                    <th className="border border-gray-300 px-4 py-2 w-1/2 text-center">Grade (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.cognitive_grades).map(([key, value]) => (
                    <tr key={key}>
                      <td className="border border-gray-300 px-4 py-2 text-center">{key}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportData && overallReport && reportData.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4 text-center">Overall Report</h2>
            <div className="overflow-x-auto">
              {(() => {
                const firstItem = reportData[0];
                const firstStudentId = Object.keys(firstItem)[0];
                const { po_grades: firstPo, cognitive_grades: firstCog } = firstItem[firstStudentId];
                const poKeys = Object.keys(firstPo);
                const cogKeys = Object.keys(firstCog);
                return (
                  <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-300">
                      <tr>
                        <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center">Student ID</th>
                        <th colSpan={poKeys.length} className="border border-gray-300 px-4 py-2 text-center">PO%</th>
                        <th colSpan={cogKeys.length} className="border border-gray-300 px-4 py-2 text-center">Cognitive Domain%</th>
                      </tr>
                      <tr>
                        {poKeys.map((poKey) => (
                          <th key={poKey} className="border border-gray-300 px-4 py-2 text-center">{poKey}</th>
                        ))}
                        {cogKeys.map((cogKey) => (
                          <th key={cogKey} className="border border-gray-300 px-4 py-2 text-center">{cogKey}</th>
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
                              <td key={poKey} className="border border-gray-300 px-4 py-2 text-center">{po_grades[poKey]}</td>
                            ))}
                            {cogKeys.map((cogKey) => (
                              <td key={cogKey} className="border border-gray-300 px-4 py-2 text-center">{cognitive_grades[cogKey]}</td>
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

export default ClassroomReport;
