import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExpo } from '../context/ExpoContext';

export default function AdminPage() {
  const {
    projects,
    categories,
    expoSettings,
    reviews,
    resultsData,
    isAdminLoggedIn,
    loginAdmin,
    logoutAdmin,
    updateExpoHeadings,
    addCategory,
    deleteCategory,
    addProject,
    updateProject,
    deleteProject,
    resetAllVotes,
    clearAllProjects
  } = useExpo();

  // Login form state
  const [username, setUsername] = useState('admin@expo.com');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Event settings form state
  const [headingCategory, setHeadingCategory] = useState(expoSettings.expoCategory);
  const [headingName, setHeadingName] = useState(expoSettings.expoName);
  const [headingQuote, setHeadingQuote] = useState(expoSettings.expoQuote);

  // Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');

  // Project form state
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectCategory, setProjectCategory] = useState(categories[0]?.name || categories[0]?.code || 'AI');
  const [teamNumber, setTeamNumber] = useState('');
  const [projectImage, setProjectImage] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectLongDescription, setProjectLongDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Table search
  const [tableSearch, setTableSearch] = useState('');

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await loginAdmin(username.trim(), password);
      if (!res.success) {
        setLoginError(res.message || 'Invalid Admin Email or Password. Use admin@expo.com / admin123');
      }
    } catch (err) {
      setLoginError(err.message || 'Admin login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Save Expo Settings
  const handleSaveHeadings = (e) => {
    e.preventDefault();
    updateExpoHeadings(headingCategory, headingName, headingQuote);
    alert('Event Headings & Category Updated Successfully!');
  };

  // Add Category
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatCode.trim()) {
      alert('Please enter Category Name and Tag Code.');
      return;
    }

    if (
      categories.some(
        (c) =>
          c.code.toLowerCase() === newCatCode.trim().toLowerCase() ||
          c.name.toLowerCase() === newCatName.trim().toLowerCase()
      )
    ) {
      alert('A category with this name or code already exists.');
      return;
    }

    addCategory({
      name: newCatName.trim(),
      code: newCatCode.trim(),
      icon: 'fa-folder'
    });

    setNewCatName('');
    setNewCatCode('');
    alert(`Category "${newCatName}" Added Successfully!`);
  };

  // Save/Edit Project
  const handleSaveProject = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!projectTitle.trim() || !teamNumber.trim()) {
      setFormError('Please fill in Project Title and Team Number.');
      return;
    }

    const payload = {
      title: projectTitle.trim(),
      category: projectCategory,
      team: teamNumber.trim(),
      image:
        projectImage.trim() ||
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      description: projectDescription.trim(),
      longDescription: projectLongDescription.trim() || undefined
    };

    setFormLoading(true);
    try {
      if (editingProjectId) {
        await updateProject(editingProjectId, payload);
        setEditingProjectId(null);
        alert('Project Updated in Database Successfully!');
      } else {
        await addProject(payload);
        alert('Project Created in MongoDB Successfully!');
      }

      setProjectTitle('');
      setTeamNumber('');
      setProjectImage('');
      setProjectDescription('');
      setProjectLongDescription('');
    } catch (err) {
      setFormError(err.message || 'Error saving project');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (p) => {
    const id = p._id || p.id;
    setEditingProjectId(id);
    setProjectTitle(p.title);
    setProjectCategory(p.category);
    setTeamNumber(p.team);
    setProjectImage(p.image || '');
    setProjectDescription(p.description || '');
    setProjectLongDescription(p.longDescription || '');

    const formEl = document.getElementById('projectManager');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project and its associated votes from MongoDB?')) {
      try {
        await deleteProject(id);
        alert('Project deleted successfully from database.');
      } catch (err) {
        alert(`Failed to delete project: ${err.message}`);
      }
    }
  };

  const handleExportJSON = () => {
    const report = {
      ExpoCategory: expoSettings.expoCategory,
      ExpoTitle: expoSettings.expoName,
      TotalProjectsCount: projects.length,
      TotalVotesCount: totalVotes,
      TotalFeedbackCount: resultsData?.stats?.totalFeedback || reviews.length,
      Leaderboard: resultsData?.leaderboard || projects,
      Projects: projects,
      Reviews: reviews,
      ExportedAt: new Date().toISOString(),
      DatabaseSource: 'MongoDB'
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Expo_Voting_MongoDB_Report_${Date.now()}.json`;
    a.click();
  };

  const handleResetVotes = () => {
    if (window.confirm('Reset votes for all projects in view to 0?')) {
      resetAllVotes();
      alert('Local votes view reset.');
    }
  };

  const handleClearAllProjects = () => {
    if (window.confirm('WARNING: Clear project view list?')) {
      clearAllProjects();
      alert('Projects view cleared.');
    }
  };

  const totalVotes =
    resultsData?.stats?.totalVotes ||
    projects.reduce((acc, p) => acc + (p.votes || 0), 0);

  const totalFeedbackCount =
    resultsData?.stats?.totalFeedback || reviews.length;

  const filteredProjects = projects.filter((p) => {
    const q = tableSearch.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.team || '').toLowerCase().includes(q) ||
      String(p._id || p.id || '').toLowerCase().includes(q)
    );
  });

  // If not logged in as Admin, render login form
  if (!isAdminLoggedIn) {
    return (
      <div className="container py-5 mt-5">
        <div className="admin-login-box p-4 rounded-4 glass-card shadow-lg mx-auto">
          <div className="text-center mb-4">
            <i className="fa-solid fa-user-shield fs-1 text-cyan mb-2"></i>
            <h3 className="fw-bold text-white">Admin Authentication</h3>
            <p className="text-light-50 small">
              Default Admin: <code>admin@expo.com</code> | password <code>admin123</code>
            </p>
          </div>
          {loginError && (
            <div className="alert alert-danger p-2 small mb-3 text-center">{loginError}</div>
          )}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label text-light">Admin Email / Username</label>
              <input
                type="text"
                className="form-control glass-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label text-light">Password</label>
              <input
                type="password"
                className="form-control glass-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-gradient-primary w-100 py-3 rounded-pill fw-bold"
              disabled={loginLoading}
            >
              {loginLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Verifying Admin Credentials...
                </>
              ) : (
                'Login to Control Panel'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="admin-wrapper d-flex min-vh-100 mt-5 pt-3">
      {/* Sidebar */}
      <div className="admin-sidebar p-4 d-none d-md-block">
        <div className="d-flex align-items-center gap-2 mb-4 pb-3 border-bottom border-secondary">
          <i className="fa-solid fa-cube text-cyan fs-3"></i>
          <h5 className="fw-bold mb-0 text-white">Expo Admin</h5>
        </div>
        <ul className="nav nav-pills flex-column gap-2">
          <li className="nav-item">
            <a href="#overview" className="nav-link active bg-primary text-white rounded-pill px-3">
              <i className="fa-solid fa-gauge me-2"></i> Overview
            </a>
          </li>
          <li className="nav-item">
            <a href="#eventSettings" className="nav-link text-light rounded-pill px-3">
              <i className="fa-solid fa-gear me-2"></i> Event Settings
            </a>
          </li>
          <li className="nav-item">
            <a href="#categoryManager" className="nav-link text-light rounded-pill px-3">
              <i className="fa-solid fa-list-check me-2"></i> Categories
            </a>
          </li>
          <li className="nav-item">
            <a href="#projectManager" className="nav-link text-light rounded-pill px-3">
              <i className="fa-solid fa-folder-plus me-2"></i> Manage Projects
            </a>
          </li>
          <li className="nav-item mt-4">
            <Link to="/" className="nav-link text-cyan rounded-pill px-3">
              <i className="fa-solid fa-eye me-2"></i> View Live Site
            </Link>
          </li>
          <li className="nav-item">
            <button className="btn btn-outline-danger w-100 rounded-pill mt-3" onClick={logoutAdmin}>
              <i className="fa-solid fa-right-from-bracket me-2"></i> Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Header Bar */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold text-white mb-0">Admin Command Center</h2>
            <p className="text-light-50 mb-0">Connected to MongoDB backend database with JWT authorization</p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/" className="btn btn-outline-light rounded-pill px-4">
              <i className="fa-solid fa-house me-2"></i> Live Homepage
            </Link>
            <button className="btn btn-outline-danger rounded-pill px-3 d-md-none" onClick={logoutAdmin}>
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="row g-3 mb-4" id="overview">
          <div className="col-md-4">
            <div className="stat-box">
              <i className="fa-solid fa-diagram-project fs-2 text-cyan mb-2"></i>
              <h2 className="fw-bold text-white mb-0">{projects.length}</h2>
              <span className="text-secondary small">Total Projects in DB</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-box">
              <i className="fa-solid fa-vote-yea fs-2 text-warning mb-2"></i>
              <h2 className="fw-bold text-white mb-0">{totalVotes}</h2>
              <span className="text-secondary small">Total Real Votes Cast</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-box">
              <i className="fa-solid fa-comments fs-2 text-success mb-2"></i>
              <h2 className="fw-bold text-white mb-0">{totalFeedbackCount}</h2>
              <span className="text-secondary small">Feedback Reviews Logged</span>
            </div>
          </div>
        </div>

        {/* Event Configuration Settings */}
        <div className="glass-card p-4 rounded-4 mb-4" id="eventSettings">
          <h4 className="fw-bold text-white mb-3 border-bottom border-secondary pb-2">
            <i className="fa-solid fa-pen-nib text-cyan me-2"></i> Event Heading & Category Setup
          </h4>
          <form onSubmit={handleSaveHeadings}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label text-light">Heading 1 (Event Category)</label>
                <select
                  className="form-select glass-input"
                  value={headingCategory}
                  onChange={(e) => setHeadingCategory(e.target.value)}
                >
                  <option value="PROJECT EXPO">PROJECT EXPO</option>
                  <option value="SCIENCE FAIR">SCIENCE FAIR</option>
                  <option value="STUDENT ELECTION">STUDENT ELECTION</option>
                  <option value="LEADER SELECTION">LEADER SELECTION</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label text-light">Heading 2 (Main Event Title)</label>
                <input
                  type="text"
                  className="form-control glass-input"
                  value={headingName}
                  onChange={(e) => setHeadingName(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label text-light">Quote Phrase</label>
                <input
                  type="text"
                  className="form-control glass-input"
                  value={headingQuote}
                  onChange={(e) => setHeadingQuote(e.target.value)}
                />
              </div>
              <div className="col-12 text-end">
                <button type="submit" className="btn btn-cyan rounded-pill px-4 fw-bold">
                  <i className="fa-solid fa-floppy-disk me-2"></i> Save Event Headings
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Manage Project Categories */}
        <div className="glass-card p-4 rounded-4 mb-4" id="categoryManager">
          <h4 className="fw-bold text-white mb-3 border-bottom border-secondary pb-2">
            <i className="fa-solid fa-list-check text-cyan me-2"></i> Manage Project Categories
          </h4>
          <form onSubmit={handleAddCategory}>
            <div className="row g-3 mb-4">
              <div className="col-md-5">
                <label className="form-label text-light">Category Name *</label>
                <input
                  type="text"
                  className="form-control glass-input"
                  placeholder="e.g. Drone Technology"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label text-light">Short Tag / Code *</label>
                <input
                  type="text"
                  className="form-control glass-input"
                  placeholder="e.g. Drones"
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value)}
                />
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button type="submit" className="btn btn-cyan w-100 rounded-pill fw-bold py-2">
                  <i className="fa-solid fa-plus me-1"></i> Add Category
                </button>
              </div>
            </div>
          </form>

          {/* Active Categories List Table */}
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Tag Code</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr key={index}>
                    <td className="fw-bold text-white">
                      <i className={`fa-solid ${cat.icon || 'fa-folder'} text-cyan me-2`}></i>
                      {cat.name}
                    </td>
                    <td>
                      <span className="badge bg-primary">{cat.code}</span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteCategory(index)}
                      >
                        <i className="fa-solid fa-trash"></i> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add / Edit Project Form */}
        <div className="glass-card p-4 rounded-4 mb-4" id="projectManager">
          <h4 className="fw-bold text-white mb-3 border-bottom border-secondary pb-2">
            <i className="fa-solid fa-plus-circle text-cyan me-2"></i>{' '}
            {editingProjectId ? 'Edit Project (MongoDB)' : 'Add New Project (MongoDB)'}
          </h4>
          {formError && (
            <div className="alert alert-danger p-2 small mb-3">{formError}</div>
          )}
          <form onSubmit={handleSaveProject}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-light">Project Title *</label>
                <input
                  type="text"
                  className="form-control glass-input"
                  placeholder="e.g. AI Water Detection System"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label text-light">Domain / Category *</label>
                <select
                  className="form-select glass-input"
                  value={projectCategory}
                  onChange={(e) => setProjectCategory(e.target.value)}
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat.name || cat.code}>
                      {cat.name} ({cat.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label text-light">Assigned Project # / Team # *</label>
                <input
                  type="text"
                  className="form-control glass-input"
                  placeholder="e.g. 21"
                  value={teamNumber}
                  onChange={(e) => setTeamNumber(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-12">
                <label className="form-label text-light">Project Image URL (Optional)</label>
                <input
                  type="text"
                  className="form-control glass-input"
                  placeholder="e.g. https://images.unsplash.com/..."
                  value={projectImage}
                  onChange={(e) => setProjectImage(e.target.value)}
                />
              </div>
              <div className="col-md-12">
                <label className="form-label text-light">Short Summary Description</label>
                <textarea
                  className="form-control glass-input"
                  rows="2"
                  placeholder="Brief project summary..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="col-md-12">
                <label className="form-label text-light">Long Detailed Description / Abstract (Optional)</label>
                <textarea
                  className="form-control glass-input"
                  rows="3"
                  placeholder="Detailed project explanation for details page..."
                  value={projectLongDescription}
                  onChange={(e) => setProjectLongDescription(e.target.value)}
                ></textarea>
              </div>
              <div className="col-12 text-end d-flex justify-content-end gap-2">
                {editingProjectId && (
                  <button
                    type="button"
                    className="btn btn-outline-light rounded-pill px-4"
                    onClick={() => {
                      setEditingProjectId(null);
                      setProjectTitle('');
                      setTeamNumber('');
                      setProjectImage('');
                      setProjectDescription('');
                      setProjectLongDescription('');
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-gradient-primary rounded-pill px-4 fw-bold"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving to MongoDB...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-plus me-2"></i>{' '}
                      {editingProjectId ? 'Update in Database' : 'Save Project to Database'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Existing Projects List Table */}
        <div className="glass-card p-4 rounded-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h4 className="fw-bold text-white mb-0">Project Directory (Database)</h4>
            <input
              type="text"
              className="form-control glass-input w-auto"
              placeholder="Search table..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </div>
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle">
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Project Title</th>
                  <th>Category</th>
                  <th>Team #</th>
                  <th>Votes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => {
                  const id = p._id || p.id;
                  const displayId = String(id).length > 8 ? `${String(id).slice(0, 6)}...` : id;
                  return (
                    <tr key={id}>
                      <td>
                        <span className="badge bg-secondary font-monospace">#{displayId}</span>
                      </td>
                      <td className="fw-bold text-white">{p.title}</td>
                      <td>
                        <span className="badge bg-primary">{p.category}</span>
                      </td>
                      <td>Team #{p.team}</td>
                      <td>
                        <span className="text-warning fw-bold">{p.votes || 0}</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-warning btn-sm me-2"
                          onClick={() => handleEditClick(p)}
                          title="Edit Project"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteProject(id)}
                          title="Delete Project"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Actions: Export & Reset */}
        <div className="d-flex gap-3 flex-wrap">
          <button className="btn btn-outline-info rounded-pill px-4" onClick={handleExportJSON}>
            <i className="fa-solid fa-file-export me-2"></i> Export Database JSON Report
          </button>
          <button className="btn btn-outline-warning rounded-pill px-4" onClick={handleResetVotes}>
            <i className="fa-solid fa-rotate-left me-2"></i> Reset View Votes
          </button>
          <button className="btn btn-outline-danger rounded-pill px-4" onClick={handleClearAllProjects}>
            <i className="fa-solid fa-trash me-2"></i> Clear Project View
          </button>
        </div>
      </div>
    </div>
  );
}
