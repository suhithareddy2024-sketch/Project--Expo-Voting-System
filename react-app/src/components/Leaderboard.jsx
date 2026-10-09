import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpo } from '../context/ExpoContext';

export default function Leaderboard() {
  const { projects, resultsData } = useExpo();
  const navigate = useNavigate();

  // Sort projects strictly by actual live vote count descending, with team number tiebreaker
  const sorted = [...projects].sort(
    (a, b) => (b.votes || 0) - (a.votes || 0) || Number(a.team || 0) - Number(b.team || 0)
  );

  // Derive live top 3
  const top3 = sorted.slice(0, 3);

  const formatVoteText = (count) => {
    const n = Number(count || 0);
    return `${n} ${n === 1 ? 'Vote' : 'Votes'}`;
  };

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
    if (!project) return;
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
          {/* 2nd Place (Silver - Left) */}
          {top3[1] && (
            <div
              className="podium-card silver cursor-pointer"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              onClick={() => handleProjectClick(top3[1])}
            >
              <div className="trophy-badge">🥈</div>
              <span className="badge bg-secondary mb-2">2nd Place</span>
              <h4 className="fw-bold text-white mb-1">{top3[1].title}</h4>
              <p className="text-light-50 small mb-2">Team #{top3[1].team}</p>
              <div className="vote-chip">{formatVoteText(top3[1].votes)}</div>
            </div>
          )}

          {/* 1st Place (Gold - Center) */}
          {top3[0] && (
            <div
              className="podium-card gold cursor-pointer"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              onClick={() => handleProjectClick(top3[0])}
            >
              <div className="trophy-badge">🥇</div>
              <span className="badge bg-warning text-dark fw-bold mb-2">1st Champion</span>
              <h3 className="fw-bold text-white mb-1">{top3[0].title}</h3>
              <p className="text-warning small mb-2">Team #{top3[0].team}</p>
              <div className="vote-chip border-warning text-warning fw-bold">
                {formatVoteText(top3[0].votes)}
              </div>
            </div>
          )}

          {/* 3rd Place (Bronze - Right) */}
          {top3[2] && (
            <div
              className="podium-card bronze cursor-pointer"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              onClick={() => handleProjectClick(top3[2])}
            >
              <div className="trophy-badge">🥉</div>
              <span className="badge bg-danger mb-2">3rd Place</span>
              <h4 className="fw-bold text-white mb-1">{top3[2].title}</h4>
              <p className="text-light-50 small mb-2">Team #{top3[2].team}</p>
              <div className="vote-chip">{formatVoteText(top3[2].votes)}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
