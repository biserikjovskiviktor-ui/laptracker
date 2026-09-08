import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Stopwatch from './components/Stopwatch';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import AddVehicle from './components/AddVehicle';
import AddTrack from './components/AddTrack';

const App = () => {
  return (
    <Router>
      <div className="bg-dark text-light min-vh-100">
        <Navbar /> {/* Your Navbar component */}
        <div className="container py-4">
          <Routes>
            <Route path="/" element={<Leaderboard />} />
            <Route path="/stopwatch" element={<Stopwatch />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Login />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/add-vehicle" element={<AddVehicle />} />
            <Route path="/add-track" element={<AddTrack />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;