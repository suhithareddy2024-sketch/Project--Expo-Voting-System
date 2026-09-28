import React from 'react';
import { useExpo } from '../context/ExpoContext';

export default function Footer() {
  const { expoSettings } = useExpo();

  return (
    <footer className="footer py-5 mt-5 border-top border-secondary">
      <div className="container text-center">
        <h4 className="fw-bold text-white mb-2">
          {expoSettings.expoName} VOTING SYSTEM
        </h4>
        <p className="text-light-50 mb-4">
          Transparent, interactive and decentralized voting platform for student expos.
        </p>
        <p className="small text-secondary mb-0">
          © 2026 {expoSettings.expoName}. Built with ❤️ for Student Innovation.
        </p>
      </div>
    </footer>
  );
}
