import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

function QuestionDisplay() {
  const location = useLocation();
  const navigate = useNavigate();

  const classroom_id = location.state?.classroom_id;
  const question_id = location.state?.question_id;

  const [questionDetails, setQuestionDetails] = useState(null);
  const [error, setError] = useState('');

  const navItems = [
    { label: 'Join Class', path: '/joinclass' },
    { label: 'Generate Report', path: '/generatereport' },
  ];

  const actionButton = { label: 'Logout', path: '/logout' };

  useEffect(() => {
    console.log(classroom_id,question_id)
    if (!classroom_id || !question_id) {
      setError('Classroom ID or Question ID not provided.');
      return;
    }

    const fetchQuestionDetails = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('You are not logged in. Please log in first.');
          return;
        }

        const response = await axios.get(
          `http://127.0.0.1:8000/question/${question_id}`,
          {
            headers: {
              accessToken: token,
            },
          }
        );

        console.log('Question Details Response:', response.data);
        setQuestionDetails(response.data.data);
      } catch (err) {
        console.error('Failed to fetch question details:', err.response || err.message);
        setError('Failed to fetch question details. Please try again.');
      }
    };

    fetchQuestionDetails();
  }, [classroom_id, question_id]);

  const handleGenerateResult = () => {
    navigate('/questionresult', { state: { classroom_id, questionDetails, question_id } });
  };

  const handleShowResult = () => {
    navigate('/showquestionreport', { state: { question_id, classroom_id } });
  };

  const renderMappings = () => {
    if (!questionDetails || !questionDetails.question_details || !questionDetails.co_po_mapping) {
      return null;
    }

    const rows = [];
    const { co_po_mapping } = questionDetails;

    Object.entries(questionDetails.question_details.data).forEach(([key, value]) => {
      const coMapping = co_po_mapping[key]?.CO || 'No CO';

      if (value.description?.trim()) {
        rows.push({
          id: key,
          description: value.description,
          marks: value.marks || '',
          CO: coMapping,
        });
      }

      if (value['sub-sections']) {
        Object.entries(value['sub-sections']).forEach(([subKey, subValue]) => {
          const subCoMapping = co_po_mapping[key]?.['sub-sections']?.[subKey]?.CO || 'No CO';
          rows.push({
            id: `${key}.${subKey}`,
            description: subValue.description,
            marks: subValue.marks,
            CO: subCoMapping,
          });
        });
      }
    });

    return rows.map((row, index) => (
      <tr key={index}>
        <td className="px-4 py-2 border">
          <div className="w-full" style={{ whiteSpace: 'pre-wrap' }}>
            {row.description || 'No description provided'}
          </div>
        </td>
        <td className="px-4 py-2 border">
          <span>{row.CO || 'No CO'}</span>
        </td>
        <td className="px-4 py-2 border">
          <span>{row.marks || '0'}</span>
        </td>
      </tr>
    ));
  };

  if (!classroom_id || !question_id) {
    return (
      <div className="text-red-500 text-center mt-10">
        Classroom ID or Question ID not provided.
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
        <h1 className="text-xl font-bold mb-6">
          {questionDetails?.name || 'No Question Name Provided'}
        </h1>

        <div>
          <h2 className="text-lg font-semibold mb-4">CO-PO Mappings</h2>
          <div className="mb-4">
            <button
              onClick={handleGenerateResult}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 mr-2"
            >
              Generate Result
            </button>
            {questionDetails?.report_submitted && (
              <button
                onClick={handleShowResult}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Show Result
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left border border-gray-300">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-4 py-2 border">Question</th>
                  <th className="px-4 py-2 border">Mapped CO</th>
                  <th className="px-4 py-2 border">Marks</th>
                </tr>
              </thead>
              <tbody>{renderMappings()}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionDisplay;
