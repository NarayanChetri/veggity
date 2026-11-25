const nodemailer = require('nodemailer');

const createTransporter = () => {
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : null;

    if (!user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass
        }
    });
};

const sendOtpMail = async (email, otp) => {
    const transporter = createTransporter();

    // If credentials are not yet configured in .env, log to console for development testing
    if (!transporter) {
        console.warn('\n==================================================');
        console.warn('⚠️ [EMAIL CONFIG] EMAIL_USER or EMAIL_PASS not set in .env');
        console.warn(`📩 Simulated OTP for ${email}: [ ${otp} ] (Valid for 5 min)`);
        console.warn('==================================================\n');
        return { simulated: true, otp };
    }

    const mailOptions = {
        from: `"Veggity Fresh Produce" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `${otp} is your Veggity Email Verification Code`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #059669; margin: 0; font-size: 26px;">🌱 Veggity</h1>
                    <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Hyperlocal Fresh Homegrown Produce</p>
                </div>
                
                <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 8px;">Verify Your Email Address</h2>
                <p style="color: #334155; font-size: 15px; line-height: 1.5;">
                    Thank you for joining Veggity. Please use the verification code below to verify your email address.
                </p>
                
                <div style="margin: 28px 0; text-align: center;">
                    <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #059669; padding: 14px 32px; border-radius: 8px;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #059669; font-family: monospace;">${otp}</span>
                    </div>
                </div>

                <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                    ⏱️ This code will expire in <strong>5 minutes</strong>.<br/>
                    🔒 If you didn't request this code, you can safely ignore this email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                    &copy; ${new Date().getFullYear()} Veggity. All rights reserved.
                </p>
            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = {
    sendOtpMail
};
