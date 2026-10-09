import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpo } from '../context/ExpoContext';
import { getProjectImage } from '../constants/categoryConfig';
import { LiquidViewProjectButton } from './ui/LiquidViewProjectButton';

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  const projectId = project._id || project.id;

  const handleViewProject = (e) => {
    e?.preventDefault?.();
    navigate(`/project/${projectId}`);
  };

  const projectImage = getProjectImage(project);

  return (
    <div className="col-lg-4 col-md-6 project-col">
      <div className="project-card">
        <div className="project-img-wrapper">
          <img
            src={projectImage}
            alt={project.title}
            className="img-fluid"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <span className="project-num-badge">Project #{project.team}</span>
        </div>
        <div className="project-content">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="badge bg-primary px-3 py-1 rounded-pill project-badge">
              {project.category}
            </span>
            <span className="text-cyan small fw-semibold">
              <i className="fa-solid fa-heart me-1"></i> {project.votes || 0} {Number(project.votes || 0) === 1 ? 'Vote' : 'Votes'}
            </span>
          </div>
          <h4 className="fw-bold text-white mt-1 project-title">{project.title}</h4>
          <p className="text-light-50 small project-desc flex-grow-1">{project.description}</p>
          <div className="pt-3 border-top border-secondary d-flex justify-content-between align-items-center">
            <span className="text-secondary small project-team">Team #{project.team}</span>
            <LiquidViewProjectButton
              onClick={handleViewProject}
              text="View Project"
              className="project-view-btn"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
