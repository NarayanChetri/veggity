import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import './Signup.css';
import { handleError, handleSuccess, API_URL } from '../utils';

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
    // Simple email regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return handleError('Please enter a valid email address');
    }

    try {
      setSendingOtp(true);
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      if (result.success) {
        handleSuccess(result.message || 'OTP sent to your email!');
        setOtpSent(true);
        setResendTimer(60); // 60s cooldown
      } else {
        handleError(result.message || 'Failed to send OTP');
      }
    } catch (err) {
      handleError(err.message || 'Unable to connect to server');
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
        handleSuccess('Email verified successfully! 🎉');
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
    }
  };

  return (
    <div className='container'>
      <h1>Create an Account</h1>
      <form onSubmit={handleSignup}>
        {/* Name */}
        <div>
          <label htmlFor='name'>Full Name</label>
          <input
            type='text'
            onChange={handleChange}
            name='name'
            id='name'
            autoFocus
            placeholder='e.g. Jane Doe'
            value={signupInfo.name}
            required
          />
        </div>

        {/* Email with Send/Resend OTP */}
        <div>
          <label htmlFor='email'>Email Address</label>
          <div className='input-with-action'>
            <input
              type='email'
              onChange={handleChange}
              name='email'
              id='email'
              placeholder='name@example.com'
              value={signupInfo.email}
              disabled={isVerified}
              required
            />
            {!isVerified && (
              <button
                type='button'
                className='otp-action-btn'
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
            <div className='otp-verified-badge'>
              <span>✓</span> Email verified
            </div>
          ) : otpSent ? (
            <div className='otp-help-text'>
              <span>OTP sent to your email inbox.</span>
              {resendTimer > 0 && <span>Resend available in {resendTimer}s</span>}
            </div>
          ) : null}
        </div>

        {/* 6-Digit OTP Box (Visible once OTP is sent & not yet verified) */}
        {otpSent && !isVerified && (
          <div>
            <label htmlFor='otp'>Enter 6-Digit OTP</label>
            <div className='input-with-action'>
              <input
                type='text'
                inputMode='numeric'
                maxLength={6}
                onChange={handleChange}
                name='otp'
                id='otp'
                placeholder='6-digit code'
                value={signupInfo.otp}
                autoComplete='one-time-code'
              />
              <button
                type='button'
                className='otp-action-btn'
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || signupInfo.otp.length !== 6}
              >
                {verifyingOtp ? 'Checking...' : 'Verify'}
              </button>
            </div>
          </div>
        )}

        {/* Password */}
        <div>
          <label htmlFor='password'>Password</label>
          <input
            type='password'
            onChange={handleChange}
            name='password'
            id='password'
            placeholder='At least 4 characters..'
            value={signupInfo.password}
            required
          />
        </div>

        <button type='submit'>Sign Up</button>

        <span>
          Already have an account? <Link to='/login'>Login</Link>
        </span>
      </form>
      <ToastContainer />
    </div>
  );
}

export default Signup;
