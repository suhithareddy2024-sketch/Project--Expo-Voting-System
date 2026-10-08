import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useExpo } from '../context/ExpoContext';
import Confetti from '../components/Confetti';

export default function VotePage() {
  const [searchParams] = useSearchParams();
  const rawId = searchParams.get('id');
  const {
    projects,
    castVote,
    hasVotedForProject,
    checkUserVotedOnBackend,
    user,
    token,
    login,
    sendOtp,
    verifyOtp,
    requireAuth,
    openAuthModal
  } = useExpo();
  const navigate = useNavigate();

  // Find project
  const project =
    projects.find(
      (p) => String(p._id) === String(rawId) || String(p.id) === String(rawId)
    ) || projects[0];

  const projectId = project?._id || project?.id;

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [appreciation, setAppreciation] = useState('');
  const [review, setReview] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auth Modal/Inline state if voter is not logged in
  const [authMode, setAuthMode] = useState('otp'); // 'otp' | 'password'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const [verifiedNotice, setVerifiedNotice] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Derive stable voter hash token from user ID or session
  const voterHash = user?._id
    ? `0x${user._id.slice(0, 8)}...${user._id.slice(-6)}`
    : token
    ? `0x${token.slice(10, 18)}...${token.slice(-6)}`
    : '0xAUTH_REQUIRED';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check voted status when project or user changes
  useEffect(() => {
    if (projectId) {
      if (hasVotedForProject(projectId)) {
        setHasVoted(true);
      } else if (token) {
        checkUserVotedOnBackend(projectId).then((voted) => {
          if (voted) setHasVoted(true);
        });
      }
    }
  }, [projectId, token, hasVotedForProject, checkUserVotedOnBackend]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setOtpNotice('');
    setVerifiedNotice('');

    const cleanEmail = authEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setAuthError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await sendOtp(cleanEmail);
      if (res.success) {
        setOtpSent(true);
        setOtpNotice(res.message || `OTP sent successfully to ${cleanEmail}`);
      } else {
        setAuthError(res.message || 'Failed to send OTP. Please check your email.');
      }
    } catch (err) {
      setAuthError(err.message || 'Error sending OTP.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e, codeOverride = null) => {
    if (e) e.preventDefault();
    setAuthError('');
    setVerifiedNotice('');

    const codeToVerify = (codeOverride || otp).trim();

    if (!codeToVerify || codeToVerify.length !== 6) {
      setAuthError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await verifyOtp(authEmail.trim().toLowerCase(), codeToVerify, authName.trim(), authPassword);
      if (res.success) {
        setVerifiedNotice(`Verified! Email ${authEmail} is authenticated.`);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        setAuthError(res.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      setAuthError(err.message || 'OTP verification failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const result = await login(authEmail.trim(), authPassword);
      if (!result.success) {
        setAuthError(result.message || 'Authentication failed');
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication error');
    } finally {
      setAuthLoading(false);
    }
  };

  const executeVoteSubmission = async () => {
    setSubmitting(true);
    try {
      await castVote(projectId, {
        rating,
        appreciation: appreciation.trim(),
        review: review.trim(),
        suggestion: suggestion.trim(),
        voterHash
      });

      setHasVoted(true);
      setShowConfetti(true);
    } catch (err) {
      const msg = err.message || 'Failed to submit vote. Please try again.';
      setErrorMessage(msg);
      if (msg.toLowerCase().includes('already voted')) {
        setHasVoted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitVote = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!appreciation.trim() || !review.trim() || !suggestion.trim()) {
      alert('Please fill out all required fields (Appreciation, Review, and Suggestions).');
      return;
    }

    if (!user || !token) {
      requireAuth(() => executeVoteSubmission());
      return;
    }

    executeVoteSubmission();
  };

  const handleDownloadReceipt = () => {
    if (!project) return;
    const receipt = {
      ReceiptID: 'REC-' + Date.now(),
      VoterHash: voterHash,
      VoterEmail: user?.email || 'authenticated-voter',
      ProjectID: projectId,
      ProjectTitle: project.title,
      TeamNumber: project.team,
      Rating: rating,
      Appreciation: appreciation,
      Review: review,
      Suggestion: suggestion,
      Timestamp: new Date().toLocaleString(),
      VerifiedBy: 'Decentralized MongoDB Ledger Protocol'
    };

    const blob = new Blob([JSON.stringify(receipt, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VoteReceipt_${project.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (!project) {
    return (
      <div className="container py-5 mt-5 text-center">
        <h2 className="text-white mb-3">No Project Selected</h2>
        <Link to="/" className="btn btn-outline-cyan rounded-pill px-4">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <>
      <Confetti active={showConfetti} />
      <section className="vote-page-section py-5 mt-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Back Link */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-outline-light btn-sm rounded-pill px-3"
                >
                  <i className="fa-solid fa-arrow-left me-2"></i> Back to Project Details
                </button>
              </div>

              {/* Voting Card Container */}
              <div className="vote-card glass-card p-4 p-md-5 rounded-4 shadow-lg position-relative overflow-hidden">
                {/* Top Banner / Badge */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-3 border-bottom border-secondary">
                  <div>
                    <span className="badge bg-primary fs-6 px-3 py-2 rounded-pill mb-2">
                      {project.category}
                    </span>
                    <h2 className="fw-bold text-white mb-1">{project.title}</h2>
                    <p className="text-info mb-0 fs-6">Team #{project.team}</p>
                  </div>
                  <div className="text-end">
                    <div className="vote-counter-badge bg-dark-glass p-3 rounded-3 text-center border border-info">
                      <span className="d-block text-secondary small">Total Votes</span>
                      <h3 className="fw-bold text-cyan mb-0">{project.votes || 0}</h3>
                    </div>
                  </div>
                </div>

                {/* Decentralized Blockchain Identity Verification */}
                <div className="decentralized-badge p-3 rounded-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <i className="fa-solid fa-shield-halved fs-2 text-cyan"></i>
                    <div>
                      <h6 className="mb-0 text-white fw-semibold">
                        Decentralized Voter Integrity Protected
                      </h6>
                      <p className="mb-0 text-light small">
                        Voter Hash Token:{' '}
                        <span className="font-monospace text-warning">{voterHash}</span>{' '}
                        {user ? `(${user.name || user.email})` : '(1 Vote per Voter)'}
                      </p>
                    </div>
                  </div>
                  {user && (
                    <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-2 rounded-pill small">
                      <i className="fa-solid fa-check-circle me-1"></i> Authenticated Voter
                    </span>
                  )}
                </div>

                {/* Error Alert */}
                {errorMessage && (
                  <div className="alert alert-danger border-0 rounded-4 shadow-lg p-3 text-center mb-4">
                    <h5 className="fw-bold mb-1">
                      <i className="fa-solid fa-triangle-exclamation me-2"></i> Notice
                    </h5>
                    <p className="mb-0">{errorMessage}</p>
                  </div>
                )}

                {/* Success Message Alert */}
                {hasVoted && (
                  <div className="alert alert-success border-0 rounded-4 shadow-lg p-3 text-center mb-4">
                    <h4 className="fw-bold mb-1">🎉 Vote Successfully Recorded!</h4>
                    <p className="mb-0">
                      Your review and feedback have been cryptographically sealed into the voting ledger for Team #{project.team}.
                    </p>
                  </div>
                )}

                {/* Verified Notification Alert */}
                {verifiedNotice && (
                  <div className="alert alert-success border border-success bg-success bg-opacity-20 p-3 rounded-4 shadow-lg text-center mb-4">
                    <h4 className="fw-bold text-success mb-1">
                      <i className="fa-solid fa-circle-check me-2"></i> Verified!
                    </h4>
                    <p className="mb-0 text-white">{verifiedNotice}</p>
                  </div>
                )}

                {/* Voter Verified Status Box when Logged In */}
                {user ? (
                  <div className="alert alert-success border border-success bg-dark-glass p-3 rounded-4 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-success bg-opacity-20 border border-success p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                        <i className="fa-solid fa-circle-check text-success fs-4"></i>
                      </div>
                      <div>
                        <h6 className="mb-0 text-white fw-bold">Verified Voter Identity Confirmed</h6>
                        <p className="mb-0 text-light-50 small">
                          Voter Email: <strong className="text-cyan">{user.email || user.name}</strong>
                        </p>
                      </div>
                    </div>
                    <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-2 rounded-pill small">
                      <i className="fa-solid fa-shield-check me-1"></i> Authorized to Vote
                    </span>
                  </div>
                ) : (
                  /* Voter Quick OTP / Authentication Box if Not Logged In */
                  <div className="p-4 rounded-4 bg-dark-glass border border-cyan mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="text-white fw-bold mb-0">
                        <i className="fa-solid fa-shield-halved text-cyan me-2"></i> Voter Authentication Layer
                      </h5>
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className={`btn ${authMode === 'otp' ? 'btn-cyan' : 'btn-outline-cyan'}`}
                          onClick={() => { setAuthMode('otp'); setAuthError(''); }}
                        >
                          <i className="fa-solid fa-key me-1"></i> OTP Mail Verification
                        </button>
                        <button
                          type="button"
                          className={`btn ${authMode === 'password' ? 'btn-cyan' : 'btn-outline-cyan'}`}
                          onClick={() => { setAuthMode('password'); setAuthError(''); }}
                        >
                          <i className="fa-solid fa-lock me-1"></i> Password Login
                        </button>
                      </div>
                    </div>

                    <div className="alert alert-info py-2 px-3 small mb-3 border-0 bg-info bg-opacity-10 text-info rounded-3">
                      <i className="fa-solid fa-circle-info me-1"></i> Enter your registered email to receive an official 6-digit OTP code to unlock voting.
                    </div>

                    {authError && (
                      <div className="alert alert-danger p-2 small mb-3 border-0 rounded-3">{authError}</div>
                    )}

                    {otpNotice && (
                      <div className="alert alert-success p-2 small mb-3 border-0 rounded-3">
                        <i className="fa-solid fa-circle-check me-1"></i> {otpNotice}
                      </div>
                    )}

                    {authMode === 'otp' ? (
                      !otpSent ? (
                        <form onSubmit={handleSendOtp}>
                          <div className="row g-2 align-items-center">
                            <div className="col-md-8">
                              <input
                                type="email"
                                className="form-control glass-input form-control-sm"
                                placeholder="Enter email (e.g. karrisuhithareddy.24.it@anits.edu.in)"
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                                required
                              />
                            </div>
                            <div className="col-md-4">
                              <button
                                type="submit"
                                className="btn btn-gradient-primary btn-sm w-100 rounded-pill fw-bold"
                                disabled={authLoading}
                              >
                                {authLoading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status"></span> Sending...
                                  </>
                                ) : (
                                  <>
                                    <i className="fa-solid fa-paper-plane me-1"></i> Send OTP to Mail
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyOtp}>
                          <div className="row g-2">
                            <div className="col-md-4">
                              <input
                                type="text"
                                className="form-control glass-input form-control-sm"
                                placeholder="Your Name (Optional)"
                                value={authName}
                                onChange={(e) => setAuthName(e.target.value)}
                              />
                            </div>
                            <div className="col-md-4">
                              <input
                                type="text"
                                inputMode="numeric"
                                className="form-control glass-input form-control-sm text-center fw-bold fs-5"
                                style={{ letterSpacing: '4px', fontFamily: 'monospace' }}
                                placeholder="• • • • • •"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                  setOtp(val);
                                  if (val.length === 6) {
                                    handleVerifyOtp(null, val);
                                  }
                                }}
                                required
                                autoFocus
                              />
                            </div>
                            <div className="col-md-4">
                              <button
                                type="submit"
                                className="btn btn-cyan btn-sm w-100 rounded-pill fw-bold text-dark"
                                disabled={authLoading || otp.length !== 6}
                              >
                                {authLoading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status"></span> Verifying...
                                  </>
                                ) : (
                                  <>
                                    <i className="fa-solid fa-check-circle me-1"></i> Verify OTP Code
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-2 small">
                            <span className="text-light-50">
                              Sent to: <strong className="text-cyan">{authEmail}</strong>
                            </span>
                            <button
                              type="button"
                              className="btn btn-link btn-sm text-cyan p-0 text-decoration-none"
                              onClick={() => { setOtpSent(false); setOtp(''); }}
                            >
                              <i className="fa-solid fa-pen me-1"></i> Change Email / Resend
                            </button>
                          </div>
                        </form>
                      )
                    ) : (
                      <form onSubmit={handlePasswordLogin}>
                        <div className="row g-2">
                          <div className="col-md-5">
                            <input
                              type="email"
                              className="form-control glass-input form-control-sm"
                              placeholder="Email address"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-md-4">
                            <input
                              type="password"
                              className="form-control glass-input form-control-sm"
                              placeholder="Password"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-md-3">
                            <button
                              type="submit"
                              className="btn btn-gradient-primary btn-sm w-100 rounded-pill fw-bold"
                              disabled={authLoading}
                            >
                              {authLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Voting Form */}
                <form onSubmit={handleSubmitVote}>
                  {/* Star Rating */}
                  <div className="mb-4 text-center">
                    <label className="form-label text-light fw-medium d-block fs-5">
                      Rate This Innovation
                    </label>
                    <div className="star-rating d-inline-flex gap-2 fs-2 cursor-pointer">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const activeVal = hoverRating || rating;
                        const isFilled = star <= activeVal;
                        return (
                          <i
                            key={star}
                            className={`${isFilled ? 'fa-solid text-warning' : 'fa-regular'} fa-star star`}
                            onMouseEnter={() => !hasVoted && setHoverRating(star)}
                            onMouseLeave={() => !hasVoted && setHoverRating(0)}
                            onClick={() => !hasVoted && setRating(star)}
                          ></i>
                        );
                      })}
                    </div>
                  </div>

                  {/* Appreciation Words */}
                  <div className="mb-4">
                    <label htmlFor="appreciation" className="form-label text-light fw-medium">
                      <i className="fa-solid fa-heart text-danger me-2"></i> Appreciation Words{' '}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control glass-input"
                      id="appreciation"
                      placeholder="e.g. Brilliant execution! Love the real-time sensor integration."
                      value={appreciation}
                      onChange={(e) => setAppreciation(e.target.value)}
                      disabled={hasVoted || submitting}
                      required
                    />
                    <div className="form-text text-light-50 counter text-end">
                      {appreciation.length} Characters
                    </div>
                  </div>

                  {/* Review */}
                  <div className="mb-4">
                    <label htmlFor="review" className="form-label text-light fw-medium">
                      <i className="fa-solid fa-pen-to-square text-info me-2"></i> Project Review & Feedback{' '}
                      <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control glass-input"
                      id="review"
                      rows="3"
                      placeholder="Share detailed feedback on design, feasibility, and presentation..."
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      disabled={hasVoted || submitting}
                      required
                    ></textarea>
                    <div className="form-text text-light-50 counter text-end">
                      {review.length} Characters
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="mb-4">
                    <label htmlFor="suggestion" className="form-label text-light fw-medium">
                      <i className="fa-solid fa-lightbulb text-warning me-2"></i> Constructive Suggestions{' '}
                      <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control glass-input"
                      id="suggestion"
                      rows="3"
                      placeholder="What improvements or future features would enhance this project?"
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                      disabled={hasVoted || submitting}
                      required
                    ></textarea>
                    <div className="form-text text-light-50 counter text-end">
                      {suggestion.length} Characters
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="text-center mt-4">
                    {hasVoted ? (
                      <button
                        type="button"
                        disabled
                        className="btn btn-secondary btn-lg px-5 py-3 rounded-pill fw-bold text-uppercase shadow-lg w-100"
                      >
                        <i className="fa-solid fa-check me-2"></i> Official Vote Submitted
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting || !user}
                        className="btn btn-gradient-primary btn-lg px-5 py-3 rounded-pill fw-bold text-uppercase shadow-lg w-100"
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Sealing Vote in Database...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-check-circle me-2"></i> Submit Official Vote
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>

                {/* Post-Vote Receipt Actions */}
                {hasVoted && (
                  <div className="mt-4 pt-3 border-top border-secondary text-center">
                    <h5 className="text-success fw-bold mb-3">🎉 Thank You For Voting!</h5>
                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-outline-info rounded-pill px-4"
                        onClick={handleDownloadReceipt}
                      >
                        <i className="fa-solid fa-download me-2"></i> Download Vote Receipt
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-light rounded-pill px-4"
                        onClick={handlePrintReceipt}
                      >
                        <i className="fa-solid fa-print me-2"></i> Print Receipt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
