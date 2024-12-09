import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Upload from './Upload';
import Metadata from './Metadata';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/upload" element={<Upload />} />
        <Route path="/metadata" element={<Metadata />} />
      </Routes>
    </Router>
  );
}

export default App;
