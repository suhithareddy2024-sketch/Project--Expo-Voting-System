import React from 'react';
import { useExpo } from '../context/ExpoContext';

export default function Hero() {
  const { expoSettings } = useExpo();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero text-center">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-10 mx-auto">
            {/* Admin Selected Event Category Pill */}
            <div className="mb-3">
              <span className="expo-badge-top">
                <i className="fa-solid fa-award me-1"></i> {expoSettings.expoCategory}
              </span>
            </div>

            {/* Main Event Title */}
            <h1 className="display-3 fw-extrabold hero-title mb-3">
              {expoSettings.expoName}
            </h1>

            {/* Hero Subquote */}
            <p className="hero-quote mb-4">
              "{expoSettings.expoQuote}"
            </p>

            {/* Hero Action Buttons */}
            <div className="hero-buttons d-flex justify-content-center gap-3 flex-wrap">
              <button
                onClick={() => scrollToSection('projects')}
                className="btn btn-gradient-primary btn-lg rounded-pill px-4 shadow-lg fw-bold border-0"
              >
                <i className="fa-solid fa-rocket me-2"></i> Explore Projects
              </button>
              <button
                onClick={() => scrollToSection('leaderboard')}
                className="btn btn-outline-light btn-lg rounded-pill px-4"
              >
                <i className="fa-solid fa-trophy text-warning me-2"></i> Live Top 3
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
