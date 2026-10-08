import React, { useState, useEffect } from 'react';
import { useExpo } from '../context/ExpoContext';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { sendOtp, verifyOtp } = useExpo();

  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'verified'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [expiryCountdown, setExpiryCountdown] = useState(300); // 5 minutes (300s)
  const [devOtpCode, setDevOtpCode] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setDevOtpCode('');
      if (step === 'verified') {
        setStep('email');
      }
    }
  }, [isOpen]);

  // Resend OTP cooldown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // 5-minute OTP expiry countdown timer
  useEffect(() => {
    let expiryTimer;
    if (step === 'otp' && expiryCountdown > 0) {
      expiryTimer = setInterval(() => {
        setExpiryCountdown((prev) => {
          if (prev <= 1) {
            setError('OTP expired. Please request a new OTP code.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(expiryTimer);
  }, [step, expiryCountdown]);

  if (!isOpen) return null;

  const validateEmail = (val) => {
    const clean = val ? val.toLowerCase().trim() : '';
    if (!clean) return 'Please enter your email address.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      return 'Please enter a valid email address format.';
    }
    return null;
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(email.trim().toLowerCase());
      if (res && res.success) {
        setStep('otp');
        setOtp('');
        setSuccessMsg(res.message || 'OTP sent successfully to your email.');
        if (res.devOtp) {
          setDevOtpCode(res.devOtp);
        }
        setCooldown(60);
        setExpiryCountdown(300);
      } else {
        setError(res?.message || 'Unable to send OTP. Please try again later.');
      }
    } catch (err) {
      setError(err.message || 'Unable to send OTP. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const triggerVerification = async (otpToVerify) => {
    const code = (otpToVerify || otp).trim();
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    if (expiryCountdown <= 0) {
      setError('OTP has expired. Please request a new OTP code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await verifyOtp(email.trim().toLowerCase(), code, name.trim());
      if (res && res.success) {
        // Transition to dedicated VERIFIED state
        setVerifiedUser(res.user);
        setStep('verified');
        setSuccessMsg('Verified!');

        // Auto advance after 1.8 seconds if user doesn't click
        setTimeout(() => {
          if (onSuccess) onSuccess(res.user);
          if (onClose) onClose();
        }, 1800);
      } else {
        setError(res?.message || 'Invalid OTP code. Please check and try again.');
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    await triggerVerification(otp);
  };

  // Auto-verify when 6 digits are typed
  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
    setError('');
    if (val.length === 6) {
      triggerVerification(val);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setOtp('');
    await handleSendOtp();
  };

  const handleCompleteVerified = () => {
    if (onSuccess) onSuccess(verifiedUser);
    if (onClose) onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      className="modal-backdrop-custom d-flex align-items-center justify-content-center position-fixed top-0 start-0 w-100 h-100 z-3"
      style={{ backgroundColor: 'rgba(5, 10, 24, 0.88)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="glass-card p-4 p-md-5 rounded-4 shadow-lg border border-cyan position-relative"
        style={{ maxWidth: '480px', width: '92%', boxShadow: '0 20px 60px rgba(0, 229, 255, 0.15)' }}
      >
        {/* Close Button */}
        <button
          type="button"
          className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
          onClick={onClose}
          aria-label="Close"
        ></button>

        {/* STATE 3: VERIFIED CELEBRATION (Requirement: otp type chesthe "Verified" ani ravali) */}
        {step === 'verified' ? (
          <div className="text-center py-3">
            <div className="mb-3 d-inline-flex align-items-center justify-content-center position-relative">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '90px',
                  height: '90px',
                  background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(5, 10, 24, 0.9) 70%)',
                  border: '2px solid #10b981',
                  boxShadow: '0 0 35px rgba(16, 185, 129, 0.5)'
                }}
              >
                <i
                  className="fa-solid fa-circle-check text-success"
                  style={{ fontSize: '3.6rem', filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.8))' }}
                ></i>
              </div>
            </div>

            <h2 className="fw-bold text-white mb-1" style={{ letterSpacing: '1px' }}>
              Verified!
            </h2>
            <div className="mb-3">
              <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-1.5 rounded-pill small fw-semibold">
                <i className="fa-solid fa-shield-halved me-1"></i> Official Verified Voter
              </span>
            </div>

            <p className="text-light mb-1">
              Email <strong className="text-cyan">{email}</strong>
            </p>
            <p className="text-light-50 small mb-4">
              Your identity has been authenticated. You can now cast your official vote!
            </p>

            <button
              type="button"
              className="btn btn-gradient-primary w-100 rounded-pill py-2.5 fw-bold shadow-lg"
              onClick={handleCompleteVerified}
            >
              <i className="fa-solid fa-arrow-right me-2"></i> Continue to Vote
            </button>
          </div>
        ) : (
          <>
            {/* Header Icon & Title */}
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-dark-glass border border-cyan p-3 mb-3"
                style={{ width: '64px', height: '64px' }}
              >
                <i
                  className={`fa-solid ${
                    step === 'email' ? 'fa-envelope-open-text' : 'fa-shield-halved'
                  } fs-2 text-cyan`}
                ></i>
              </div>

              <h4 className="fw-bold text-white mb-1">
                {step === 'email' ? 'Voter Email Verification' : 'Enter 6-Digit OTP'}
              </h4>

              <p className="text-light-50 small mb-0">
                {step === 'email'
                  ? 'Enter your email to receive an official OTP verification code.'
                  : `We sent a 6-digit OTP verification code to ${email}`}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="alert alert-danger py-2 px-3 small border-0 rounded-3 mb-3">
                <i className="fa-solid fa-circle-exclamation me-2"></i>
                {error}
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div className="alert alert-success py-2 px-3 small border-0 rounded-3 mb-3">
                <i className="fa-solid fa-circle-check me-2"></i>
                {successMsg}
              </div>
            )}

            {/* STATE 1: EMAIL INPUT */}
            {step === 'email' ? (
              <form onSubmit={handleSendOtp}>
                <div className="mb-4">
                  <label className="form-label text-light small fw-medium">
                    Your Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control glass-input"
                    placeholder="e.g. karrisuhithareddy.24.it@anits.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <div className="form-text text-light-50 small mt-1">
                    Accepts institutional <strong>@anits.edu.in</strong> or authorized voter email.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-gradient-primary w-100 rounded-pill py-2.5 fw-bold shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane me-2"></i> Send OTP to Mail
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STATE 2: OTP INPUT */
              <form onSubmit={handleVerifyOtp}>
                <div className="mb-3">
                  <label className="form-label text-light small fw-medium">Your Name (Optional)</label>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  {devOtpCode && (
                    <div className="alert alert-info py-2 px-3 small border-0 rounded-3 mb-3 d-flex justify-content-between align-items-center">
                      <span><i className="fa-solid fa-key me-1"></i> Demo Code: <strong>{devOtpCode}</strong></span>
                      <button
                        type="button"
                        className="btn btn-sm btn-info py-0 px-2 rounded-pill fw-bold text-dark"
                        onClick={() => {
                          setOtp(devOtpCode);
                          triggerVerification(devOtpCode);
                        }}
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label text-light small fw-medium mb-0">Enter OTP Code</label>
                    {expiryCountdown > 0 ? (
                      <span className="badge bg-dark-glass text-warning border border-warning small">
                        <i className="fa-solid fa-stopwatch me-1"></i> Expires in {formatTime(expiryCountdown)}
                      </span>
                    ) : (
                      <span className="badge bg-danger small">Expired</span>
                    )}
                  </div>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="form-control glass-input text-center fw-bold fs-3"
                    style={{ letterSpacing: '8px', fontFamily: 'monospace' }}
                    placeholder="• • • • • •"
                    maxLength="6"
                    value={otp}
                    onChange={handleOtpChange}
                    required
                    autoFocus
                  />

                  <div className="d-flex justify-content-between align-items-center mt-2 small text-light-50">
                    <span>
                      Sent to: <strong className="text-cyan">{email}</strong>
                    </span>
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-cyan p-0 text-decoration-none"
                      onClick={() => {
                        setStep('email');
                        setError('');
                        setSuccessMsg('');
                        setOtp('');
                      }}
                    >
                      Change Email
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-cyan text-dark w-100 rounded-pill py-2.5 fw-bold shadow-lg mb-3"
                  disabled={loading || expiryCountdown <= 0 || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check-circle me-2"></i> Verify OTP Code
                    </>
                  )}
                </button>

                {/* Resend Cooldown Button */}
                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm rounded-pill px-3"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || loading}
                  >
                    {cooldown > 0 ? (
                      <>
                        <i className="fa-solid fa-clock me-1"></i> Resend OTP in {cooldown}s
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-rotate-right me-1"></i> Resend OTP
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
