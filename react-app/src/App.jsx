import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ExpoProvider } from './context/ExpoContext';
import BackgroundParticles from './components/BackgroundParticles';
import ThemeTransitions from './components/ThemeTransitions';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import VotePage from './pages/VotePage';
import AdminPage from './pages/AdminPage';

import './styles/style.css';
import './styles/animation.css';
import './styles/responsive.css';

export default function App() {
  return (
    <ExpoProvider>
      <Router>
        <div className="app-container d-flex flex-column min-vh-100 position-relative">
          {/* Animated Background Particles */}
          <BackgroundParticles />

          {/* Theme Transitions (Cute Robots, Water, AI Light, Heartbeat, etc.) */}
          <ThemeTransitions />

          {/* Fixed Glass Navbar */}
          <Navbar />

          {/* Main App Routes */}
          <div className="flex-grow-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/project/:id" element={<ProjectDetailsPage />} />
              <Route path="/vote" element={<VotePage />} />
              <Route path="/admin" element={<AdminPage />} />
              {/* Fallback route */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </Router>
    </ExpoProvider>
  );
}
