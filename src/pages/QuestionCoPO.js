// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import Navbar from '../components/Navbar';


// function QuestionCoPo() {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const questionName = location.state?.questionName;
//   const questionWeight = location.state?.questionWeight;
//   const questionData = location.state?.questionData;


//   const [question, setQuestion] = useState(null);
//   const [error, setError] = useState('');

//   const navItems = [
//     { label: 'Join Class', path: '/joinclass' },
//     { label: 'Generate Report', path: '/generatereport' },
//   ];

//   const actionButton = { label: 'Logout', path: '/logout' };

//   useEffect(() => {
//     setQuestion(questionData)
//   }, [questionName, questionWeight,questionData]);

//   const renderMappings = () => {
//     if (!question || !question.question_details) {
//       return null;
//     }
 
//     console.log("Inside render mappings:");
//     console.log(question);
 
//     const rows = [];

// Object.entries(question.question_details).forEach(([key, value]) => {
//   if (!value || !value['sub-sections']) {
//     rows.push({
//       id: key,
//       description: (
//         <>
//           <strong>{key + ". "}</strong>{value?.description || ''}
//         </>
//       ),
//       PO: question?.co_po_mapping?.[key]?.PO || '',
//       "Cognitive Domain": question?.co_po_mapping?.[key]?.["Cognitive Domain"] || '',
//       marks: question?.co_po_mapping?.[key]?.marks || ''
//     });
//   } else {
//     rows.push({
//       id: key,
//       description: (
//         <>
//           <strong>{key + ". "}</strong>{value?.description || ''}
//         </>
//       ),
//       PO: '',
//       "Cognitive Domain": '',
//       marks: ''
//     });

//     Object.entries(value['sub-sections'] || {}).forEach(([subKey, subValue]) => {
//       if (!subValue || !subValue['sub-sub-sections']) {
//         rows.push({
//           id: `${key}.${subKey}`,
//           description: (
//             <>
//               <strong>{subKey + ". "}</strong>{subValue?.description || ''}
//             </>
//           ),
//           PO: question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]?.PO || '',
//           "Cognitive Domain": question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]?.["Cognitive Domain"] || '',
//           marks: question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]?.marks || ''
//         });
//       } else {
//         rows.push({
//           id: `${key}.${subKey}`,
//           description: (
//             <>
//               <strong>{subKey + ". "}</strong>{subValue?.description || ''}
//             </>
//           ),
//           PO: '',
//           "Cognitive Domain": '',
//           marks: ''
//         });

//         Object.entries(subValue['sub-sub-sections'] || {}).forEach(([sub_sub_key, sub_sub_value]) => {
//           rows.push({
//             id: `${key}.${subKey}.${sub_sub_key}`,
//             description: (
//               <>
//                 <strong>{sub_sub_key + ". "}</strong>{sub_sub_value?.description || ''}
//               </>
//             ),
//             PO: question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]?.['sub-sub-sections']?.[sub_sub_key]?.PO || '',
//             "Cognitive Domain": question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]?.["sub-sub-sections"]?.[sub_sub_key]?.["Cognitive Domain"] || '',
//             marks: question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]?.["sub-sub-sections"]?.[sub_sub_key]?.marks || ''
//           });
//         });
//       }
//     });
//   }
// });

 
//     return rows.map((row, index) => (
//       <tr key={index}>
//         <td className="px-4 py-2 border">
//           <div className="w-full" style={{ whiteSpace: 'pre-wrap' }}>
//             {row?.description || ''}
//           </div>
//         </td>
//         <td className="px-4 py-2 border">
//           <span>{row?.PO || ''}</span>
//         </td>
//         <td className="px-4 py-2 border">
//           <span>{row?.["Cognitive Domain"] || ''}</span>
//         </td>
//         <td className="px-4 py-2 border">
//           <span>{row?.marks || ''}</span>
//         </td>
//       </tr>
//     ));
//   };
 

//   return (
//     <div>
//       <Navbar
//         navItems={navItems}
//         actionButton={actionButton}
//         buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
//       />
//       <div className="container mx-auto px-6 mt-24">
//         <h1 className="text-xl font-bold mb-6">
//           {questionName}
//         </h1>

//         <div>
//           <h2 className="text-lg font-semibold mb-4">CO-PO Mappings</h2>
//           <div className="mb-4">
//             <button
//               className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 mr-2"
//             >
//               Create Question
//             </button>
//           </div>
//           <div className="overflow-x-auto">
//             <table className="table-auto w-full text-left border border-gray-300">
//               <thead className="bg-black text-white">
//                 <tr>
//                   <th className="px-4 py-2 border">Question</th>
//                   <th className="px-4 py-2 border">Mapped PO</th>
//                   <th className="px-4 py-2 border">Mapped Cognitive Domain</th>
//                   <th className="px-4 py-2 border">Marks</th>
//                 </tr>
//               </thead>
//               <tbody>{renderMappings()}</tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default QuestionCoPo;

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

function QuestionCoPo() {
  const location = useLocation();
  const navigate = useNavigate();

  // Destructure data from location.state
  const questionName = location.state?.questionName;
  const questionWeight = location.state?.questionWeight;
  const questionData = location.state?.questionData;
  const [classroom_id, setClassroom_id] = useState(location.state?.classroom_id);

  const [question, setQuestion] = useState(null);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const navItems = [
    { label: 'Join Class', path: '/joinclass' },
    { label: 'Generate Report', path: '/generatereport' },
  ];

  const actionButton = { label: 'Logout', path: '/logout' };

  useEffect(() => {
    setQuestion(questionData);
  }, [questionName, questionWeight, questionData]);

  // Define dropdown options (no placeholder)
  const cognitiveDomainsOptions = [
    'Knowledge',
    'Understanding',
    'Analyzing',
    'Applying',
    'Creating',
    'Evaluating',
  ];
  const poOptions = Array.from({ length: 12 }, (_, i) => `PO${i + 1}`);

  // Update the co_po_mapping in the state when dropdown values change
  const handleMappingChange = (rowId, field, value) => {
    setQuestion((prev) => {
      const newQuestion = { ...prev };
      if (!newQuestion.co_po_mapping) newQuestion.co_po_mapping = {};

      const idParts = rowId.split('.');
      if (idParts.length === 1) {
        // Top-level mapping
        if (!newQuestion.co_po_mapping[rowId]) {
          newQuestion.co_po_mapping[rowId] = {};
        }
        newQuestion.co_po_mapping[rowId][field] = value;
      } else if (idParts.length === 2) {
        const [key, subKey] = idParts;
        if (!newQuestion.co_po_mapping[key]) {
          newQuestion.co_po_mapping[key] = {};
        }
        if (!newQuestion.co_po_mapping[key]['sub-sections']) {
          newQuestion.co_po_mapping[key]['sub-sections'] = {};
        }
        if (!newQuestion.co_po_mapping[key]['sub-sections'][subKey]) {
          newQuestion.co_po_mapping[key]['sub-sections'][subKey] = {};
        }
        newQuestion.co_po_mapping[key]['sub-sections'][subKey][field] = value;
      } else if (idParts.length === 3) {
        const [key, subKey, subSubKey] = idParts;
        if (!newQuestion.co_po_mapping[key]) {
          newQuestion.co_po_mapping[key] = {};
        }
        if (!newQuestion.co_po_mapping[key]['sub-sections']) {
          newQuestion.co_po_mapping[key]['sub-sections'] = {};
        }
        if (!newQuestion.co_po_mapping[key]['sub-sections'][subKey]) {
          newQuestion.co_po_mapping[key]['sub-sections'][subKey] = {};
        }
        if (
          !newQuestion.co_po_mapping[key]['sub-sections'][subKey][
            'sub-sub-sections'
          ]
        ) {
          newQuestion.co_po_mapping[key]['sub-sections'][subKey][
            'sub-sub-sections'
          ] = {};
        }
        if (
          !newQuestion.co_po_mapping[key]['sub-sections'][subKey][
            'sub-sub-sections'
          ][subSubKey]
        ) {
          newQuestion.co_po_mapping[key]['sub-sections'][subKey][
            'sub-sub-sections'
          ][subSubKey] = {};
        }
        newQuestion.co_po_mapping[key]['sub-sections'][subKey][
          'sub-sub-sections'
        ][subSubKey][field] = value;
      }
      return newQuestion;
    });
  };

  // Render rows for the mappings table.
  const renderMappings = () => {
    if (!question || !question.question_details) {
      return null;
    }

    const rows = [];

    Object.entries(question.question_details).forEach(([key, value]) => {
      // If there are no sub-sections:
      if (!value || !value['sub-sections']) {
        rows.push({
          id: key,
          description: (
            <>
              <strong>{key + '. '}</strong>
              {value?.description || ''}
            </>
          ),
          PO: question?.co_po_mapping?.[key]?.PO || '',
          'Cognitive Domain':
            question?.co_po_mapping?.[key]?.['Cognitive Domain'] || '',
          marks: question?.co_po_mapping?.[key]?.marks || '',
        });
      } else {
        // Parent row (no marks => no dropdown)
        rows.push({
          id: key,
          description: (
            <>
              <strong>{key + '. '}</strong>
              {value?.description || ''}
            </>
          ),
          PO: '',
          'Cognitive Domain': '',
          marks: '',
        });

        Object.entries(value['sub-sections'] || {}).forEach(
          ([subKey, subValue]) => {
            if (!subValue || !subValue['sub-sub-sections']) {
              rows.push({
                id: `${key}.${subKey}`,
                description: (
                  <>
                    <strong>{subKey + '. '}</strong>
                    {subValue?.description || ''}
                  </>
                ),
                PO:
                  question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]
                    ?.PO || '',
                'Cognitive Domain':
                  question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]?.[
                    'Cognitive Domain'
                  ] || '',
                marks:
                  question?.co_po_mapping?.[key]?.['sub-sections']?.[subKey]
                    ?.marks || '',
              });
            } else {
              // Sub-section parent row
              rows.push({
                id: `${key}.${subKey}`,
                description: (
                  <>
                    <strong>{subKey + '. '}</strong>
                    {subValue?.description || ''}
                  </>
                ),
                PO: '',
                'Cognitive Domain': '',
                marks: '',
              });

              Object.entries(subValue['sub-sub-sections'] || {}).forEach(
                ([subSubKey, subSubValue]) => {
                  rows.push({
                    id: `${key}.${subKey}.${subSubKey}`,
                    description: (
                      <>
                        <strong>{subSubKey + '. '}</strong>
                        {subSubValue?.description || ''}
                      </>
                    ),
                    PO:
                      question?.co_po_mapping?.[key]?.['sub-sections']?.[
                        subKey
                      ]?.['sub-sub-sections']?.[subSubKey]?.PO || '',
                    'Cognitive Domain':
                      question?.co_po_mapping?.[key]?.['sub-sections']?.[
                        subKey
                      ]?.['sub-sub-sections']?.[subSubKey]?.[
                        'Cognitive Domain'
                      ] || '',
                    marks:
                      question?.co_po_mapping?.[key]?.['sub-sections']?.[
                        subKey
                      ]?.['sub-sub-sections']?.[subSubKey]?.marks || '',
                  });
                }
              );
            }
          }
        );
      }
    });

    return rows.map((row, index) => {
      const { marks } = row;
      return (
        <tr key={index}>
          <td className="px-4 py-2 border">
            <div className="w-full" style={{ whiteSpace: 'pre-wrap' }}>
              {row?.description || ''}
            </div>
          </td>

          {/* PO cell */}
          <td className="px-4 py-2 border">
            {marks ? (
              <select
                value={row.PO}
                onChange={(e) =>
                  handleMappingChange(row.id, 'PO', e.target.value)
                }
                className="w-full border rounded p-1"
              >
                {poOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              // If no marks, show blank
              <span></span>
            )}
          </td>

          {/* Cognitive Domain cell */}
          <td className="px-4 py-2 border">
            {marks ? (
              <select
                value={row['Cognitive Domain']}
                onChange={(e) =>
                  handleMappingChange(row.id, 'Cognitive Domain', e.target.value)
                }
                className="w-full border rounded p-1"
              >
                {cognitiveDomainsOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <span></span>
            )}
          </td>

          {/* Marks cell */}
          <td className="px-4 py-2 border">
            <span>{row?.marks || ''}</span>
          </td>
        </tr>
      );
    });
  };

  // Handles the "Create Question" button click
  const handleCreateQuestion = async () => {
    if (!question) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    // Prepare the payload
    const payload = {
      name : questionName,
      weight : Number(questionWeight),
      co_po_mapping: question.co_po_mapping || {},
      question_details: question.question_details || {},
      classroom_id: classroom_id,
    };

    try {
      setIsLoading(true);
      // Make your POST request (update the URL as per your backend)
      const response = await axios.post(`http://127.0.0.1:8000/question`, payload,{
        headers: {
          accessToken: token,
        },
      });

      if(response.status===201){
        // On success, show success message
        setPopupMessage('Question created successfully.');
        setIsLoading(false);

        // Hide popup after 1 second and navigate
        setTimeout(() => {
          setPopupMessage('');
          navigate('/allquestions',{
            state : {
              classroom_id
            }
          });
        }, 3000);
      }
      else{
        setIsLoading(false);
      // Show error message in the popup
      setPopupMessage(response.data?.message);
      // Optionally hide the error popup after some time
      setTimeout(() => {
        setPopupMessage('');
      }, 3000);
      }
      
    } catch (error) {
      setIsLoading(false);
      // Show error message in the popup
      setPopupMessage(error?.response?.data?.message || 'Error creating question.');
      // Optionally hide the error popup after some time
      setTimeout(() => {
        setPopupMessage('');
      }, 3000);
    }
  };

  return (
    <div>
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-blue-500">
                  Please wait, this may take a while.
                </span>
        </div>
      )}

      {/* Popup Message */}
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
                <span>Question Created Successfully!</span>
              </div>
            </div>
          </div>
        )}

      <div className="container mx-auto px-6 mt-24">
        <h1 className="text-xl font-bold mb-6">{questionName}</h1>

        <div>
          <h2 className="text-lg font-semibold mb-4">CO-PO Mappings</h2>
          <div className="mb-4">
            <button
              onClick={handleCreateQuestion}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 mr-2"
            >
              Create Question
            </button>
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

export default QuestionCoPo;
