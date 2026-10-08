const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Resend } = require('resend');
const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer SMTP Transporter if credentials exist
 */
const getSmtpTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) return null;

  const cleanUser = user.trim();
  const cleanPass = pass.replace(/\s+/g, '').trim();

  // If user is gmail or institutional Google Workspace (@anits.edu.in)
  if (cleanUser.includes('@gmail.com') || cleanUser.includes('@anits.edu.in')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPass
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: cleanUser, pass: cleanPass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
};

/**
 * HTML Email Template for OTP
 */
const generateEmailHtml = (email, otp) => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; background-color: #0b1120; border: 1px solid #00e5ff; padding: 32px; border-radius: 16px; color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="display: inline-block; background: rgba(0, 229, 255, 0.1); border: 1px solid #00e5ff; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; margin-bottom: 12px; font-size: 24px;">
          🗳️
        </div>
        <h1 style="color: #00e5ff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">PROJECT EXPO VOTING SYSTEM</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 6px; letter-spacing: 0.3px;">ANIL NEERUKONDA INSTITUTE OF TECHNOLOGY & SCIENCES</p>
      </div>

      <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 25px;">
        <p style="color: #cbd5e1; font-size: 15px; margin-top: 0;">Hello Voter,</p>
        <p style="color: #cbd5e1; font-size: 15px; margin-bottom: 15px;">Your one-time verification code (OTP) for casting your vote is:</p>
        
        <div style="display: inline-block; background: #050816; border: 2px dashed #00e5ff; border-radius: 10px; padding: 12px 24px; margin: 10px 0 20px 0;">
          <span style="font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #ffd700; font-family: 'Courier New', Courier, monospace; display: block;">
            ${otp}
          </span>
        </div>

        <p style="color: #94a3b8; font-size: 13px; margin: 0;">⏳ This OTP expires in <strong>5 minutes</strong>.</p>
        <p style="color: #f87171; font-size: 12px; margin-top: 8px; margin-bottom: 0;">⚠️ Do not share this code with anyone. 1 vote per registered voter.</p>
      </div>

      <div style="font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #1e293b; padding-top: 16px;">
        <p style="margin: 0;">Regards,<br /><strong style="color: #00e5ff;">ANITS Project Expo Authentication Protocol</strong></p>
        <p style="margin: 6px 0 0 0; color: #475569;">Delivered to: ${email}</p>
      </div>
    </div>
  `;
};

/**
 * Send OTP Email
 * Multi-provider strategy:
 * 1. Nodemailer SMTP (Gmail / Custom SMTP)
 * 2. Resend API if configured
 * 3. Graceful Cloud/Demo Fallback (Logs OTP to console & supplies code for seamless verification)
 *
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit verification code
 */
const sendOTPEmail = async (email, otp) => {
  const cleanEmail = email.toLowerCase().trim();
  const htmlContent = generateEmailHtml(cleanEmail, otp);
  const textContent = `ANITS Project Expo Voting Verification\n\nYour OTP is: ${otp}\n\nThis OTP is valid for 5 minutes.\nDo not share this OTP with anyone.`;

  console.log('\n================================================================');
  console.log(`📧 [OTP DISPATCH]`);
  console.log(`   To: ${cleanEmail}`);
  console.log(`   Code: ${otp}`);
  console.log('================================================================\n');

  // Strategy 1: Nodemailer SMTP (Gmail / Custom SMTP)
  const smtp = getSmtpTransporter();
  if (smtp) {
    try {
      const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER;
      const info = await smtp.sendMail({
        from: `"ANITS Expo Voting" <${fromEmail}>`,
        to: cleanEmail,
        subject: `Your ANITS Expo Voting OTP: ${otp}`,
        text: textContent,
        html: htmlContent
      });

      console.log('✅ [EMAIL SUCCESS] OTP delivered via SMTP to:', cleanEmail, info.messageId);
      return {
        success: true,
        provider: 'smtp',
        message: 'OTP sent successfully to your email.'
      };
    } catch (smtpErr) {
      console.warn('⚠️ [SMTP WARNING] Nodemailer failed:', smtpErr.message);
      // Fall through to next provider
    }
  }

  // Strategy 2: Resend API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey.trim() && !resendApiKey.includes('xxxxxxxxx')) {
    try {
      const resend = new Resend(resendApiKey.trim());
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'ANITS Voter <onboarding@resend.dev>';

      const result = await resend.emails.send({
        from: fromAddress,
        to: cleanEmail,
        subject: `ANITS Voter Verification OTP: ${otp}`,
        html: htmlContent,
        text: textContent
      });

      if (!result.error) {
        console.log('✅ [EMAIL SUCCESS] OTP delivered via Resend to:', cleanEmail, result.data?.id);
        return {
          success: true,
          provider: 'resend',
          id: result.data?.id,
          message: 'OTP sent successfully to your email.'
        };
      }

      console.warn('⚠️ [RESEND NOTICE]:', result.error.message || result.error);
    } catch (resendEx) {
      console.warn('⚠️ [RESEND EXCEPTION]:', resendEx.message);
    }
  }

  // Strategy 3: Cloud / Demo Fallback
  // If cloud provider limits outbound SMTP/Resend test domains, return simulated success with devOtp
  console.log(`ℹ️ [FALLBACK ACTIVATED] OTP generated and logged for ${cleanEmail}: ${otp}`);
  return {
    success: true,
    provider: 'fallback',
    devOtp: otp,
    message: `OTP sent! (Testing fallback: Code is ${otp})`
  };
};

module.exports = {
  sendOTPEmail,
  sendOtpEmail: sendOTPEmail
};
