import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function QuestionBuilder() {
  const [questions, setQuestions] = useState([]);
  const [popup, setPopup] = useState({
    show: true,
    questionName: '',
    questionWeight: '',
    numQuestions: '',
  });
  const navigate = useNavigate();
  const location = useLocation();

  const classroom_id = location.state?.classroom_id;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Classroom', path: '/classroom' },
  ];
  const actionButton = { label: 'Logout', path: '/logout' };

  const handlePopupAdd = () => {
    const num = parseInt(popup.numQuestions, 10);
    if (!popup.questionName || !popup.questionWeight || isNaN(num) || num <= 0) {
      alert('Please fill all fields correctly.');
      return;
    }

    const newQuestions = Array.from({ length: num }, (_, index) => ({
      id: Date.now() + Math.random(),
      number: (index + 1).toString(),
      text: '',
      marks: '',
      subsections: [],
    }));

    setQuestions(newQuestions);
    setPopup({ ...popup, show: false });
  };

  const addNewQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        number: (prev.length + 1).toString(),
        text: '',
        marks: '',
        subsections: [],
      },
    ]);
  };

  const addSubsection = (id) => {
    const toRoman = (num) => {
      const romanNumerals = [
        ["M", 1000],
        ["CM", 900],
        ["D", 500],
        ["CD", 400],
        ["C", 100],
        ["XC", 90],
        ["L", 50],
        ["XL", 40],
        ["X", 10],
        ["IX", 9],
        ["V", 5],
        ["IV", 4],
        ["I", 1],
      ];
      let result = "";
      for (const [roman, value] of romanNumerals) {
        while (num >= value) {
          result += roman;
          num -= value;
        }
      }
      return result.toLowerCase();
    };
  
    const updateSections = (sections, depth = 1) =>
      sections.map((section) => {
        if (section.id === id) {
          const nextSubsectionNumber =
            depth === 1
              ? String.fromCharCode(97 + section.subsections.length) // 'a', 'b', 'c', etc.
              : toRoman(section.subsections.length + 1); // 'i', 'ii', 'iii', etc.
  
          return {
            ...section,
            marks: '', // Clear marks field when a subsection is added
            subsections: [
              ...section.subsections,
              {
                id: Date.now() + Math.random(),
                number: nextSubsectionNumber,
                text: '',
                marks: '',
                subsections: [],
              },
            ],
          };
        }
  
        return {
          ...section,
          subsections: updateSections(section.subsections, depth + 1),
        };
      });
  
    setQuestions((prev) => updateSections(prev));
  };
  

  const deleteSection = (id) => {
    const removeSection = (sections) =>
      sections.filter((section) => section.id !== id).map((section) => ({
        ...section,
        subsections: removeSection(section.subsections),
      }));

    setQuestions((prev) => removeSection(prev));
  };

  const handleTextChange = (id, text) => {
    const updateText = (sections) =>
      sections.map((section) =>
        section.id === id
          ? { ...section, text }
          : { ...section, subsections: updateText(section.subsections) }
      );

    setQuestions((prev) => updateText(prev));
  };

  const handleMarksChange = (id, marks) => {
    const updateMarks = (sections) =>
      sections.map((section) =>
        section.id === id
          ? { ...section, marks }
          : { ...section, subsections: updateMarks(section.subsections) }
      );

    setQuestions((prev) => updateMarks(prev));
  };

  const handleGetCoPoMapping = () => {
    if (questions.length === 0) {
      alert('No questions to map!');
      return;
    }
  
    const createHierarchy = (sections, depth = 1) => {
      const obj = {};
      sections.forEach((section) => {
        const hasSubsections = section.subsections && section.subsections.length > 0;
        const entry = {
          description: section.text,
        };
  
        if (hasSubsections) {
          // Use "sub-sub-sections" at the third level, otherwise "sub-sections"
          const subsectionKey = depth === 2 ? 'sub-sub-sections' : 'sub-sections';
          entry[subsectionKey] = createHierarchy(section.subsections, depth + 1);
        } else {
          // Ensure marks are present for leaf nodes
          entry.marks = section.marks !== undefined ? parseInt(section.marks, 10) || 0 : 0;
        }
  
        obj[section.number] = entry;
      });
      return obj;
    };
  
    const questionData = {
      data: createHierarchy(questions),
    };
  
    console.log('Generated Question Data:', JSON.stringify(questionData, null, 2));
  
    navigate('/questioncopomapping', {
      state: { classroom_id, questionData,
        questionName: popup.questionName,
        questionWeight: popup.questionWeight,
       },
    });
  };
  
  
  const renderPopup = () => {
    if (!popup.show) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <h4 className="text-lg font-bold mb-4">Add Questions</h4>
          <input
            type="text"
            value={popup.questionName}
            onChange={(e) => setPopup({ ...popup, questionName: e.target.value })}
            className="border p-2 w-full rounded mb-3"
            placeholder="Question Name"
          />
          <input
            type="number"
            value={popup.questionWeight}
            onChange={(e) => setPopup({ ...popup, questionWeight: e.target.value })}
            className="border p-2 w-full rounded mb-3"
            placeholder="Question Weight"
          />
          <input
            type="number"
            value={popup.numQuestions}
            onChange={(e) => setPopup({ ...popup, numQuestions: e.target.value })}
            className="border p-2 w-full rounded mb-3"
            placeholder="Number of Questions"
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
            onClick={handlePopupAdd}
          >
            Add
          </button>
        </div>
      </div>
    );
  };

  const renderSections = (sections) => {
    return sections.map((section) => (
      <div key={section.id} className="mb-4">
        <div className="flex items-center space-x-4">
          <span className="text-gray-800 font-semibold w-20">{section.number}</span>
          <textarea
            value={section.text}
            onChange={(e) => handleTextChange(section.id, e.target.value)}
            className="border p-2 w-1/2 rounded"
            placeholder="Enter question"
          />
          {section.subsections.length === 0 && ( // Show marks only if no subsections
            <input
              type="text"
              value={section.marks}
              onChange={(e) => handleMarksChange(section.id, e.target.value)}
              className="border p-2 w-20 rounded"
              placeholder="Marks"
            />
          )}
          <button
            onClick={() => addSubsection(section.id)}
            className="bg-green-500 text-white px-4 py-1 rounded"
          >
            Add Subsection
          </button>
          <button
            onClick={() => deleteSection(section.id)}
            className="bg-red-500 text-white px-4 py-1 rounded"
          >
            Delete
          </button>
        </div>
        {section.subsections.length > 0 && (
          <div className="ml-8">{renderSections(section.subsections)}</div>
        )}
      </div>
    ));
  };
  

  return (
    <div>
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded hover:bg-red-500 hover:text-white"
      />
      <div className="container mx-auto mt-8">
        {renderPopup()}
        {!popup.show && (
          <>
            <div className="mb-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 mt-24 rounded"
                onClick={addNewQuestion}
              >
                Add Question
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 ml-4 mt-24 rounded"
                onClick={handleGetCoPoMapping}
              >
                Get CO-PO Mapping
              </button>
            </div>
            <div>{renderSections(questions)}</div>
          </>
        )}
      </div>
    </div>
  );
}

export default QuestionBuilder;
