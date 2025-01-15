import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Signin from './pages/Login';
import DashBoard from './pages/Dashboard';
import EmailVerification from './pages/VerifyEmail';
import Classroom from './pages/Classroom';
import QuestionBuilder from './pages/QuestionBuilder';
import QuestionCoPo from './pages/QuestionCoPO';
import QuestionResult from './pages/QuestionResult';
import AllQuestions from './pages/AllQuestions';
import QuestionDisplay from './pages/QuestionDisplay';
import CoPoMapping from './pages/CoPoMapping';
import QuestionReport from './pages/QuestionReport';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Signin />} />
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/emailVerification" element={<EmailVerification/>}/>
        <Route path ="/classroom" element={<Classroom/>}/>
        <Route path="/questionbuilder" element={<QuestionBuilder/>}/>
        <Route path="/questioncopomapping" element={<QuestionCoPo/>}/>
        <Route path="/questionresult" element={<QuestionResult/>}/>
        <Route path="/allquestions" element={<AllQuestions/>}/>
        <Route path="/questiondisplay" element={<QuestionDisplay/>}/>
        <Route path="/copomapping" element={<CoPoMapping/>}/>
        <Route path="/showquestionreport" element={<QuestionReport/>}/>

      </Routes>
    </Router>
  );
}

export default App;
