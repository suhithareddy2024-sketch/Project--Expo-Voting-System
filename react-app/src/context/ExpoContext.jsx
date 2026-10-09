import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initialProjects, initialCategories, defaultExpoSettings } from '../data/projects';
import api, { getToken, getStoredUser, setAuthSession, clearAuthSession } from '../services/api';
import AuthModal from '../components/AuthModal';

const ExpoContext = createContext();

export function ExpoProvider({ children }) {
  // 1. Projects State
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Results / Leaderboard State from Backend
  const [resultsData, setResultsData] = useState({
    stats: { totalProjects: 0, totalVotes: 0, totalFeedback: 0 },
    top3: [],
    leaderboard: []
  });

  // 3. Custom Categories State (persisted in localStorage for UI customization)
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('customCategories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialCategories;
      }
    }
    return initialCategories;
  });

  // 4. Expo Headings / Settings State
  const [expoSettings, setExpoSettings] = useState(() => {
    return {
      expoCategory: localStorage.getItem('expoCategory') || defaultExpoSettings.expoCategory,
      expoName: localStorage.getItem('expoName') || defaultExpoSettings.expoName,
      expoQuote: localStorage.getItem('expoQuote') || defaultExpoSettings.expoQuote
    };
  });

  // 5. Reviews / Feedback List (Aggregated from backend)
  const [reviews, setReviews] = useState([]);

  // 6. User & Admin Authentication State
  // Strictly require a valid JWT token AND role === 'admin' for admin status
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getToken());
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    const currentToken = getToken();
    const currentUser = getStoredUser();
    return Boolean(currentToken && currentUser && currentUser.role === 'admin');
  });

  // 7. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 8. Active Animation Transition State (robot, water, ai, cyber, etc.)
  const [activeTransition, setActiveTransition] = useState(null);

  // 9. Voted projects tracking for quick UI feedback
  const [votedProjectIds, setVotedProjectIds] = useState(() => {
    const ids = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('voted_project_') && localStorage.getItem(key) === 'true') {
        ids.push(key.replace('voted_project_', ''));
      }
    }
    return ids;
  });

  // 10. Track the single global vote cast by the current user across the whole expo
  const [userVote, setUserVote] = useState({
    hasVoted: false,
    votedProjectId: null,
    votedProjectTitle: null,
    votedProjectTeam: null,
    vote: null
  });

  // 11. Auth Modal Control & Action Interception State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPendingCallback, setAuthPendingCallback] = useState(null);

  const openAuthModal = (callback = null) => {
    if (typeof callback === 'function') {
      setAuthPendingCallback(() => callback);
    } else {
      setAuthPendingCallback(null);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthPendingCallback(null);
  };

  const handleAuthModalSuccess = (authenticatedUser) => {
    if (authPendingCallback && typeof authPendingCallback === 'function') {
      const cb = authPendingCallback;
      setAuthPendingCallback(null);
      setTimeout(() => cb(authenticatedUser), 100);
    }
    fetchUserVote();
  };

  const requireAuth = (actionCallback) => {
    if (user && token) {
      if (typeof actionCallback === 'function') actionCallback();
      return true;
    }
    openAuthModal(actionCallback);
    return false;
  };

  // Normalize project object so both .id and ._id are accessible
  const normalizeProject = (p) => ({
    ...p,
    id: p._id || p.id,
    _id: p._id || p.id
  });

  // Fetch the current logged-in user's single vote status
  const fetchUserVote = useCallback(async () => {
    const currentToken = getToken();
    if (!currentToken) {
      setUserVote({
        hasVoted: false,
        votedProjectId: null,
        votedProjectTitle: null,
        votedProjectTeam: null,
        vote: null
      });
      return;
    }
    try {
      const res = await api.getMyVote();
      if (res && res.hasVoted && res.vote) {
        const vProj = res.vote.projectId;
        const vProjId = vProj?._id || vProj?.id || vProj;
        setUserVote({
          hasVoted: true,
          votedProjectId: String(vProjId),
          votedProjectTitle: vProj?.title || 'Voted Project',
          votedProjectTeam: vProj?.team || null,
          vote: res.vote
        });
        if (vProjId) {
          localStorage.setItem(`voted_project_${vProjId}`, 'true');
          setVotedProjectIds((prev) => [...new Set([...prev, String(vProjId)])]);
        }
      } else {
        setUserVote({
          hasVoted: false,
          votedProjectId: null,
          votedProjectTitle: null,
          votedProjectTeam: null,
          vote: null
        });
      }
    } catch (e) {
      console.warn('Fetch User Vote notice:', e.message);
    }
  }, []);

  // Fetch all projects and results from backend
  const fetchBackendData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, resultsRes] = await Promise.allSettled([
        api.getProjects(),
        api.getResults()
      ]);

      if (projRes.status === 'fulfilled' && projRes.value?.data) {
        const fetchedProjects = projRes.value.data.map(normalizeProject);
        setProjects(fetchedProjects);
      } else {
        console.warn('Could not load projects from backend, falling back to initial data');
        setProjects(initialProjects.map(normalizeProject));
      }

      if (resultsRes.status === 'fulfilled' && resultsRes.value) {
        setResultsData(resultsRes.value);
      }
    } catch (err) {
      console.error('Error fetching backend data:', err);
      setError(err.message);
      setProjects(initialProjects.map(normalizeProject));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load & Session Check
  useEffect(() => {
    fetchBackendData();
    const checkUserSession = async () => {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            setIsAdminLoggedIn(res.user.role === 'admin');
          }
          await fetchUserVote();
        } catch (e) {
          console.warn('Session check note:', e.message);
        }
      }
    };
    checkUserSession();
  }, [fetchBackendData, fetchUserVote]);

  // Sync settings & categories to localStorage
  useEffect(() => {
    localStorage.setItem('customCategories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('expoCategory', expoSettings.expoCategory);
    localStorage.setItem('expoName', expoSettings.expoName);
    localStorage.setItem('expoQuote', expoSettings.expoQuote);
  }, [expoSettings]);

  // ==========================================
  // AUTHENTICATION METHODS
  // ==========================================

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res.token && res.user) {
        setAuthSession(res.token, res.user);
        setToken(res.token);
        setUser(res.user);
        setIsAdminLoggedIn(res.user.role === 'admin');
        await fetchUserVote();
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const sendOtp = async (email) => {
    try {
      const res = await api.sendOtp(email);
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to send OTP' };
    }
  };

  const verifyOtp = async (email, otp, name = '', password = '') => {
    try {
      const res = await api.verifyOtp(email, otp, name, password);
      if (res.token && res.user) {
        setAuthSession(res.token, res.user);
        setToken(res.token);
        setUser(res.user);
        setIsAdminLoggedIn(res.user.role === 'admin');
        await fetchUserVote();
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'OTP verification failed' };
    } catch (err) {
      return { success: false, message: err.message || 'OTP verification failed' };
    }
  };

  const register = async (name, email, password, role = 'user') => {
    try {
      const res = await api.register(name, email, password, role);
      if (res.token && res.user) {
        setAuthSession(res.token, res.user);
        setToken(res.token);
        setUser(res.user);
        setIsAdminLoggedIn(res.user.role === 'admin');
        await fetchUserVote();
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Invalid registration response' };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const loginAdmin = async (emailOrUsername, password) => {
    const email = emailOrUsername ? emailOrUsername.trim().toLowerCase() : '';
    try {
      const res = await api.loginAdmin(email, password);
      if (res.token && res.user && res.user.role === 'admin') {
        setAuthSession(res.token, res.user);
        setToken(res.token);
        setUser(res.user);
        setIsAdminLoggedIn(true);
        await fetchUserVote();
        return { success: true, user: res.user };
      } else if (res.user && res.user.role !== 'admin') {
        return { success: false, message: 'Access denied: User is not an admin' };
      }
      return { success: false, message: 'Invalid admin credentials' };
    } catch (err) {
      return { success: false, message: err.message || 'Admin login failed' };
    }
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setToken(null);
    setIsAdminLoggedIn(false);
    setUserVote({
      hasVoted: false,
      votedProjectId: null,
      votedProjectTitle: null,
      votedProjectTeam: null,
      vote: null
    });
  };

  const logoutAdmin = () => {
    logout();
  };

  // ==========================================
  // VOTING & FEEDBACK METHODS
  // ==========================================

  // Cast the 1 official vote allowed per user
  const castVote = async (projectId, voteData) => {
    try {
      const currentToken = getToken();
      if (!currentToken) {
        throw new Error('Please log in or authenticate before casting a vote.');
      }

      // Check client-side if already voted
      if (userVote.hasVoted) {
        if (String(userVote.votedProjectId) === String(projectId)) {
          throw new Error('You have already cast your official vote for this project.');
        } else {
          throw new Error(`You have already cast your single allowed vote for "${userVote.votedProjectTitle || 'another project'}". Each participant is limited to 1 official vote across the entire expo. You can still submit feedback!`);
        }
      }

      // 1. Submit Vote to MongoDB
      const voteRes = await api.castVote({
        projectId,
        rating: voteData.rating || 5,
        appreciation: voteData.appreciation || '',
        review: voteData.review || '',
        suggestion: voteData.suggestion || ''
      });

      // 2. Mark voted locally and update state
      localStorage.setItem(`voted_project_${projectId}`, 'true');
      setVotedProjectIds((prev) => [...new Set([...prev, String(projectId)])]);
      
      const targetProj = projects.find((p) => String(p._id || p.id) === String(projectId));
      setUserVote({
        hasVoted: true,
        votedProjectId: String(projectId),
        votedProjectTitle: targetProj?.title || 'Voted Project',
        votedProjectTeam: targetProj?.team || null,
        vote: voteRes.data
      });

      if (user) {
        const updatedUser = { ...user, hasVoted: true, votedProjectId: projectId };
        setUser(updatedUser);
        setAuthSession(currentToken, updatedUser);
      }

      // 3. Update project vote count locally & refresh results
      setProjects((prev) =>
        prev.map((p) =>
          (p._id === projectId || p.id === projectId)
            ? { ...p, votes: (p.votes || 0) + 1 }
            : p
        )
      );

      // Refresh database data in background
      fetchBackendData();

      return { success: true, data: voteRes.data };
    } catch (err) {
      console.error('Error casting vote:', err);
      throw err;
    }
  };

  // Submit feedback/review for ANY project (multiple projects allowed)
  const submitFeedback = async (projectId, feedbackData) => {
    try {
      const currentToken = getToken();
      if (!currentToken) {
        throw new Error('Please log in or authenticate before submitting feedback.');
      }

      const msg = feedbackData.message || [feedbackData.appreciation, feedbackData.review, feedbackData.suggestion].filter(Boolean).join(' | ');

      const res = await api.submitFeedback({
        projectId,
        rating: feedbackData.rating || 5,
        message: msg,
        appreciation: feedbackData.appreciation || '',
        review: feedbackData.review || '',
        suggestion: feedbackData.suggestion || ''
      });

      fetchBackendData();
      return { success: true, data: res.data, message: res.message };
    } catch (err) {
      console.error('Error submitting feedback:', err);
      throw err;
    }
  };

  const hasVotedForProject = (projectId) => {
    if (!projectId) return false;
    return (
      (userVote.hasVoted && String(userVote.votedProjectId) === String(projectId)) ||
      votedProjectIds.includes(String(projectId)) ||
      localStorage.getItem(`voted_project_${projectId}`) === 'true'
    );
  };

  const checkUserVotedOnBackend = async (projectId) => {
    const currentToken = getToken();
    if (!currentToken || !projectId) return false;
    try {
      const res = await api.checkUserVoted(projectId);
      if (res.hasVotedAnywhere) {
        setUserVote({
          hasVoted: true,
          votedProjectId: String(res.votedProjectId),
          votedProjectTitle: res.votedProjectTitle,
          votedProjectTeam: res.votedProjectTeam,
          vote: res.vote
        });
      }
      if (res.hasVoted || res.hasVotedForThisProject) {
        localStorage.setItem(`voted_project_${projectId}`, 'true');
        setVotedProjectIds((prev) => [...new Set([...prev, String(projectId)])]);
        return true;
      }
      return false;
    } catch (e) {
      return hasVotedForProject(projectId);
    }
  };

  // ==========================================
  // PROJECT CRUD (ADMIN)
  // ==========================================

  const addProject = async (projectData) => {
    try {
      const currentToken = getToken();
      if (!currentToken) {
        setIsAdminLoggedIn(false);
        throw new Error('Admin authorization token is missing. Please log in again.');
      }

      const res = await api.createProject(projectData);
      if (res.data) {
        setProjects((prev) => [normalizeProject(res.data), ...prev]);
        fetchBackendData();
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Failed to create project' };
    } catch (err) {
      console.error('Error adding project:', err);
      if (err.status === 401 || err.status === 403) {
        logoutAdmin();
      }
      throw err;
    }
  };

  const updateProject = async (id, updatedData) => {
    try {
      const currentToken = getToken();
      if (!currentToken) {
        setIsAdminLoggedIn(false);
        throw new Error('Admin authorization token is missing. Please log in again.');
      }

      const res = await api.updateProject(id, updatedData);
      if (res.data) {
        const normalized = normalizeProject(res.data);
        setProjects((prev) =>
          prev.map((p) => (p._id === id || p.id === id ? normalized : p))
        );
        fetchBackendData();
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Failed to update project' };
    } catch (err) {
      console.error('Error updating project:', err);
      if (err.status === 401 || err.status === 403) {
        logoutAdmin();
      }
      throw err;
    }
  };

  const deleteProject = async (id) => {
    try {
      const currentToken = getToken();
      if (!currentToken) {
        setIsAdminLoggedIn(false);
        throw new Error('Admin authorization token is missing. Please log in again.');
      }

      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id && p.id !== id));
      fetchBackendData();
      return { success: true };
    } catch (err) {
      console.error('Error deleting project:', err);
      if (err.status === 401 || err.status === 403) {
        logoutAdmin();
      }
      throw err;
    }
  };

  const resetAllVotes = () => {
    setProjects((prev) => prev.map((p) => ({ ...p, votes: 0 })));
  };

  const clearAllProjects = () => {
    setProjects([]);
  };

  // ==========================================
  // EVENT HEADINGS & CATEGORIES
  // ==========================================

  const updateExpoHeadings = (category, name, quote) => {
    setExpoSettings({
      expoCategory: category,
      expoName: name,
      expoQuote: quote
    });
  };

  const addCategory = (newCat) => {
    setCategories((prev) => [...prev, newCat]);
  };

  const deleteCategory = (index) => {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  // ==========================================
  // ANIMATIONS & TRANSITIONS
  // ==========================================

  const getCategoryAnimation = (category) => {
    const categoryMap = {
      'AI': 'premium-water-splash',
      'Artificial Intelligence': 'premium-water-splash',
      'IoT': 'premium-smart-irrigation',
      'IoT & Smart Systems': 'premium-smart-irrigation',
      'Robotics': 'premium-robotics-rescue',
      'Robotics & Automation': 'premium-robotics-rescue',
      'Cyber Security': 'premium-biometric-security',
      'Healthcare': 'health',
      'Healthcare & BioTech': 'health',
      'Agriculture': 'agriculture',
      'Agriculture & Environment': 'agriculture',
      'Blockchain': 'blockchain',
      'Blockchain & Web3': 'blockchain'
    };
    return categoryMap[category] || 'premium-water-splash';
  };

  const triggerCategoryAnimation = (category, onComplete) => {
    setActiveTransition(null);
    if (onComplete) onComplete();
  };

  const triggerTransition = (categoryAndTitle, onComplete) => {
    setActiveTransition(null);
    if (onComplete) onComplete();
  };

  return (
    <ExpoContext.Provider
      value={{
        projects,
        loading,
        error,
        resultsData,
        categories,
        expoSettings,
        reviews,
        user,
        token,
        userVote,
        isAuthenticated: Boolean(user && token),
        isVerified: Boolean(user && user.isVerified),
        isAdminLoggedIn,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        activeTransition,
        login,
        sendOtp,
        verifyOtp,
        register,
        loginAdmin,
        logout,
        logoutAdmin,
        castVote,
        submitFeedback,
        fetchUserVote,
        hasVotedForProject,
        checkUserVotedOnBackend,
        updateExpoHeadings,
        addCategory,
        deleteCategory,
        addProject,
        updateProject,
        deleteProject,
        resetAllVotes,
        clearAllProjects,
        fetchBackendData,
        triggerTransition,
        triggerCategoryAnimation,
        getCategoryAnimation,
        setActiveTransition,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        requireAuth
      }}
    >
      {children}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onSuccess={handleAuthModalSuccess}
      />
    </ExpoContext.Provider>
  );
}

export function useExpo() {
  const context = useContext(ExpoContext);
  if (!context) {
    throw new Error('useExpo must be used within an ExpoProvider');
  }
  return context;
}
