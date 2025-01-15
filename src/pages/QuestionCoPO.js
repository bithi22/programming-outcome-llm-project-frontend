import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

function QuestionCoPo() {
  const [coPoMappings, setCoPoMappings] = useState([]);
  const [questionDetails, setQuestionDetails] = useState(null);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const classroom_id = location.state?.classroom_id;
  const questionData = location.state?.questionData;
  console.log('Question', questionData);

  const navItems = [
    { label: 'Join Class', path: '/joinclass' },
    { label: 'Generate Report', path: '/generatereport' },
  ];
  const actionButton = { label: 'Logout', path: '/logout' };

  useEffect(() => {
    if (!classroom_id || !questionData) {
      setError('Classroom ID or Question Data not provided.');
      return;
    }

    setQuestionDetails(questionData);

    fetchCoPoMappings();
  }, [classroom_id, questionData]);

  const fetchCoPoMappings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('You are not logged in. Please log in first.');
        return;
      }

      const requestBody = {
        classroom_id,
        data: questionData.data,
      };

      const response = await axios.post(
        `http://127.0.0.1:8000/question/co-po-mapping`,
        requestBody,
        {
          headers: {
            accessToken: token,
          },
        }
      );
      console.log(response);
      const apiMappings = response.data.data || {};

      const orderedMappings = [];

      // Map CO and marks only, exclude description
      Object.entries(questionData.data).forEach(([questionKey, questionValue]) => {
        orderedMappings.push({
          id: questionKey,
          marks: questionValue.marks || '',
          CO: apiMappings[questionKey]?.CO || '',
        });
      });

      setCoPoMappings(orderedMappings);
    } catch (error) {
      console.error('Error fetching CO-PO mappings:', error.response?.data || error.message);
      setError(
        error.response?.data?.message ||
          'Failed to fetch CO-PO mappings. Please try again.'
      );
    }
  };

  const handleInputChange = (id, field, value) => {
    if (field === 'description') {
      // Update questionDetails for description changes
      setQuestionDetails((prevDetails) => {
        const updatedData = { ...prevDetails };
        if (updatedData.data[id]) {
          updatedData.data[id][field] = value;
        }
        return updatedData;
      });
    } else {
      // Update coPoMappings for CO and marks changes
      setCoPoMappings((prevMappings) =>
        prevMappings.map((mapping) =>
          mapping.id === id ? { ...mapping, [field]: value } : mapping
        )
      );
    }
  };

  useEffect(() => {
    console.log('Updated coPoMappings:', coPoMappings);
  }, [coPoMappings]);

  useEffect(() => {
    console.log('Updated questionDetails:', questionDetails);
  }, [questionDetails]);

  const handleCreateQuestion = async () => {
    console.log('Final CoPO', coPoMappings);
    console.log('Final questionDetails', questionDetails);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('You are not logged in. Please log in first.');
        return;
      }

      const weight = parseFloat(questionData.questionWeight);
      if (isNaN(weight)) {
        alert('Invalid weight value.');
        return;
      }

      // Build the flat `co_po_mapping` object
      const coPoMapping = coPoMappings.reduce((acc, item) => {
        acc[item.id] = {
          marks: parseInt(item.marks, 10) || 0,
          CO: item.CO || '',
        };
        return acc;
      }, {});

      const requestBody = {
        name: questionData.questionName,
        co_po_mapping: coPoMapping,
        classroom_id: classroom_id,
        weight: weight,
        question_details: questionDetails, // Send updated questionDetails
      };

      const response = await axios.post(
        `http://127.0.0.1:8000/question`,
        requestBody,
        {
          headers: {
            accessToken: token,
          },
        }
      );

      if (response.status === 201) {
        const questionId = response.data.data[0]._id;
        alert('Question created successfully!');
        navigate('/questiondisplay', {
          state: { classroom_id, question_id: questionId },
        });
      } else {
        alert('Failed to create question. Please try again.');
      }
    } catch (error) {
      console.error('Error creating question:', error.response?.data || error.message);
      alert('Failed to create a new question. Please try again.');
    }
  };

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  if (!coPoMappings.length) {
    return <div className="text-center mt-10">Loading CO-PO mappings...</div>;
  }

  return (
    <div>
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />
      <div className="container mx-auto px-6 mt-24">
        <div>
          <h2 className="text-lg font-semibold mb-4">CO-PO Mappings</h2>
          <button
            onClick={handleCreateQuestion}
            className="bg-blue-500 text-white px-4 py-2 mb-4 rounded-md hover:bg-blue-600"
          >
            Create Question
          </button>
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left border border-gray-300">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-4 py-2 border">Question Description</th>
                  <th className="px-4 py-2 border">Mapped CO</th>
                  <th className="px-4 py-2 border">Marks</th>
                </tr>
              </thead>
              <tbody>
                {coPoMappings.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 border">
                      <input
                        type="text"
                        value={questionDetails.data[item.id]?.description || ''}
                        onChange={(e) =>
                          handleInputChange(item.id, 'description', e.target.value)
                        }
                        className="border p-2 rounded w-full"
                        placeholder="Enter question description"
                      />
                    </td>
                    <td className="px-4 py-2 border">
                      <input
                        type="text"
                        value={item.CO}
                        onChange={(e) =>
                          handleInputChange(item.id, 'CO', e.target.value)
                        }
                        className="border p-2 rounded w-full"
                        placeholder="Enter CO"
                      />
                    </td>
                    <td className="px-4 py-2 border">
                      <input
                        type="number"
                        value={item.marks}
                        onChange={(e) =>
                          handleInputChange(item.id, 'marks', e.target.value)
                        }
                        className="border p-2 rounded w-full"
                        placeholder="Enter marks"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionCoPo;
