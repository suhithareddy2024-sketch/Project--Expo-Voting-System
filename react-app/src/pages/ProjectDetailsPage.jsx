import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useExpo } from '../context/ExpoContext';
import api from '../services/api';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { projects, loading } = useExpo();
  const [project, setProject] = useState(null);
  const [fetching, setFetching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    
    // First try finding in context
    const found = projects.find(
      (p) => String(p._id) === String(id) || String(p.id) === String(id)
    );

    if (found) {
      setProject(found);
    } else {
      // If not in context yet (e.g. direct URL load), fetch from API
      setFetching(true);
      api
        .getProjectById(id)
        .then((res) => {
          if (res?.data) {
            setProject({
              ...res.data,
              id: res.data._id || res.data.id,
              _id: res.data._id || res.data.id
            });
          }
        })
        .catch((err) => {
          console.warn('Could not fetch project by ID from API:', err.message);
          if (projects.length > 0) {
            setProject(projects[0]);
          }
        })
        .finally(() => setFetching(false));
    }
  }, [id, projects]);

  if ((loading || fetching) && !project) {
    return (
      <div className="container py-5 mt-5 text-center">
        <div className="spinner-border text-cyan mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h4 className="text-white">Loading Project Details...</h4>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-5 mt-5 text-center">
        <h2 className="text-white mb-3">Project Not Found</h2>
        <Link to="/" className="btn btn-outline-cyan rounded-pill px-4">
          Back to Home
        </Link>
      </div>
    );
  }

  const members = project.members && project.members.length > 0 ? project.members : [
    'Alex Johnson (Team Leader)',
    'Sophia Chen (Developer)',
    'Mark Davis (Hardware Specialist)'
  ];

  const highlights = project.highlights && project.highlights.length > 0 ? project.highlights : [
    { title: 'IoT Sensors Integration', desc: 'Continuous telemetry & data logging', icon: 'bi bi-cpu', color: 'text-cyan' },
    { title: 'AI Predictive Models', desc: 'Early contamination warning algorithms', icon: 'bi bi-diagram-3', color: 'text-success' },
    { title: 'Decentralized Verification', desc: 'Cryptographic vote integrity audit', icon: 'bi bi-shield-check', color: 'text-warning' },
    { title: 'Instant Notifications', desc: 'SMS & cloud dashboard alerts', icon: 'bi bi-bell-fill', color: 'text-danger' }
  ];

  const projectId = project._id || project.id;

  return (
    <div className="project-details-wrapper pb-5">
      {/* Hero / Details Header */}
      <section className="hero project-hero pt-5 mt-4">
        <div className="container">
          <div className="mb-3">
            <Link to="/#projects" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="fa-solid fa-arrow-left me-1"></i> Back to Projects
            </Link>
          </div>

          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="badge bg-primary fs-6 mb-3 px-3 py-2 rounded-pill">
                {project.category}
              </span>
              <h1 className="display-4 fw-bold text-white mb-3">{project.title}</h1>
              <p className="text-light fs-5 mb-4">{project.description}</p>

              <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                <span className="badge bg-dark-glass text-cyan border border-cyan fs-6 px-3 py-2 rounded-pill">
                  Project #{project.team || '01'}
                </span>
                <span className="badge bg-dark-glass text-warning border border-warning fs-6 px-3 py-2 rounded-pill">
                  Team #{project.team || '01'}
                </span>
              </div>

              <Link
                to={`/vote?id=${projectId}`}
                className="btn btn-gradient-primary btn-lg rounded-pill px-5 shadow-lg fw-bold"
              >
                <i className="fa-solid fa-check-to-slot me-2"></i> Vote For This Project
              </Link>
            </div>

            <div className="col-lg-6 text-center">
              <div className="glass-card p-3 rounded-4 position-relative">
                <img
                  src={project.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'}
                  className="img-fluid rounded-4 shadow-lg project-detail-img"
                  alt={project.title}
                  style={{ maxHeight: '380px', width: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <span className="position-absolute top-0 end-0 bg-cyan text-dark fw-bold px-3 py-1 m-3 rounded-pill small">
                  Featured Project
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Content Details */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {/* Left Column: Main Description & Key Highlights */}
            <div className="col-lg-8">
              <div className="glass-card p-4 p-md-5 rounded-4 mb-4">
                <h3 className="fw-bold text-white mb-3 border-bottom border-secondary pb-2">
                  <i className="fa-solid fa-circle-info text-cyan me-2"></i> Project Abstract
                </h3>
                <p className="text-light lead">
                  {project.longDescription ||
                    `${project.description} This innovation was engineered to solve critical real-world challenges through sustainable technology and user-centric design.`}
                </p>

                <h4 className="fw-bold text-white mt-4 mb-3">Key Technical Highlights</h4>
                <div className="row g-3 mt-2">
                  {highlights.map((h, idx) => (
                    <div key={idx} className="col-md-6">
                      <div className="p-3 rounded-3 bg-dark-glass border border-secondary d-flex align-items-center gap-3">
                        <i className={`${h.icon} fs-2 ${h.color}`}></i>
                        <div>
                          <h6 className="mb-1 text-white fw-bold">{h.title}</h6>
                          <p className="mb-0 text-light-50 small">{h.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Team Members & Info Sidebar */}
            <div className="col-lg-4">
              <div className="glass-card p-4 rounded-4 mb-4">
                <h4 className="fw-bold text-white mb-3 border-bottom border-secondary pb-2">
                  <i className="fa-solid fa-users text-cyan me-2"></i> Team Information
                </h4>

                <div className="mb-3">
                  <span className="text-secondary small d-block">Assigned Project Number</span>
                  <span className="fw-bold text-cyan fs-5">Project #{project.team || '01'}</span>
                </div>

                <div className="mb-3">
                  <span className="text-secondary small d-block">Domain / Category</span>
                  <span className="fw-semibold text-white">{project.category}</span>
                </div>

                <div className="mb-3">
                  <span className="text-secondary small d-block">Team Members</span>
                  <ul className="list-unstyled text-light mt-2">
                    {members.map((member, i) => (
                      <li key={i} className="mb-2">
                        <i className="fa-solid fa-user-check text-cyan me-2"></i> {member}
                      </li>
                    ))}
                  </ul>
                </div>

                <hr className="border-secondary" />

                <div className="text-center pt-2">
                  <Link
                    to={`/vote?id=${projectId}`}
                    className="btn btn-gradient-primary w-100 rounded-pill py-3 fw-bold"
                  >
                    <i className="fa-solid fa-vote-yea me-2"></i> Cast Vote Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
