import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

function Classroom() {
  const [classroomDetails, setClassroomDetails] = useState(null);
  const [error, setError] = useState('');
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [syllabusText, setSyllabusText] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const classroom_id = location.state?.classroom_id;

  const navItems = [
    { label: 'Join Class', path: '/joinclass' },
    { label: 'Generate Report', path: '/generatereport' },
  ];

  const actionButton = { label: 'Logout', path: '/logout' };

  useEffect(() => {
    if (!classroom_id) {
      setError('Classroom ID not provided.');
      return;
    }

    fetchClassroomDetails(classroom_id);
  }, [classroom_id]);

  const fetchClassroomDetails = async (id) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('You are not logged in. Please log in first.');
        return;
      }

      const response = await axios.get(
        `http://127.0.0.1:8000/classroom/${id}`,
        {
          headers: {
            accessToken: token,
          },
        }
      );
      console.log('Classroom Details:', response.data);
      setClassroomDetails(response.data.data);
    } catch (error) {
      setError('Failed to fetch classroom details. Please try again.');
    }
  };

  const handleGetCoPoMapping = async () => {
    if (!syllabusText.trim()) {
      alert('Please enter the syllabus text.');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('You are not logged in. Please log in first.');
        return;
      }

      const response = await axios.post(
        'http://127.0.0.1:8000/classroom/co-po-mapping',
        { classroom_id, syllabus: syllabusText },
        {
          headers: {
            accessToken: token,
          },
        }
      );

      if (response.status === 200 && response.data.success) {
        console.log(response)
        navigate('/copomapping', {
          state: {
            classroom_id,
            syllabus: syllabusText,
            copoData: response.data.data,
          },
        });
      } else {
        alert('Failed to map syllabus to CO-PO. Please try again.');
      }
    } catch (error) {
      console.error('Error mapping syllabus to CO-PO:', error.response?.data || error.message);
      alert('Failed to map syllabus to CO-PO. Please try again.');
    }
  };
  const handleQuestionClick = () => {
    // Navigate to the question details page, passing the question_id
    navigate('/allquestions', { state: { classroom_id} });
  };
  return (
    <div>
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />

      <div className="container mx-auto px-6 mt-24">
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <img
            src="https://via.placeholder.com/800x300.png?text=Class+Image"
            alt="Class Banner"
            className="w-full h-56 object-cover"
          />
          <div className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">
                {classroomDetails?.name || 'Classroom Name'}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Course: {classroomDetails?.course || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Course Code: {classroomDetails?.course_code || 'N/A'}
              </p>
            </div>
            <div className="space-x-4">
              <button
                onClick={handleQuestionClick}
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
              >
                Questions
              </button>
              {classroomDetails?.committee_access && (
                <button
                  onClick={() => setIsSyllabusModalOpen(true)}
                  className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Update Syllabus
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">CO-PO Table</h2>
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left border border-gray-300">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-4 py-2 border">CO</th>
                  <th className="px-4 py-2 border">Description</th>
                  <th className="px-4 py-2 border">Cognitive Domains</th>
                  <th className="px-4 py-2 border">PO's</th>
                </tr>
              </thead>
              <tbody>
                {classroomDetails?.co_po_table
                  ? Object.entries(classroomDetails.co_po_table).map(
                      ([co, details], index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 border">{co}</td>
                          <td className="px-4 py-2 border">
                            {details.description || 'No description provided'}
                          </td>
                          <td className="px-4 py-2 border">
                            {details['Cognitive Domain']
                              ||'No domains provided'}
                          </td>
                          <td className="px-4 py-2 border">
                            {details.PO
                              || 'No PO data provided'}
                          </td>
                        </tr>
                      )
                    )
                  : (
                    <tr>
                      <td className="px-4 py-2 border text-center" colSpan={4}>
                        No CO-PO data available.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isSyllabusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[600px] p-6">
            <h2 className="text-xl font-semibold mb-4 text-left">Update Syllabus</h2>
            <textarea
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              className="w-full h-40 px-4 py-2 border border-black rounded-md mb-4 focus:outline-none"
              placeholder="Enter the syllabus here..."
            ></textarea>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsSyllabusModalOpen(false)}
                className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleGetCoPoMapping}
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
              >
                Get CO-PO Mapping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Classroom;
