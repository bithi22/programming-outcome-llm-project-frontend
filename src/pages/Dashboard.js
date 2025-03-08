import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ClassCard from '../components/ClassCard';

import { motion, AnimatePresence } from 'framer-motion';

function Dashboard() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false); // State for join modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // State for create modal
  const [joinCode, setJoinCode] = useState('');
  // Use an object to store newClass data
  const [newClass, setNewClass] = useState({
    name: '',
    course: '',
    course_code: '',
    start_date: '',
    end_date: ''
  });
  const [error, setError] = useState('');
  const [classes, setClasses] = useState([]); // Registered classes
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { label: 'Generate Report', path: '/report' },
  ];

  const actionButton = { label: 'Logout', path: '/logout' };

  // Fetch registered classes on component mount
  useEffect(() => {
    fetchRegisteredClasses();
  }, []);

  const fetchRegisteredClasses = async () => {
    setLoadingClasses(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('You are not logged in. Please log in first.');
        setLoadingClasses(false);
        return;
      }
      const response = await axios.get('http://127.0.0.1:8000/user/classrooms', {
        headers: { accessToken: token },
      });
      setClasses(response.data.data || []);
    } catch (error) {
      setError('Failed to fetch classes. Please try again.');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleJoinClass = async () => {
    setLoadingJoin(true);
    setError('');
    if (!joinCode) {
      setError('Please enter the classroom code.');
      setLoadingJoin(false);
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('You are not logged in. Please log in first.');
        setLoadingJoin(false);
        return;
      }
      const response = await axios.post('http://127.0.0.1:8000/classroom/join', { code: joinCode }, { headers: { accessToken: token } });
      if (response.status === 200) {
        setTimeout(()=>{
          setError('');
          // Reset join code after success
          setJoinCode('');
          setIsJoinModalOpen(false);
          fetchRegisteredClasses();
          setLoadingJoin(false)
        },1500)
      }
    } catch (error) {
      setTimeout(()=>{
        setError(error.response?.data?.message || 'Failed to join classroom. Please try again.');
        setLoadingJoin(false)
      },1500)
    } 
  };

  function isStartDateEarlier(start_date, end_date) {
    return new Date(start_date) < new Date(end_date);
  }

  const handleCreateClass = async () => {
    setLoadingCreate(true);
    setError('');
    const { name, course, course_code, start_date, end_date } = newClass;
    if (!name || !course || !course_code || !start_date || !end_date) {
      setError('Please fill in all fields.');
      setLoadingCreate(false);
      return;
    }

    if(!isStartDateEarlier(start_date,end_date)){
      setError('Semester start date must be earlier than semester end date.')
      setLoadingCreate(false)
      return
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('You are not logged in. Please log in first.');
        setLoadingCreate(false);
        return;
      }
      const response = await axios.post('http://127.0.0.1:8000/classroom', { name, course, course_code, start_date, end_date }, { headers: { accessToken: token } });
      if (response.status === 201) {
        setTimeout(()=>{
          setError('');
          // Reset newClass fields after success
          setNewClass({ name: '', course: '', course_code: '', start_date: '', end_date: '' });
          setIsCreateModalOpen(false);
          setLoadingCreate(false)
          fetchRegisteredClasses();
        },1500)
        
      }
    } catch (error) {
      setTimeout(()=>{
        setError(error.response?.data?.message || 'Failed to create classroom. Please try again.');
        setLoadingCreate(false)
      },1500)
    } 
  };

  const handleViewClass = (classId) => {
    navigate('/classroom', { state: { classroom_id: classId } });
  };

  const handleCancelJoin = ()=>{
    setIsJoinModalOpen(false)
    setError('')
    setJoinCode('')
  }

  const handleCancelCreate = ()=>{
    setIsCreateModalOpen(false)
    setError('')
    setNewClass({
      name: '',
      course: '',
      course_code: '',
      start_date: '',
      end_date: ''
    })
  }

  return (
    <div>
      {/* Navbar */}
      <Navbar
        navItems={navItems}
        actionButton={actionButton}
        buttonStyle="border-2 border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-500 hover:text-white"
      />

      {/* Page Content */}
      <div className="px-20 mt-24 mb-6 mr-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-left">Your Classes</h2>
          <div className="space-x-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-green-700 text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-green-800"
            >
              Create Class
            </button>
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className= "bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC]"
            >
              Join Class
            </button>
          </div>
        </div>

        {/* Smooth Transition from Skeleton to Class Cards */}
        <AnimatePresence mode="wait">
          {loadingClasses ? (
            // Skeleton Loader (Motion Container)
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="bg-gray-200 animate-pulse h-32 w-full rounded-md" />
              ))}
            </motion.div>
          ) : (
            // Actual Class Cards (Motion Container)
            <motion.div
              key="classcards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {classes.map((classItem) => (
                <ClassCard
                  key={classItem._id}
                  title={classItem.name}
                  year={classItem.course}
                  semester={classItem.course_code}
                  image={process.env.PUBLIC_URL + '/assets/classImage.png'}
                  onClick={() => handleViewClass(classItem._id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Join Modal */}
      {isJoinModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-[400px] p-6">
              <h2 className="text-xl font-semibold mb-2 text-left">Join a Classroom</h2>
              <p className="text-gray-600 text-left mb-6">
                Enter the classroom code you want to join.
              </p>
              <input
                type="text"
                spellCheck = {false}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full px-4 py-2 mb-2 border border-black rounded-md focus:outline-none"
                placeholder="Enter classroom code"
              />
              {error && <p className="text-red-500 text-sm mb-4 text-center font-bold">{error}</p>}
              {/* Loader Spinner */}
              {loadingJoin && (
                <div className="flex justify-center mb-4">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  <div className="mx-2">
                    <span>Please wait...</span>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  onClick={handleCancelJoin}
                  className="bg-gray-300 text-black py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinClass}
                  disabled = {loadingJoin}
                  className={`w-full bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] ${
                    loadingJoin ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-[400px] p-6">
              <h2 className="text-xl font-semibold mb-4 text-left">Create a Classroom</h2>
              <label
                  htmlFor="classroom_name"
                  className="block font-bold text-left mb-1 text-black"
                >
                  Classroom Name
                </label>
              <input
                type="text"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                className="w-full px-4 py-2 border border-black rounded-md mb-4 focus:outline-none"
                placeholder="Enter classroom name"
              />
              <label
                  htmlFor="course"
                  className="block font-bold text-left mb-1 text-black"
                >
                  Course
                </label>
              <input
                type="text"
                value={newClass.course}
                onChange={(e) => setNewClass({ ...newClass, course: e.target.value })}
                className="w-full px-4 py-2 border border-black rounded-md mb-4 focus:outline-none"
                placeholder="Enter course name"
              />
              <label
                  htmlFor="course_code"
                  className="block font-bold text-left mb-1 text-black"
                >
                  Course Code
                </label>
              <input
                type="text"
                value={newClass.course_code}
                onChange={(e) =>
                  setNewClass({ ...newClass, course_code: e.target.value })
                }
                className="w-full px-4 py-2 border border-black rounded-md mb-4 focus:outline-none"
                placeholder="Enter course code"
              />
              <label
                  htmlFor="start_Date"
                  className="block font-bold text-left mb-1 text-black"
                >
                  Semester Start Date
                </label>
              <input
                type="date"
                value={newClass.start_date}
                onChange={(e) => setNewClass({ ...newClass, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-black rounded-md mb-4 focus:outline-none"
                placeholder="Select start date"
              />
              <label
                  htmlFor="end_date"
                  className="block font-bold text-left mb-1 text-black"
                >
                  Semester End Date
                </label>
              <input
                type="date"
                value={newClass.end_date}
                onChange={(e) => setNewClass({ ...newClass, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-black rounded-md mb-4 focus:outline-none"
                placeholder="Select end date"
              />
              {error && <p className="text-red-500 text-center text-sm mb-4 font-bold">{error}</p>}
              {/* Loader Spinner */}
              {loadingCreate && (
                <div className="flex justify-center mb-4">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  <div className="mx-2">
                    <span>Please wait...</span>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancelCreate}
                  className="bg-gray-300 text-black py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClass}
                  disabled = {loadingCreate}
                  className={`w-full bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC] ${
                    loadingCreate ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default Dashboard;
