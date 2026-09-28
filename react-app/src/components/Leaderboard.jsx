import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpo } from '../context/ExpoContext';

export default function Leaderboard() {
  const { projects, resultsData, triggerCategoryAnimation } = useExpo();
  const navigate = useNavigate();

  // Sort projects by votes descending as live fallback
  const sorted = [...projects].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  
  // Use backend results top3 or fallback to sorted
  const top3 =
    resultsData?.top3 && resultsData.top3.length > 0
      ? resultsData.top3.map((t) => {
          const match = projects.find(
            (p) => String(p._id) === String(t.id) || String(p.id) === String(t.id)
          );
          return {
            ...t,
            category: t.category || match?.category || 'AI',
            image: match?.image
          };
        })
      : sorted.slice(0, 3);

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 15;
    const rotateX = ((y / rect.height) - 0.5) * -15;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  };

  const handleCardMouseLeave = (e) => {
    e.currentTarget.style.transform = '';
  };

  const handleProjectClick = (project) => {
    const id = project.id || project._id;
    navigate(`/project/${id}`);
  };

  return (
    <section id="leaderboard" className="leaderboard-section py-5">
      <div className="container">
        <div className="text-center mb-4">
          <span className="badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill mb-2">
            TOP 3 RANKINGS
          </span>
          <h2 className="display-5 fw-bold text-white">Live Leaderboard</h2>
          <p className="text-light-50">Leading top three teams based on student and judge votes</p>
        </div>

        {/* Top 3 Podium Grid */}
        <div className="leaderboard-podium">
          {/* 2nd Place (Silver) */}
          {top3[1] && (
            <div
              className="podium-card silver"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              onClick={() => handleProjectClick(top3[1])}
            >
              <div className="trophy-badge">🥈</div>
              <span className="badge bg-secondary mb-2">2nd Place</span>
              <h4 className="fw-bold text-white mb-1">{top3[1].title}</h4>
              <p className="text-light-50 small mb-2">Team #{top3[1].team}</p>
              <div className="vote-chip">{top3[1].votes || 0} Votes</div>
            </div>
          )}

          {/* 1st Place (Gold) */}
          {top3[0] && (
            <div
              className="podium-card gold"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              onClick={() => handleProjectClick(top3[0])}
            >
              <div className="trophy-badge">🥇</div>
              <span className="badge bg-warning text-dark fw-bold mb-2">1st Champion</span>
              <h3 className="fw-bold text-white mb-1">{top3[0].title}</h3>
              <p className="text-warning small mb-2">Team #{top3[0].team}</p>
              <div className="vote-chip border-warning text-warning">{top3[0].votes || 0} Votes</div>
            </div>
          )}

          {/* 3rd Place (Bronze) */}
          {top3[2] && (
            <div
              className="podium-card bronze"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              onClick={() => handleProjectClick(top3[2])}
            >
              <div className="trophy-badge">🥉</div>
              <span className="badge bg-danger mb-2">3rd Place</span>
              <h4 className="fw-bold text-white mb-1">{top3[2].title}</h4>
              <p className="text-light-50 small mb-2">Team #{top3[2].team}</p>
              <div className="vote-chip">{top3[2].votes || 0} Votes</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
