import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/Hero';
import SearchBar from '../components/SearchBar';
import Leaderboard from '../components/Leaderboard';
import ProjectGrid from '../components/ProjectGrid';

export default function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  return (
    <main>
      <Hero />
      <SearchBar />
      <Leaderboard />
      <ProjectGrid />
    </main>
  );
}
