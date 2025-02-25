import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

function CoPoMapping() {
  const location = useLocation();
  const classroom_id = location.state?.classroom_id || '';
  const syllabus = location.state?.syllabus || '';
  const copoData = location.state?.copoData || {};
  const [copoMapping, setCopoMapping] = useState(copoData);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  console.log(copoData)

  const handleInputChange = (currentCo, field, value) => {
    setCopoMapping((prev) => {
      const updated = { ...prev };

      // Handle CO renaming
      if (field === 'CO') {
        const newCo = value.trim();

        if (!newCo) {
          alert('CO cannot be empty.');
          return prev;
        }

        if (newCo !== currentCo && updated[newCo]) {
          alert('CO already exists. Please use a unique CO.');
          return prev;
        }

        updated[newCo] = { ...updated[currentCo] };
        delete updated[currentCo];
      } else {
        updated[currentCo] = { ...updated[currentCo], [field]: value };
      }

      return updated;
    });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('You are not logged in. Please log in first.');
        return;
      }

      const requestBody = {
        classroom_id,
        syllabus,
        co_po_table: copoMapping,
      };

      const response = await axios.post(
        `http://127.0.0.1:8000/classroom/syllabus`,
        requestBody,
        {
          headers: {
            accessToken: token,
          },
        }
      );

      if (response.status === 201) {
        
        navigate('/classroom', { state: { classroom_id: classroom_id } });
      }
    } catch (err) {
      console.error('Failed to save CO-PO Mapping:', err.response?.data || err.message);
      setError('Failed to save CO-PO Mapping. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-6 mt-24">
      <h1 className="text-xl font-bold mb-6">Editable CO-PO Mapping</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="overflow-x-auto">
        <table className="table-auto w-full text-left border border-gray-300">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-4 py-2 border">CO</th>
              <th className="px-4 py-2 border">Description</th>
              <th className="px-4 py-2 border">Cognitive Domains</th>
              <th className="px-4 py-2 border">POs</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(copoMapping).map(([co, details]) => (
              <tr key={co}>
                <td className="px-4 py-2 border">
                  <input
                    type="text"
                    value={co}
                    onChange={(e) => handleInputChange(co, 'CO', e.target.value)}
                    className="w-full border p-2 rounded focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2 border">
                  <textarea
                    value={details?.description || ''}
                    onChange={(e) => handleInputChange(co, 'description', e.target.value)}
                    className="w-full border p-2 rounded focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2 border">
                  <textarea
                    value={details?.PO || ''}
                    onChange={(e) => handleInputChange(co, 'PO', e.target.value)}
                    className="w-full border p-2 rounded focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2 border">
                  <textarea
                    value={details?.["Cognitive Domain"] || ''}
                    onChange={(e) => handleInputChange(co, 'Cognitive Domain', e.target.value)}
                    className="w-full border p-2 rounded focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2 border">
                  <textarea
                    value={details?.weight || ''}
                    onChange={(e) => handleInputChange(co, 'weight', e.target.value)}
                    className="w-full border p-2 rounded focus:outline-none"
                  />
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default CoPoMapping;
