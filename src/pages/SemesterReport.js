import React, { useState, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../components/Navbar";
import BarChart from "../components/BarChart";

function SemesterReport() {
  // Form fields
  const [studentId, setStudentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Report data & states
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Navbar items
  const navItems = [];

  // Refs for the bar charts
  const poChartRef = useRef(null);
  const cogChartRef = useRef(null);

  // ------------------------------
  // Fetching function
  // ------------------------------
  const handleGenerateReport = async () => {
    setReportData(null);
    setError(null);
    setLoading(true);
    // Validate fields
    if (!studentId || !startDate || !endDate) {
      setError(
        "Please fill in all fields (Student ID, Semester Start Date, Semester End Date)."
      );
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError("Semester Start Date must be earlier than Semester End Date.");
      return;
    }


    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Access token not found.");
      setLoading(false);
      return;
    }

    try {
      // POST request with start_date and end_date in the body
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
        setTimeout(()=>{
          setReportData(response.data.data);
          setLoading(false)
        },1500)
      } else {
        setTimeout(()=>{
          setError(response.data.message);
          setLoading(false)
        },1500)
        
      }
    } catch (error) {
      setTimeout(()=>{
        setError(error.response?.data?.message);
        setLoading(false)
      },1500)
      
    }
  };

  // ------------------------------
  // Download handler
  // ------------------------------
  const downloadReport = () => {
    if (!reportData) return;

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
    if (
      reportData.grades?.po_grades &&
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
      reportData.grades?.cognitive_grades &&
      Object.keys(reportData.grades.cognitive_grades).length > 0
    ) {
      doc.setFontSize(12);
      doc.text("Cognitive Grades", pageWidth / 2, yPosition, { align: "center" });
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

    doc.save(`Semester_Report_${studentId}.pdf`);
  };

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <Navbar
        navItems={navItems} 
        logout={true}
        />
      <div className="h-16"></div>

      {/* Form Card */}
      <div className="flex justify-between items-center my-4 mx-4 p-4 bg-white rounded-md shadow-md">
        {/* Left Section: Input Form */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <p className="font-inter font-semibold text-[24px] leading-[100%] tracking-[-0.04em] mb-2">
            Semester Report Summary
          </p>
          <p className="font-inter font-medium text-[14px] leading-[100%] tracking-[-0.04em] mb-6">
            Please fill in all fields to generate Semester Report Summary
          </p>
          <label className="font-inter font-medium text-[14px] mb-2">
            Student ID
          </label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full px-3 py-2 mb-4 rounded-md border-2 border-black focus:outline-none"
            placeholder="Enter Student ID"
          />
          <div className="flex space-x-4 mb-6">
            <div className="w-1/2">
              <label className="font-inter font-medium text-[14px] mb-2">
                Semester Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md border-2 border-black focus:outline-none"
              />
            </div>
            <div className="w-1/2">
              <label className="font-inter font-medium text-[14px] mb-2">
                Semester End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md border-2 border-black focus:outline-none"
              />
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
        {/* Right Section: Image */}
        <div className="hidden lg:flex lg:w-1/2 h-full px-4 py-4 flex items-center justify-center">
          <img
            src={`${process.env.PUBLIC_URL}/assets/classImage.png`}
            alt="Image Here"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      </div>

      <hr className="border-t border-gray-800 my-2 mx-4" />

      {/* Loader */}
      {loading && (
        <div className="flex justify-center mt-4 mb-4">
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

      {/* Error Message */}
      {error && (
        <p className="text-red-500 mb-4 text-center font-bold">{error}</p>
      )}

      {/* Report Display Card */}
      {reportData && (
        <div className="flex flex-col my-4 mx-4 p-4 bg-white rounded-md shadow-md">
          {/* Header Row: Title & Download Button */}
          <div className="w-full flex justify-between items-center mb-4">
            <p className="font-inter font-semibold text-[24px] tracking-[-0.04em] mb-2">
              Semester Report Summary
            </p>
            <button
              onClick={downloadReport}
              className="border-2 border-[#3941FF] text-[#3941FF] py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] hover:text-white hover:border-[#2C36CC] transition easeInOut"
            >
              Download Report
            </button>
          </div>
          {/* Summary */}
          {reportData.summary && (
            <div className="mb-8">
              <p className="font-inter font-semibold text-[24px] tracking-[-0.04em] mb-2">
                Summary
              </p>
              <p className="text-black">{reportData.summary}</p>
            </div>
          )}
          {/* PO & Cognitive Grades Tables */}
          <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-4 mb-4">
            <div className="w-full lg:w-1/2 flex flex-col pr-1 pl-1 lg:px-6">
              <h3 className="text-lg font-bold text-center mb-2">PO Grades</h3>
              <div className="h-full flex-grow">
                <table className="w-full border border-gray-200 h-full">
                  <thead className="bg-black text-white">
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
              </div>
            </div>
            <div className="w-full lg:w-1/2 flex flex-col pr-1 pl-1 lg:px-6">
              <h3 className="text-lg font-bold text-center mb-2">Cognitive Grades</h3>
              <div className="h-full flex-grow">
                <table className="w-full border border-gray-200 h-full">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="px-4 py-2 border border-gray-200 text-center">Category</th>
                      <th className="px-4 py-2 border border-gray-200 text-center">Grade (%)</th>
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
            </div>
          </div>
          {/* Charts */}
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
    </div>
  );
}

export default SemesterReport;

