/**
 * Email sender using a Google Apps Script Web App (HTTPS, port 443).
 *
 * Why not Nodemailer/SMTP or Resend sandbox?
 * - Render's free tier blocks outbound SMTP ports (25, 465, 587).
 * - Resend's onboarding@resend.dev only sends to your own email without a custom domain.
 * - A Google Apps Script Web App sends directly from your Gmail over HTTPS (port 443)
 *   to any recipient email, for free, with no custom domain required.
 */

const sendOtpMail = async (email, otp, purpose = 'signup') => {
    const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
    const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET || '';
    const isReset = purpose === 'reset';

    // Dev fallback: if no webhook URL is set, log the OTP to the console
    if (!webhookUrl) {
        console.warn('\n==================================================');
        console.warn('⚠️  [EMAIL] EMAIL_WEBHOOK_URL not set in .env');
        console.warn(`📩  Simulated ${isReset ? 'Password Reset' : 'Signup'} OTP for ${email}: [ ${otp} ] (Valid for 5 min)`);
        console.warn('==================================================\n');
        return { simulated: true, otp };
    }

    const heading = isReset ? 'Reset Your Password' : 'Verify Your Email Address';
    const bodyCopy = isReset
        ? 'We received a request to reset your Veggity account password. Use the verification code below to set a new password.'
        : 'Thank you for joining Veggity. Use the code below to verify your email.';
    const subject = isReset
        ? `${otp} is your Veggity password reset code`
        : `${otp} is your Veggity verification code`;

    const htmlBody = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #059669; margin: 0; font-size: 26px;">🌱 Veggity</h1>
                <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Hyperlocal Fresh Homegrown Produce</p>
            </div>

            <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 8px;">${heading}</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">
                ${bodyCopy}
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
    `;

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },
        redirect: 'follow',
        body: JSON.stringify({
            secret: webhookSecret,
            to: email,
            subject,
            htmlBody
        })
    });

    const rawText = await response.text();
    let result;
    try {
        result = JSON.parse(rawText);
    } catch {
        console.error('Google Apps Script non-JSON response:', response.status, rawText.slice(0, 300));
        throw new Error(`Email webhook returned invalid response (status ${response.status})`);
    }

    if (!response.ok || !result.success) {
        console.error('Google Apps Script email error:', result);
        throw new Error(result.error || 'Failed to send email via Google Apps Script');
    }

    return result;
};

module.exports = { sendOtpMail };
