const bcrypt = require('bcrypt');
const UserModel = require("../Models/User");
const OtpModel = require("../Models/Otp");
const jwt = require('jsonwebtoken');
const { sendOtpMail } = require('../Config/emailConfig');

/**
 * 1. SEND OTP
 * Generates a 6-digit OTP, stores it with 5-minute expiry, and emails it to the user.
 */
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user is already registered
        const existingUser = await UserModel.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email is already registered. Please log in.'
            });
        }

        // Generate 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Remove any prior active OTPs for this email
        await OtpModel.deleteMany({ email: normalizedEmail });

        // Save new OTP (MongoDB TTL index expires it automatically in 5 minutes)
        await OtpModel.create({
            email: normalizedEmail,
            otp
        });

        // Dispatch Email
        await sendOtpMail(normalizedEmail, otp);

        return res.status(200).json({
            success: true,
            message: `Verification code sent to ${normalizedEmail}`
        });
    } catch (err) {
        console.error('sendOtp error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Please try again later.'
        });
    }
};

/**
 * 2. VERIFY OTP
 * Verifies that the provided OTP matches the record in DB and is not expired.
 */
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Both email and OTP code are required'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const trimmedOtp = otp.toString().trim();

        const record = await OtpModel.findOne({
            email: normalizedEmail,
            otp: trimmedOtp
        });

        if (!record) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP. Please request a new code.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully!'
        });
    } catch (err) {
        console.error('verifyOtp error:', err);
        return res.status(500).json({
            success: false,
            message: 'OTP verification failed'
        });
    }
};

/**
 * 3. SIGNUP
 * Optionally validates OTP if provided, creates the new user account, and hashes password.
 */
const signup = async (req, res) => {
    try {
        const { name, email, password, otp } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await UserModel.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                message: 'User is already registered',
                success: false
            });
        }

        // If OTP is submitted with signup, verify it
        if (otp) {
            const validOtp = await OtpModel.findOne({
                email: normalizedEmail,
                otp: otp.toString().trim()
            });

            if (!validOtp) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired OTP. Please verify your email again.'
                });
            }

            // Clean up used OTP
            await OtpModel.deleteMany({ email: normalizedEmail });
        }

        const userModel = new UserModel({
            name,
            email: normalizedEmail,
            password
        });
        userModel.password = await bcrypt.hash(password, 10);
        await userModel.save();

        res.status(201).json({
            message: "Signup successful",
            success: true
        });
    } catch (err) {
        console.error('signup error:', err);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const user = await UserModel.findOne({ email: normalizedEmail });
        const errorMsg = 'Email or password is wrong';

        if (!user) {
            return res.status(403).json({ message: errorMsg, success: false });
        }

        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) {
            return res.status(403).json({ message: errorMsg, success: false });
        }

        const jwtToken = jwt.sign(
            { email: user.email, _id: user._id },
            process.env.JWT_SECRET || 'veggity-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: "Login successfully",
            success: true,
            jwtToken,
            email: user.email,
            name: user.name
        });
    } catch (err) {
        console.error('login error:', err);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: 'Verified Local Neighbor & Grower'
            }
        });
    } catch (err) {
        console.error('getProfile error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
    }
};

const sendResetOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await UserModel.findOne({ email: normalizedEmail });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email address.'
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await OtpModel.deleteMany({ email: normalizedEmail });
        await OtpModel.create({ email: normalizedEmail, otp });

        await sendOtpMail(normalizedEmail, otp, 'reset');

        return res.status(200).json({
            success: true,
            message: `Password reset code sent to ${normalizedEmail}`
        });
    } catch (err) {
        console.error('sendResetOtp error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to send reset OTP. Please try again later.'
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const trimmedOtp = otp.toString().trim();

        const validOtp = await OtpModel.findOne({
            email: normalizedEmail,
            otp: trimmedOtp
        });

        if (!validOtp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP. Please request a new code.'
            });
        }

        const user = await UserModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email address.'
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        await OtpModel.deleteMany({ email: normalizedEmail });

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully! You can now log in.'
        });
    } catch (err) {
        console.error('resetPassword error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to reset password. Please try again.'
        });
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    sendResetOtp,
    resetPassword,
    signup,
    login,
    getProfile
};
