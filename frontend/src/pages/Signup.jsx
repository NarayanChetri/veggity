import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import './Auth.css';
import { AuthGardenIllustration } from '../components/VeggityIllustrations';
import { handleError, handleSuccess, API_URL } from '../utils';

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function Signup() {
  const [signupInfo, setSignupInfo] = useState({
    name: '',
    email: '',
    password: '',
    otp: ''
  });

  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const timerRef = useRef(null);
  const navigate = useNavigate();

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendTimer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupInfo((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 1. Send OTP to user's email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const email = signupInfo.email.trim();
    if (!email) {
      return handleError('Please enter your email address first');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return handleError('Please enter a valid email address');
    }

    try {
      setSendingOtp(true);

      // 25s timeout — Render free tier cold-starts can take ~30s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      let response;
      try {
        response = await fetch(`${API_URL}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const result = await response.json();
      if (result.success) {
        handleSuccess(`${result.message || 'Email sent!'} Please check your inbox and spam folder.`);
        setOtpSent(true);
        setResendTimer(60);
      } else {
        handleError(result.message || 'Failed to send OTP');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        handleError('Server is waking up (free hosting). Please wait a moment and try again.');
      } else {
        handleError(err.message || 'Unable to connect to server');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // 2. Verify OTP standalone
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const email = signupInfo.email.trim();
    const otp = signupInfo.otp.trim();

    if (!otp || otp.length !== 6) {
      return handleError('Please enter the complete 6-digit code');
    }

    try {
      setVerifyingOtp(true);
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      const result = await response.json();
      if (result.success) {
        handleSuccess('Email verified successfully!');
        setIsVerified(true);
      } else {
        handleError(result.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      handleError(err.message || 'Verification request failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // 3. Complete Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, password, otp } = signupInfo;

    if (!name || !email || !password) {
      return handleError('Please fill in all required fields');
    }

    if (!isVerified && !otp) {
      return handleError('Please request and verify the OTP sent to your email');
    }

    try {
      setSubmitting(true);
      const url = `${API_URL}/auth/signup`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          otp: otp.trim()
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return handleError(`Backend returned error for: ${url}`);
      }

      const result = await response.json();
      const { success, message, error } = result;

      if (success) {
        handleSuccess(message || 'Account created successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 1200);
      } else if (error) {
        const details = error?.details?.[0]?.message || 'Validation error';
        handleError(details);
      } else {
        handleError(message || 'Registration failed');
      }
    } catch (err) {
      handleError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* Left Green Illustrated Panel */}
        <aside className="auth-brand-panel">
          <div className="auth-brand-top">
            <Link to="/home" className="auth-logo-link">
              <span className="auth-logo-mark" aria-hidden="true">🌱</span>
              <span>Veggity</span>
            </Link>
            <Link to="/home" className="auth-back-market">
              ← Browse Market
            </Link>
          </div>

          <div className="auth-illustration-box">
            <AuthGardenIllustration className="auth-illustration-svg" />
          </div>

          <div className="auth-brand-copy">
            <h2>Join your neighborhood&apos;s fresh harvest network.</h2>
            <p>
              Create a verified account to buy morning-picked produce or share extra vegetables from your home garden.
            </p>
            <div className="auth-trust-pills">
              <span className="auth-trust-pill">🌿 Email OTP Verified</span>
              <span className="auth-trust-pill">🍅 Farm-to-Neighbor</span>
              <span className="auth-trust-pill">💚 Community First</span>
            </div>
          </div>
        </aside>

        {/* Right Form Panel */}
        <main className="auth-form-panel">
          <div className="auth-form-header">
            <span className="auth-eyebrow">Get Started</span>
            <h1>Create an Account</h1>
            <p>Verify your email with a quick 6-digit code to join Veggity.</p>
          </div>

          <form className="auth-form" onSubmit={handleSignup}>
            {/* Name */}
            <div className="auth-field">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                onChange={handleChange}
                name="name"
                id="name"
                autoFocus
                placeholder="e.g. Jane Doe"
                value={signupInfo.name}
                required
              />
            </div>

            {/* Email with Send/Resend OTP */}
            <div className="auth-field">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-action">
                <input
                  type="email"
                  onChange={handleChange}
                  name="email"
                  id="email"
                  placeholder="name@example.com"
                  value={signupInfo.email}
                  disabled={isVerified}
                  required
                />
                {!isVerified && (
                  <button
                    type="button"
                    className="otp-action-btn"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || resendTimer > 0}
                  >
                    {sendingOtp
                      ? 'Sending...'
                      : resendTimer > 0
                      ? `${resendTimer}s`
                      : otpSent
                      ? 'Resend'
                      : 'Send OTP'}
                  </button>
                )}
              </div>
              {isVerified ? (
                <div className="otp-verified-badge">
                  <span>✓</span> Email verified
                </div>
              ) : otpSent ? (
                <div className="otp-help-text">
                  <span>Email sent! Check your inbox and spam folder.</span>
                  {resendTimer > 0 && <span>Resend in {resendTimer}s</span>}
                </div>
              ) : null}
            </div>

            {/* 6-Digit OTP Box (Visible once OTP is sent & not yet verified) */}
            {otpSent && !isVerified && (
              <div className="auth-field">
                <label htmlFor="otp">Enter 6-Digit OTP</label>
                <div className="input-with-action">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(e) =>
                      setSignupInfo((prev) => ({
                        ...prev,
                        otp: e.target.value.replace(/\D/g, '')
                      }))
                    }
                    name="otp"
                    id="otp"
                    placeholder="6-digit code"
                    value={signupInfo.otp}
                    autoComplete="one-time-code"
                  />
                  <button
                    type="button"
                    className="otp-action-btn"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || signupInfo.otp.length !== 6}
                  >
                    {verifyingOtp ? 'Checking...' : 'Verify'}
                  </button>
                </div>
              </div>
            )}

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  onChange={handleChange}
                  name="password"
                  id="password"
                  placeholder="At least 4 characters"
                  value={signupInfo.password}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={submitting}>
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer-switch">
            Already have an account?
            <Link to="/login">Log in</Link>
          </p>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Signup;
