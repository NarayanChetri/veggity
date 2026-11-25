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

function Login() {
  const [loginInfo, setLoginInfo] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // Password Reset with OTP state
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const timerRef = useRef(null);
  const navigate = useNavigate();

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
    setLoginInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = loginInfo;
    if (!email || !password) {
      return handleError('All fields required');
    }
    try {
      setLoggingIn(true);
      const url = `${API_URL}/auth/login`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginInfo)
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return handleError(`Backend returned 404 for: ${url}`);
      }

      const result = await response.json();
      const { success, message, jwtToken, name, error } = result;
      if (success) {
        handleSuccess(message);
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('loggedInUser', name);
        if (email) localStorage.setItem('loggedInEmail', email);
        setTimeout(() => {
          navigate('/home');
        }, 1000);
      } else if (error) {
        const details = error?.details?.[0]?.message || 'Validation error';
        handleError(details);
      } else {
        handleError(message);
      }
    } catch (err) {
      handleError(err.message || 'Something went wrong');
    } finally {
      setLoggingIn(false);
    }
  };

  // Switch to Forgot Password mode
  const openForgotMode = () => {
    setMode('forgot');
    setResetStep(1);
    setResetEmail(loginInfo.email.trim());
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Step 1: Send Reset OTP
  const handleSendResetOtp = async (e) => {
    if (e) e.preventDefault();
    const email = resetEmail.trim();
    if (!email) {
      return handleError('Please enter your registered email address');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return handleError('Please enter a valid email address');
    }

    try {
      setSendingOtp(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      let response;
      try {
        response = await fetch(`${API_URL}/auth/forgot-password/send-otp`, {
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
        handleSuccess(`${result.message || 'Reset code sent!'} Check your inbox & spam folder.`);
        setResetStep(2);
        setResendTimer(60);
      } else {
        handleError(result.message || 'Failed to send reset OTP');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        handleError('Server is waking up. Please wait a moment and try again.');
      } else {
        handleError(err.message || 'Unable to connect to server');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    const email = resetEmail.trim();
    const otp = resetOtp.trim();
    if (!otp || otp.length !== 6) {
      return handleError('Please enter the complete 6-digit OTP');
    }

    try {
      setVerifyingOtp(true);
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const result = await response.json();
      if (result.success) {
        handleSuccess('OTP verified! Now set your new password.');
        setResetStep(3);
      } else {
        handleError(result.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      handleError(err.message || 'Verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      return handleError('Password must be at least 4 characters long');
    }
    if (newPassword !== confirmPassword) {
      return handleError('Passwords do not match');
    }

    try {
      setResetting(true);
      const response = await fetch(`${API_URL}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
          otp: resetOtp.trim(),
          newPassword
        })
      });

      const result = await response.json();
      if (result.success) {
        handleSuccess(result.message || 'Password reset successfully!');
        setLoginInfo({ email: resetEmail.trim(), password: '' });
        setMode('login');
        setResetStep(1);
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        handleError(result.message || 'Failed to reset password');
      }
    } catch (err) {
      handleError(err.message || 'Something went wrong');
    } finally {
      setResetting(false);
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
            <h2>Homegrown freshness, right around your corner.</h2>
            <p>
              Sign in to reserve morning-picked vegetables from neighbors or list surplus harvest from your own garden.
            </p>
            <div className="auth-trust-pills">
              <span className="auth-trust-pill">🌿 100% Local Growers</span>
              <span className="auth-trust-pill">📍 5–20 km Radius</span>
              <span className="auth-trust-pill">♻️ Zero-Waste Harvest</span>
            </div>
          </div>
        </aside>

        {/* Right Form Panel */}
        <main className="auth-form-panel">
          {mode === 'login' ? (
            <>
              <div className="auth-form-header">
                <span className="auth-eyebrow">Welcome Back</span>
                <h1>Log in to Veggity</h1>
                <p>Enter your email and password to access your neighborhood market.</p>
              </div>

              <form className="auth-form" onSubmit={handleLogin}>
                <div className="auth-field">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    onChange={handleChange}
                    placeholder="name@example.com"
                    value={loginInfo.email}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="auth-field">
                  <div className="auth-label-row">
                    <label htmlFor="password">Password</label>
                    <button
                      type="button"
                      className="auth-link-btn"
                      onClick={openForgotMode}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="auth-input-wrap">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      onChange={handleChange}
                      placeholder="Enter your password"
                      value={loginInfo.password}
                      autoComplete="current-password"
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

                <button type="submit" className="auth-submit-btn" disabled={loggingIn}>
                  {loggingIn ? 'Logging in...' : 'Log In'}
                </button>
              </form>

              <p className="auth-footer-switch">
                Don&apos;t have an account?
                <Link to="/signup">Create account</Link>
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                className="reset-back-btn"
                onClick={() => setMode('login')}
              >
                ← Back to Login
              </button>

              <div className="auth-form-header">
                <span className="auth-eyebrow">OTP Verification</span>
                <h1>Reset your password</h1>
                <p>Verify your registered email with a 6-digit OTP to set a new password.</p>
              </div>

              <div className="reset-steps-bar" aria-label="Password reset steps">
                <div className={`reset-step-pill ${resetStep === 1 ? 'active' : 'done'}`}>
                  1. Email
                </div>
                <div className={`reset-step-pill ${resetStep === 2 ? 'active' : resetStep > 2 ? 'done' : ''}`}>
                  2. Verify OTP
                </div>
                <div className={`reset-step-pill ${resetStep === 3 ? 'active' : ''}`}>
                  3. New Password
                </div>
              </div>

              {resetStep === 1 && (
                <form className="auth-form" onSubmit={handleSendResetOtp}>
                  <div className="auth-field">
                    <label htmlFor="reset-email">Registered Email Address</label>
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoFocus
                      required
                    />
                  </div>
                  <button type="submit" className="auth-submit-btn" disabled={sendingOtp}>
                    {sendingOtp ? 'Sending OTP...' : 'Send Reset OTP'}
                  </button>
                </form>
              )}

              {resetStep === 2 && (
                <form className="auth-form" onSubmit={handleVerifyResetOtp}>
                  <div className="auth-field">
                    <label htmlFor="reset-otp">6-Digit Verification Code</label>
                    <div className="input-with-action">
                      <input
                        id="reset-otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit code"
                        autoComplete="one-time-code"
                        autoFocus
                        required
                      />
                      <button
                        type="button"
                        className="otp-action-btn"
                        onClick={() => handleSendResetOtp()}
                        disabled={sendingOtp || resendTimer > 0}
                      >
                        {sendingOtp ? 'Sending...' : resendTimer > 0 ? `${resendTimer}s` : 'Resend'}
                      </button>
                    </div>
                    <div className="otp-help-text">
                      <span>Sent to {resetEmail}</span>
                      <button
                        type="button"
                        className="auth-link-btn"
                        onClick={() => setResetStep(1)}
                      >
                        Change email
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={verifyingOtp || resetOtp.length !== 6}
                  >
                    {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </form>
              )}

              {resetStep === 3 && (
                <form className="auth-form" onSubmit={handleResetPassword}>
                  <div className="auth-field">
                    <label htmlFor="new-password">New Password</label>
                    <div className="auth-input-wrap">
                      <input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 4 characters"
                        autoFocus
                        required
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        <EyeIcon open={showNewPassword} />
                      </button>
                    </div>
                  </div>

                  <div className="auth-field">
                    <label htmlFor="confirm-password">Confirm New Password</label>
                    <input
                      id="confirm-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      required
                    />
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={resetting}>
                    {resetting ? 'Updating Password...' : 'Reset Password'}
                  </button>
                </form>
              )}
            </>
          )}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Login;
