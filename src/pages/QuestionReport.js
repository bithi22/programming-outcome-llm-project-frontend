import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../components/Navbar";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import BarChart from "../components/BarChart";
import { motion, AnimatePresence } from "framer-motion";
import ErrorPopup from "../components/ErrorPopUp";


const API_URL = process.env.REACT_APP_API_URL

axios.defaults.withCredentials = true;

function QuestionReport() {
  const location = useLocation();
  const { question_id, question_name } = location.state;

  // Form states
  const [studentId, setStudentId] = useState("");
  const [reportType, setReportType] = useState("student"); // "student", "average", or "overall"
  const [viewReportType, setViewReportType] = useState("");

  // Report data and loading/error
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New state for student list fetching
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState(null);
  const [errorPopup, setErrorPopup] = useState(false);

  // Chart refs (for PDF capture)
  const poChartRef = useRef(null);
  const cogChartRef = useRef(null);

  const navItems = [];
  const actionButton = { label: "Logout", path: "/logout" };

  // ------------------------------
  // Fetch student IDs on mount (or when question_id changes)
  // ------------------------------
  useEffect(() => {
    const fetchStudents = async () => {
      setStudentsLoading(true);
      setStudentsError(null);
      
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setErrorPopup(true);
        setTimeout(() => {
          // Redirect to Home
          navigate("/", { replace: true });

          // Prevent back navigation
          window.history.pushState(null, null, window.location.href);
          window.onpopstate = () => {
            window.history.go(1);
          };
        }, 3000);
        return;
      }
      try {
        const response = await axios.get(
          `${API_URL}/question/students/${question_id}`,
          { headers: { accessToken: token } }
        );
        if (response.data.success) {
          const { students } = response.data.data;
          setStudents(students.sort());
          if(response?.headers?.accesstoken){
            localStorage.setItem("accessToken", response.headers.accesstoken);
          }
        } else {
          setStudentsError(response.data.message);
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          setStudentsLoading(false);
          setErrorPopup(true);
          setTimeout(() => {
            // Redirect to Home
            navigate("/", { replace: true });
  
            // Prevent back navigation
            window.history.pushState(null, null, window.location.href);
            window.onpopstate = () => {
              window.history.go(1);
            };
          }, 3000);
          return ;
        }
        setStudentsError(
          err.response?.data?.message || "Error fetching student IDs."
        );
      } finally {
        setTimeout(() => {
          setStudentsLoading(false);
        }, 1500);
      }
    };

    fetchStudents();
  }, [question_id]);

  // ------------------------------
  // Update studentId when student list changes
  // ------------------------------
  useEffect(() => {
    if (students.length > 0) {
      setStudentId(students[0]);
    } else {
      setStudentId("");
    }
  }, [students]);

  // ------------------------------
  // Fetching functions
  // ------------------------------
  const fetchStudentReport = async () => {
    setReportData(null);
    setError(null);
    if (!studentId) {
      setError("Please select a valid Student ID.");
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false)
        setErrorPopup(true);
        setTimeout(() => {
          // Redirect to Home
          navigate("/", { replace: true });

          // Prevent back navigation
          window.history.pushState(null, null, window.location.href);
          window.onpopstate = () => {
            window.history.go(1);
          };
        }, 3000);
        return;
      }
    try {
      const response = await axios.get(
        `${API_URL}/report/question/${question_id}/${studentId}`,
        { headers: { accessToken: token } }
      );
      if (response.data.success) {
        setTimeout(() => {
          setReportData(response.data.data);
          setViewReportType("student");
          setLoading(false);
        }, 1500);
        if(response?.headers?.accesstoken){
          localStorage.setItem("accessToken", response.headers.accesstoken);
        }
      } else {
        setTimeout(() => {
          setError(response.data.message);
          setReportData(null);
          setLoading(false);
        }, 1500);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setLoading(false);
        setReportData(null)
        setErrorPopup(true);
        setTimeout(() => {
          // Redirect to Home
          navigate("/", { replace: true });

          // Prevent back navigation
          window.history.pushState(null, null, window.location.href);
          window.onpopstate = () => {
            window.history.go(1);
          };
        }, 3000);
        return ;
      }
      setTimeout(() => {
        setError(err.response?.data?.message || "Error while fetching report.");
        setReportData(null);
        setLoading(false);
      }, 1500);
    }
  };

  const fetchAverageReport = async () => {
    setReportData(null);
    setError(null);
    setLoading(true);
    
    const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false)
        setErrorPopup(true);
        setTimeout(() => {
          // Redirect to Home
          navigate("/", { replace: true });

          // Prevent back navigation
          window.history.pushState(null, null, window.location.href);
          window.onpopstate = () => {
            window.history.go(1);
          };
        }, 3000);
        return;
      }
    try {
      const response = await axios.get(
        `${API_URL}/report/question/${question_id}/average`,
        { headers: { accessToken: token } }
      );
      if (response.data.success) {
        setTimeout(() => {
          setReportData(response.data.data);
          setViewReportType("average");
          setLoading(false);
        }, 1500);
        if(response?.headers?.accesstoken){
          localStorage.setItem("accessToken", response.headers.accesstoken);
        }
      } else {
        setTimeout(() => {
          setError(response.data.message);
          setReportData(null);
          setLoading(false);
        }, 1500);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setLoading(false);
        setReportData(null)
        setErrorPopup(true);
        setTimeout(() => {
          // Redirect to Home
          navigate("/", { replace: true });

          // Prevent back navigation
          window.history.pushState(null, null, window.location.href);
          window.onpopstate = () => {
            window.history.go(1);
          };
        }, 3000);
        return ;
      }
      setTimeout(() => {
        setError(err.response?.data?.message || "Error while fetching report.");
        setReportData(null);
        setLoading(false);
      }, 1500);
    }
  };

  const fetchOverallReport = async () => {
    setReportData(null);
    setError(null);
    setLoading(true);
    const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false)
        setErrorPopup(true);
        setTimeout(() => {
          // Redirect to Home
          navigate("/", { replace: true });

          // Prevent back navigation
          window.history.pushState(null, null, window.location.href);
          window.onpopstate = () => {
            window.history.go(1);
          };
        }, 3000);
        return;
      }
    try {
      const response = await axios.get(
        `${API_URL}/report/question/${question_id}/overall`,
        { headers: { accessToken: token } }
      );
      if (response.data.success) {
        setTimeout(() => {
          setReportData(response.data.data);
          setViewReportType("overall");
          setLoading(false);
        }, 1500);
        if(response?.headers?.accesstoken){
          localStorage.setItem("accessToken", response.headers.accesstoken);
        }
      } else {
        setTimeout(() => {
          setError(response.data.message);
          setReportData(null);
          setLoading(false);
        }, 1500);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setLoading(false);
        setReportData(null)
        setErrorPopup(true);
        setTimeout(() => {
          // Redirect to Home
          navigate("/", { replace: true });

          // Prevent back navigation
          window.history.pushState(null, null, window.location.href);
          window.onpopstate = () => {
            window.history.go(1);
          };
        }, 3000);
        return ;
      }
      setTimeout(() => {
        setError(
          err.response?.data?.message || "Error while fetching overall report."
        );
        setReportData(null);
        setLoading(false);
      }, 1500);
    }
  };

  // ------------------------------
  // Unified Generate Report handler
  // ------------------------------
  const handleGenerateReport = () => {
    // If no student IDs available for student report, do nothing.
    if (reportType === "student" && students.length === 0) {
      setError("No reports available to fetch");
      return;
    }
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
    doc.text(`Report for: ${question_name}`, pageWidth / 2, 20, {
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

  const isStudentOrAverage =
    viewReportType === "student" || viewReportType === "average";

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <Navbar
        navItems={navItems} 
        logout={true}
        />
      <div className="h-16"></div>
      <ErrorPopup
        visible={errorPopup}
        errorMessage={
          "Your login session has been expired. Please login again."
        }
      ></ErrorPopup>

      <AnimatePresence mode="wait">
        {studentsLoading ? (
          <div className="container mx-auto px-6 mt-8">
            <div className="bg-white shadow-md rounded-lg p-6">
              <motion.div
                className="animate-pulse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
              </motion.div>
            </div>
          </div>
        ) : studentsError ? (
          <p className="text-red-500 my-4 text-center font-bold">
            {studentsError}
          </p>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="flex justify-between items-center my-4 mx-4 p-4 bg-white rounded-md shadow-md">
              {/* Left Form Section */}
              <div className="w-full lg:w-1/2 flex flex-col">
                <p className="font-inter font-semibold text-[24px] leading-[100%] tracking-[-0.04em] mb-2">
                  {question_name} Report
                </p>
                <p className="font-inter font-medium text-[14px] leading-[100%] tracking-[-0.04em] mb-6">
                  Please select all the fields to generate {question_name} Report
                </p>
                <label className="font-inter font-medium text-[14px] leading-[100%] tracking-[-0.04em] mb-2">
                  Student ID
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={reportType !== "student"}
                  className="w-full px-3 py-2 mb-4 rounded-md border-2 border-black focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {students.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
                <label className="font-inter font-medium text-[14px] leading-[100%] tracking-[-0.04em] mb-2">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="border-2 border-black rounded-lg w-full px-3 py-2 focus:outline-none mb-6"
                >
                  <option value="student">Student</option>
                  <option value="average">Average</option>
                  <option value="overall">Overall</option>
                </select>
                <button
                  onClick={handleGenerateReport}
                  disabled={loading || (reportType === "student" && students.length <= 0)}
                  className={`w-full bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] transition easeInOut ${
                    loading || (reportType === "student" && students.length <= 0)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  Generate Report
                </button>
                {reportType === "student" && students.length <= 0 && (
                  <p className="text-red-500 mt-2 font-bold">
                    No reports available to fetch
                  </p>
                )}
              </div>
              {/* Right Image Section */}
              <div className="hidden lg:flex lg:w-1/2 h-full px-4 py-4 items-center justify-center">
                <img
                  src={`${process.env.PUBLIC_URL}/assets/classImage.png`}
                  alt="Image Here"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
            <hr className="border-t border-gray-800 my-2 mx-4" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Display Card */}
      {loading && (
        <div className="flex justify-center items-center mt-4 mb-4">
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
            <span>Please wait. This may take a while</span>
          </div>
        </div>
      )}
      {error && (
        <p className="text-red-500 mb-4 text-center font-bold">{error}</p>
      )}

      {reportData && (
        <div className="flex flex-col my-4 mx-4 p-4 bg-white rounded-md shadow-md">
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
          {/* STUDENT / AVERAGE Report Details */}
          {(isStudentOrAverage && reportData.grades) && (
            <div className="flex flex-col space-y-4">
              {reportData.summary && (
                <div className="mb-8">
                  <p className="font-inter font-semibold text-[24px] leading-[100%] tracking-[-0.04em] mb-2">
                    Summary
                  </p>
                  <p className="text-black">{reportData.summary}</p>
                </div>
              )}
              <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-4 mb-4">
                <div className="w-full lg:w-1/2 flex flex-col pr-1 pl-1 lg:px-6">
                  <h3 className="text-lg font-bold text-center mb-2">
                    PO Grades
                  </h3>
                  <div className="h-full flex-grow">
                    <table className="w-full border border-gray-200 h-full">
                      <thead className="bg-black text-white">
                        <tr>
                          <th className="w-1/2 px-4 py-2 border border-gray-200 text-center">
                            PO
                          </th>
                          <th className="w-1/2 px-4 py-2 border border-gray-200 text-center">
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
                  </div>
                </div>
                <div className="w-full lg:w-1/2 flex flex-col pr-1 pl-1 lg:px-6">
                  <h3 className="text-lg font-bold text-center mb-2">
                    Cognitive Grades
                  </h3>
                  <div className="h-full flex-grow">
                    <table className="w-full border border-gray-200 h-full">
                      <thead className="bg-black text-white">
                        <tr>
                          <th className="w-1/2 px-4 py-2 border border-gray-200 text-center">
                            Category
                          </th>
                          <th className="w-1/2 px-4 py-2 border border-gray-200 text-center">
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
                </div>
              </div>
              <div className="w-full flex flex-col lg:flex-row items-center justify-center mb-4">
                <div className="w-full lg:w-1/2 flex flex-col pr-1 pl-1 lg:px-6">
                  <BarChart
                    ref={poChartRef}
                    title="PO Grades"
                    labels={Object.keys(reportData.grades.po_grades || {})}
                    data={reportData.grades.po_grades || {}}
                  />
                </div>
                <div className="w-full lg:w-1/2 flex flex-col pr-1 pl-1 lg:px-6">
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
          {/* OVERALL Report Table */}
          {viewReportType === "overall" &&
            Array.isArray(reportData) &&
            reportData.length > 0 && (
              <div className="w-full">
                {(() => {
                  const firstItem = reportData[0];
                  const firstStudentId = Object.keys(firstItem)[0];
                  const { po_grades: firstPo, cognitive_grades: firstCog } =
                    firstItem[firstStudentId];
                  const poKeys = Object.keys(firstPo);
                  const cogKeys = Object.keys(firstCog);
                  return (
                    <div className="w-full overflow-x-auto overflow-y-auto max-h-96">
                      <table className="min-w-full border border-gray-200">
                        <thead className="bg-black text-white font-inter font-semibold tracking-[-0.04em]">
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
                    </div>
                  );
                })()}
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default QuestionReport;
