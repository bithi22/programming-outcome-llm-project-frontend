import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios"

function QuestionCoPo() {
  const [editableData, setEditableData] = useState([]);
  const [error, setError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Retrieve data from navigation state
  const classroom_id = location.state?.classroom_id || null;
  const questionName = location.state?.questionName || "Unknown Question";
  const questionWeight = location.state?.weight || 0;
  const coPoMapping = location.state?.coPoMapping || {};
  const questionDescriptions = location.state?.questionDescriptions || {};
  console.log("🚀 Received location.state:", location.state);
  console.log("classroom_id:", classroom_id);
  console.log("coPoMapping:", coPoMapping);
  console.log("questionDescriptions:", questionDescriptions);

  useEffect(() => {
    if (!classroom_id || !coPoMapping || !questionDescriptions) {
      console.error("❌ Missing Data Detected, Waiting for Updates...");
      return; // Wait until data is available before proceeding
    }
  
    console.log("✅ All required data is available:", { coPoMapping, questionDescriptions });
  
    const formattedData = Object.entries(coPoMapping).flatMap(([key, value]) => {
      const mainDescription = questionDescriptions[key]?.description || "N/A";
  
      return Object.entries(value["sub-sections"] || {}).map(([subKey, subValue]) => ({
        number: `${key}${subKey.toUpperCase()}`,
        mainDescription,
        subDescription: subValue.description || "N/A",
        cognitiveDomain: subValue["Cognitive Domain"] || "",
        PO: subValue["PO"] || "",
        marks: subValue["marks"] || 0,
      }));
    });
  
    setEditableData(formattedData);
  }, [classroom_id, coPoMapping, questionDescriptions]);
  

  const handleInputChange = (index, field, value) => {
    setEditableData((prevData) =>
      prevData.map((item, idx) =>
        idx === index ? { ...item, [field]: field === "marks" ? parseInt(value, 10) : value } : item
      )
    );
  };

  const handleCreateQuestion = async () => {
    if (!editableData.length) {
      alert("No data to submit.");
      return;
    }

    const requestBody = {
      name: questionName,
      co_po_mapping: coPoMapping,
      classroom_id,
      weight: parseFloat(questionWeight),
      question_details: editableData,
    };

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You are not logged in. Please log in first.");
        return;
      }

      const response = await axios.post(`http://127.0.0.1:8000/question/`, requestBody, {
        headers: { accessToken: token },
      });

      if (response.status === 201) {
        const question_id = response.data[0]._id;
        alert("Question created successfully!");
        navigate("/questiondisplay", { state: { classroom_id, question_id } });
      } else {
        alert("Unexpected response from the server. Please try again.");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create the question. Please try again.");
    }
  };

  if (error) {
    return (
      <div className="text-red-500 text-center mt-10">
        {error} <br />
        <button onClick={() => navigate(-1)} className="text-blue-500 underline">Go Back</button>
      </div>
    );
  }

  return (
    <div>
      <Navbar
        navItems={[
          { label: "Join Class", path: "/joinclass" },
          { label: "Generate Report", path: "/generatereport" },
        ]}
        actionButton={{ label: "Logout", path: "/logout" }}
      />
      <div className="container mx-auto px-6 mt-24">
        <h2 className="text-lg font-semibold mb-4">CO-PO Mappings</h2>
        <button className="bg-blue-500 text-white px-4 py-2 mb-4 rounded" onClick={handleCreateQuestion}>
          Create Question
        </button>
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left border border-gray-300">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-2 border">Number</th>
                <th className="px-4 py-2 border">Main Question Description</th>
                <th className="px-4 py-2 border">Sub-section Description</th>
                <th className="px-4 py-2 border">Cognitive Domain</th>
                <th className="px-4 py-2 border">PO</th>
                <th className="px-4 py-2 border">Marks</th>
              </tr>
            </thead>
            <tbody>
              {editableData.map((item, index) => (
                <tr key={index} className="border">
                  <td className="px-4 py-2 border">{item.number}</td>
                  <td className="px-4 py-2 border">{item.mainDescription}</td>
                  <td className="px-4 py-2 border">{item.subDescription}</td>
                  <td className="px-4 py-2 border">
                    <input
                      type="text"
                      className="w-full border px-2 py-1"
                      value={item.cognitiveDomain}
                      onChange={(e) => handleInputChange(index, "cognitiveDomain", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 border">
                    <input
                      type="text"
                      className="w-full border px-2 py-1"
                      value={item.PO}
                      onChange={(e) => handleInputChange(index, "PO", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 border">
                    <input
                      type="number"
                      className="w-full border px-2 py-1"
                      value={item.marks}
                      onChange={(e) => handleInputChange(index, "marks", e.target.value)}
                    />
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

export default QuestionCoPo;
