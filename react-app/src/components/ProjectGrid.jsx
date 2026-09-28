import React from 'react';
import { useExpo } from '../context/ExpoContext';
import ProjectCard from './ProjectCard';

export default function ProjectGrid() {
  const { projects, searchQuery, selectedCategory, loading } = useExpo();

  const query = (searchQuery || '').toLowerCase().trim();
  const categoryFilter = (selectedCategory || 'all').toLowerCase().trim();

  const filteredProjects = projects.filter((p) => {
    const title = (p.title || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const team = (p.team || '').toLowerCase();
    const category = (p.category || '').toLowerCase();

    const matchesQuery =
      !query ||
      title.includes(query) ||
      desc.includes(query) ||
      team.includes(query) ||
      `project #${team}`.includes(query);

    const matchesCategory =
      categoryFilter === 'all' || category.includes(categoryFilter);

    return matchesQuery && matchesCategory;
  });

  return (
    <section id="projects" className="projects-section py-5">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold text-white mb-1">Participating Projects</h2>
            <p className="text-light-50 mb-0">Explore and vote for your favorite projects</p>
          </div>
          <span className="badge bg-cyan text-dark fw-bold px-3 py-2 rounded-pill">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>

        {/* Loading Indicator */}
        {loading && projects.length === 0 ? (
          <div className="text-center py-5">
            <div className="spinner-border text-cyan mb-3" role="status">
              <span className="visually-hidden">Loading projects...</span>
            </div>
            <p className="text-light-50">Retrieving projects from MongoDB...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="row g-4">
            {filteredProjects.map((project) => (
              <ProjectCard key={project._id || project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <i className="fa-solid fa-folder-open fs-1 text-secondary mb-3"></i>
            <h4 className="text-white">No Projects Found</h4>
            <p className="text-light-50">Try searching for a different keyword or category.</p>
          </div>
        )}
      </div>
    </section>
  );
}
