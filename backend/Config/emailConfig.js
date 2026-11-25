/**
 * Email sender using Resend HTTP API (port 443).
 *
 * Why not Nodemailer/SMTP?
 * Render's free tier blocks outbound SMTP ports (25, 465, 587).
 * Resend uses HTTPS (port 443) which is never blocked.
 *
 * Free tier: 3,000 emails/month — plenty for OTP verification.
 * Sign up at https://resend.com to get your RESEND_API_KEY.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

const sendOtpMail = async (email, otp) => {
    const apiKey = process.env.RESEND_API_KEY;

    // Dev fallback: if no API key is set, just log the OTP to the console
    if (!apiKey) {
        console.warn('\n==================================================');
        console.warn('⚠️  [EMAIL] RESEND_API_KEY not set in .env');
        console.warn(`📩  Simulated OTP for ${email}: [ ${otp} ] (Valid for 5 min)`);
        console.warn('==================================================\n');
        return { simulated: true, otp };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Veggity <onboarding@resend.dev>';

    const body = {
        from: fromEmail,
        to: [email],
        subject: `${otp} is your Veggity verification code`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #059669; margin: 0; font-size: 26px;">🌱 Veggity</h1>
                    <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Hyperlocal Fresh Homegrown Produce</p>
                </div>

                <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 8px;">Verify Your Email Address</h2>
                <p style="color: #334155; font-size: 15px; line-height: 1.5;">
                    Thank you for joining Veggity. Use the code below to verify your email.
                </p>

                <div style="margin: 28px 0; text-align: center;">
                    <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #059669; padding: 14px 32px; border-radius: 8px;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #059669; font-family: monospace;">${otp}</span>
                    </div>
                </div>

                <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                    ⏱️ This code expires in <strong>5 minutes</strong>.<br/>
                    🔒 If you didn't request this, you can safely ignore this email.
                </p>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                    &copy; ${new Date().getFullYear()} Veggity. All rights reserved.
                </p>
            </div>
        `
    };

    const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
        console.error('Resend API error:', result);
        throw new Error(result.message || 'Failed to send email via Resend');
    }

    return result;
};

module.exports = { sendOtpMail };
