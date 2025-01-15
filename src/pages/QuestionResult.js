import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';

function QuestionResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { questionDetails } = location.state || {};
  const { classroom_id } = location.state || {};
  const [headers, setHeaders] = useState([]);
  const [popupMessage, setPopupMessage] = useState('');
  const [data, setData] = useState([]);
  const [popupVisible, setPopupVisible] = useState(false);
  console.log(questionDetails);
  const question_id = location.state?.question_id;

  const navItems = [
    { label: 'Join Class', path: '/joinclass' },
    { label: 'Generate Report', path: '/generatereport' },
  ];
  const actionButton = { label: 'Logout', path: '/logout' };

  useEffect(() => {
    if (!questionDetails || !questionDetails.co_po_mapping) {
      console.error('Question details or CO-PO mappings not provided.');
      return;
    }

    // Parse headers from questionDetails.co_po_mapping
    const buildHeaders = (mapping) => {
      const headerLevels = [];

      const traverse = (node, level = 0, parentLabel = '') => {
        if (!headerLevels[level]) headerLevels[level] = [];

        Object.entries(node).forEach(([key, value]) => {
          const label = parentLabel ? `${key}` : key;

          headerLevels[level].push({ label, colSpan: 1 });

          if (value['sub-sections']) {
            const childCount = Object.keys(value['sub-sections']).length;
            headerLevels[level][headerLevels[level].length - 1].colSpan = childCount;
            traverse(value['sub-sections'], level + 1, label);
          }
        });
      };

      traverse(mapping);
      return headerLevels;
    };

    const hierarchicalHeaders = buildHeaders(questionDetails.co_po_mapping);
    // Add a "Student Name" column to the headers
    hierarchicalHeaders[0].unshift({ label: 'Student Name', colSpan: 1 });

    setHeaders(hierarchicalHeaders);

    const initialData = [Array(hierarchicalHeaders[hierarchicalHeaders.length - 1].length).fill('')];
    initialData.forEach(row => row.unshift('')); // Add empty cells for student names
    setData(initialData);
  }, [questionDetails]);

  const handleCellChange = (rowIndex, colIndex, value) => {
    const updatedData = [...data];
    updatedData[rowIndex][colIndex] = value;
    setData(updatedData);
  };

  const addRow = () => {
    const newRow = Array(headers[headers.length - 1].length).fill('');
    newRow.unshift(''); // Add an empty cell for the student name
    setData((prevData) => [...prevData, newRow]);
  };

  const deleteRow = (rowIndex) => {
    const updatedData = data.filter((_, index) => index !== rowIndex);
    setData(updatedData);
  };

  const saveRecord = async () => {
    const currentRecord = data.map(row => row.join(',')).join('\n');
    const requestBody = {
      current_record: currentRecord,
      question_id: question_id,
    };
    console.log("Record Saving", requestBody);
    const token = localStorage.getItem('accessToken');

    if (!token) {
      console.error('Access token not found');
      return;
    }

    try {
      const response = await axios.put(`http://127.0.0.1:8000/question/current-record`, requestBody, {
        headers: {
          accessToken: token,
        },
      });

      if (response.status === 200) {
        console.log("Setting popup visible");
        setPopupVisible(true);
        setTimeout(() => {
          setPopupVisible(false);
        }, 3000);
      } else {
        console.error('Failed to save record:', response.statusText);
      }
    } catch (error) {
      console.error('Error saving record:', error);
    }
  };

  const generateResult = async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      console.error('Access token not found');
      return;
    }

    try {
      const response = await axios.put(`http://127.0.0.1:8000/report/generate`, { question_id }, {
        headers: {
          accessToken: token,
        },
      });

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
                  {rowIndex === 1 && <th className="border border-gray-300 px-4 py-2 bg-gray-100"></th>}
                  {headerRow.map((header, colIndex) => (
                    <th
                      key={`${rowIndex}-${colIndex}`}
                      colSpan={header.colSpan}
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
