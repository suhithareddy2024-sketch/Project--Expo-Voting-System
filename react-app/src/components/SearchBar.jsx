import React, { useState } from 'react';
import { useExpo } from '../context/ExpoContext';
import CategoryModal from './CategoryModal';

export default function SearchBar() {
  const { categories, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useExpo();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const el = document.getElementById('projects');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    const el = document.getElementById('projects');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectModalCategory = (code) => {
    setSelectedCategory(code);
    const el = document.getElementById('projects');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <section className="search-section py-4">
        <div className="container">
          <div className="text-center mb-4">
            <h3 className="fw-bold text-white mb-1">Find & Discover Innovations</h3>
            <p className="text-light-50 small">Filter by domain or search team number & project title</p>
          </div>

          {/* Horizontal Oval Search Bar Container */}
          <form className="oval-search-bar" onSubmit={handleSearchSubmit}>
            {/* Category Select Dropdown inside Search Bar */}
            <select
              className="search-category-select"
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <option value="all">All Domains</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat.code}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Search Input Group */}
            <div className="search-input-group">
              <i className="fa-solid fa-magnifying-glass text-cyan me-1"></i>
              <input
                type="text"
                placeholder="Search project name, team # or keywords..."
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-gradient-primary btn-sm rounded-pill px-3 py-1 fw-bold text-nowrap me-2 shadow"
              >
                <i className="fa-solid fa-magnifying-glass me-1"></i> Search
              </button>
            </div>

            {/* Option Catalog Trigger Button Beside Search */}
            <div className="catalog-btn-wrapper">
              <button
                type="button"
                className="btn btn-outline-cyan btn-sm rounded-pill px-3"
                onClick={() => setIsModalOpen(true)}
              >
                <i className="fa-solid fa-border-all me-1"></i> Catalog View
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Catalog Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectCategory={handleSelectModalCategory}
      />
    </>
  );
}
