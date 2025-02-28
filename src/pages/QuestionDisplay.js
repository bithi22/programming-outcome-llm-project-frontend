import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';


function QuestionDisplay() {
  const location = useLocation();
  const navigate = useNavigate();

  const classroom_id = location.state?.classroom_id;
  const question_id = location.state?.question_id;

  const [question, setQuestion] = useState(null);
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

        console.log('Question Details Response:', response.data.data);
        setQuestion(response.data.data);
      } catch (err) {
        console.error('Failed to fetch question details:', err.response || err.message);
        setError('Failed to fetch question details. Please try again.');
      }
    };

    fetchQuestionDetails();
  }, [classroom_id, question_id]);

  const handleGenerateResult = () => {
    navigate('/questionresult', { state: { classroom_id, question, question_id } });
  };

  const handleShowResult = () => {
    navigate('/showquestionreport', { state: { question_id, classroom_id } });
  };

  const renderMappings = () => {
    if (!question || !question.question_details) {
      return null;
    }
 
    console.log("Inside render mappings:");
    console.log(question);
 
    const rows = [];

Object.entries(question.question_details).forEach(([key, value]) => {
  if (!value || !value['sub-sections']) {
    rows.push({
      id: key,
      description: (
        <>
          <strong>{key + ". "}</strong>{value?.description || ''}
        </>
      ),
      PO: question?.co_po_mapping?.[key]?.PO || '',
      "Cognitive Domain": question?.co_po_mapping?.[key]?.["Cognitive Domain"] || '',
      marks: question?.co_po_mapping?.[key]?.marks || ''
    });
  } else {
    rows.push({
      id: key,
      description: (
        <>
          <strong>{key + ". "}</strong>{value?.description || ''}
        </>
      ),
      PO: '',
      "Cognitive Domain": '',
      marks: ''
    });

    Object.entries(value['sub-sections'] || {}).forEach(([subKey, subValue]) => {
      if (!subValue || !subValue['sub-sub-sections']) {
        rows.push({
          id: `${key}.${subKey}`,
          description: (
            <>
              <strong>{subKey + ". "}</strong>{subValue?.description || ''}
            </>
          ),
          PO: question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]?.PO || '',
          "Cognitive Domain": question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]?.["Cognitive Domain"] || '',
          marks: question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]?.marks || ''
        });
      } else {
        rows.push({
          id: `${key}.${subKey}`,
          description: (
            <>
              <strong>{subKey + ". "}</strong>{subValue?.description || ''}
            </>
          ),
          PO: '',
          "Cognitive Domain": '',
          marks: ''
        });

        Object.entries(subValue['sub-sub-sections'] || {}).forEach(([sub_sub_key, sub_sub_value]) => {
          rows.push({
            id: `${key}.${subKey}.${sub_sub_key}`,
            description: (
              <>
                <strong>{sub_sub_key + ". "}</strong>{sub_sub_value?.description || ''}
              </>
            ),
            PO: question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]?.['sub-sub-sections']?.[sub_sub_key]?.PO || '',
            "Cognitive Domain": question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]?.["sub-sub-sections"]?.[sub_sub_key]?.["Cognitive Domain"] || '',
            marks: question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]?.["sub-sub-sections"]?.[sub_sub_key]?.marks || ''
          });
        });
      }
    });
  }
});

 
    return rows.map((row, index) => (
      <tr key={index}>
        <td className="px-4 py-2 border">
          <div className="w-full" style={{ whiteSpace: 'pre-wrap' }}>
            {row?.description || ''}
          </div>
        </td>
        <td className="px-4 py-2 border">
          <span>{row?.PO || ''}</span>
        </td>
        <td className="px-4 py-2 border">
          <span>{row?.["Cognitive Domain"] || ''}</span>
        </td>
        <td className="px-4 py-2 border">
          <span>{row?.marks || ''}</span>
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
          {question?.name || 'No Question Name Provided'}
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
            {question?.report_submitted && (
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
                  <th className="px-4 py-2 border">Mapped PO</th>
                  <th className="px-4 py-2 border">Mapped Cognitive Domain</th>
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
