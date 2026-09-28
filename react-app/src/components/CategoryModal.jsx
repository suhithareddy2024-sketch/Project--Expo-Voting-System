import React from 'react';
import { useExpo } from '../context/ExpoContext';

export default function CategoryModal({ isOpen, onClose, onSelectCategory }) {
  const { categories } = useExpo();

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content glass-card border-cyan">
          <div className="modal-header border-secondary">
            <h5 className="modal-title fw-bold text-white">
              <i className="fa-solid fa-list-check text-cyan me-2"></i> Project Categories Catalog
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body p-4">
            <p className="text-light small mb-4">
              Click any category below to quickly filter interest fields:
            </p>

            <div className="row g-3 catalog-grid">
              {categories.map((cat, idx) => (
                <div key={idx} className="col-md-4 col-6">
                  <div
                    className="catalog-item p-3 rounded-3 text-center glass-card cursor-pointer"
                    onClick={() => {
                      onSelectCategory(cat.code);
                      onClose();
                    }}
                  >
                    <i className={`fa-solid ${cat.icon || 'fa-folder'} fs-2 text-cyan mb-2`}></i>
                    <h6 className="text-white mb-0">{cat.name}</h6>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
