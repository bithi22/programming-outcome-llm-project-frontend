import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Signin from './pages/Login';
import DashBoard from './pages/Dashboard';
import EmailVerification from './pages/VerifyEmail';
import Classroom from './pages/Classroom';
import QuestionCoPo from './pages/QuestionCoPO';
import QuestionResult from './pages/QuestionResult';
import AllQuestions from './pages/AllQuestions';
import QuestionDisplay from './pages/QuestionDisplay';
import CoPoMapping from './pages/CoPoMapping';
import QuestionReport from './pages/QuestionReport';
import ClassroomReport from './pages/ClassroomReport';
import ForgetPassword from './pages/ForgetPassword';
import SemesterReport from './pages/SemesterReport';
import Intro from './pages/Intro';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/register" element={<Register />} />

        <Route path="/login" element={<Signin />} />
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/emailVerification" element={<EmailVerification/>}/>
        <Route path ="/classroom" element={<Classroom/>}/>
        <Route path="/questioncopomapping" element={<QuestionCoPo/>}/>
        <Route path="/questionresult" element={<QuestionResult/>}/>
        <Route path="/allquestions" element={<AllQuestions/>}/>
        <Route path="/questiondisplay" element={<QuestionDisplay/>}/>
        <Route path="/copomapping" element={<CoPoMapping/>}/>
        <Route path="/showquestionreport" element={<QuestionReport/>}/>
        <Route path="/showclassroomreport" element={<ClassroomReport/>}/>
        <Route path='/forgotpassword' element={<ForgetPassword/>}/>
        <Route path='/report' element={<SemesterReport/>}/>

      </Routes>
    </Router>
  );
}

export default App;
