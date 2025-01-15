import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';

function QuestionReport() {
  const location = useLocation();
  const { question_id } = location.state || {}; // Extract question_id from state
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [popupVisible, setPopupVisible] = useState(true);
  const [exam_roll, setExamRoll] = useState('');

  const navItems = [
    { label: 'Join Class', path: '/joinclass' },
    { label: 'Generate Report', path: '/generatereport' },
  ];
  const actionButton = { label: 'Logout', path: '/logout' };

  const fetchReport = async () => {
    if (!question_id || !exam_roll) {
      setError('Question ID and Exam Roll are required.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError('Access token not found.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/report/question/${question_id}/${exam_roll}`,
        {
          headers: { accessToken: token },
        }
      );
      console.log('Report:', response);
      if (response.status === 200) {
        setReportData(response.data);
        setPopupVisible(false); // Hide popup after successful fetch
      } else {
        setError('Failed to fetch report.');
      }
    } catch (err) {
      setError('Error while fetching report.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowResult = () => {
    if (!exam_roll) {
      setError('Please enter a valid Exam Roll.');
      return;
    }
    fetchReport();
  };

  if (loading) {
    return (
      <div>
        <Navbar
          navItems={navItems}
          actionButton={actionButton}
          buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
        />
        <div className="container mx-auto px-6 mt-24">
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar
          navItems={navItems}
          actionButton={actionButton}
          buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
        />
        <div className="container mx-auto px-6 mt-24">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />
      <div className="container mx-auto px-6 mt-24">
        <h1 className="text-2xl font-bold mb-4">Generated Report</h1>

        {popupVisible && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-md shadow-md">
              <h2 className="text-xl font-bold mb-4">Enter Exam Roll</h2>
              <input
                type="text"
                value={exam_roll}
                onChange={(e) => setExamRoll(e.target.value)}
                placeholder="Enter Exam Roll"
                className="w-full border border-gray-300 px-4 py-2 rounded-md mb-4"
              />
              <button
                onClick={handleShowResult}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Show Result
              </button>
            </div>
          </div>
        )}

        {reportData && (
          <div className="overflow-x-auto">
            <table className="table-auto w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  {Object.keys(reportData[0] || {}).map((key) => (
                    <th
                      key={key}
                      className="border border-gray-300 px-4 py-2 bg-gray-100 text-center"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value, colIndex) => (
                      <td
                        key={colIndex}
                        className="border border-gray-300 px-4 py-2 text-center"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionReport;
