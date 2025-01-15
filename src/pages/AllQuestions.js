import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

function AllQuestions() {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract classroom_id from the previous page
  const classroom_id = location.state?.classroom_id;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Classroom', path: '/classroom' },
  ];
  const actionButton = { label: 'Logout', path: '/logout' };

  useEffect(() => {
    if (!classroom_id) {
      setError('Classroom ID is not provided.');
      setLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('You are not logged in. Please log in first.');
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `http://127.0.0.1:8000/classroom/questions/${classroom_id}`,
          {
            headers: {
              accessToken: token,
            },
          }
        );
        console.log('QuestionDetails:', response.data);
        setQuestions(response.data.data || []); // Adjusted for API response structure
      } catch (err) {
        setError('Failed to fetch questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [classroom_id]);

  const handleQuestionClick = (question) => {
    // Navigate to the question details page, passing the question_id
    navigate('/questiondisplay', { state: { classroom_id, question_id: question._id } });
  };

  const handleAddQuestion = () => {
    navigate('/questionbuilder', { state: { classroom_id } });
  };

  return (
    <div>
      {/* Navbar */}
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />

      {/* Page Content */}
      <div className="container mx-auto px-6 mt-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">All Questions</h1>
          <button
            onClick={handleAddQuestion}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Add a New Question
          </button>
        </div>

        {loading ? (
          <div className="text-center mt-10">Loading questions...</div>
        ) : error ? (
          <div className="text-red-500 text-center mt-10">{error}</div>
        ) : questions.length > 0 ? (
          <div className="flex flex-col space-y-4">
            {questions.map((question, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg shadow-sm hover:bg-gray-100 cursor-pointer"
                onClick={() => handleQuestionClick(question)}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h11M9 21V3m0 18c6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12S3 4.373 3 11c0 6.627 5.373 12 12 12z"
                      />
                    </svg>
                  </div>
                  <div className="text-lg font-semibold">{question.name}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-10">
            No questions available.
          </div>
        )}
      </div>
    </div>
  );
}

export default AllQuestions;
