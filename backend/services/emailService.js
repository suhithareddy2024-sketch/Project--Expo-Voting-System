const path = require('path');
// Support .env in backend directory or root project directory
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Resend } = require('resend');
const nodemailer = require('nodemailer');

/**
 * Build SMTP transporters for maximum reliability and flexibility.
 * Supports custom SMTP hosts (Brevo, SendGrid, Mailgun, Amazon SES) as well as Gmail SMTP.
 */
const getSmtpTransporters = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return [];
  }

  const cleanUser = user.trim();
  const cleanPass = pass.replace(/\s+/g, '').trim();
  const customHost = (process.env.SMTP_HOST || '').trim();
  const customPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : null;
  const isSecureEnv = process.env.SMTP_SECURE;

  const transporters = [];

  // If a custom SMTP host is configured (e.g. Brevo, SendGrid, Mailgun, custom university SMTP)
  if (customHost) {
    const isSecure = isSecureEnv !== undefined ? (isSecureEnv === 'true') : (customPort === 465);
    const port = customPort || (isSecure ? 465 : 587);
    transporters.push({
      name: `Custom SMTP (${customHost}:${port})`,
      transport: nodemailer.createTransport({
        host: customHost,
        port,
        secure: isSecure,
        auth: { user: cleanUser, pass: cleanPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      })
    });
    return transporters;
  }

  // Gmail SMTP Configurations (Port 465 SSL, Port 587 STARTTLS, and Gmail service)
  transporters.push({
    name: 'smtp.gmail.com:465 (SSL)',
    transport: nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: cleanUser, pass: cleanPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    })
  });

  transporters.push({
    name: 'smtp.gmail.com:587 (TLS)',
    transport: nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: cleanUser, pass: cleanPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    })
  });

  transporters.push({
    name: 'Gmail Service',
    transport: nodemailer.createTransport({
      service: 'gmail',
      auth: { user: cleanUser, pass: cleanPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    })
  });

  return transporters;
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
 * 1. Nodemailer SMTP (Gmail / Custom SMTP multi-port failover)
 * 2. Resend API if configured
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

  let lastErrorMsg = null;

  // Strategy 1: Multi-port Nodemailer SMTP (Can deliver to ANY recipient without restrictions)
  const smtpList = getSmtpTransporters();
  for (const item of smtpList) {
    try {
      const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER;
      const info = await item.transport.sendMail({
        from: `"ANITS Expo Voting" <${fromEmail}>`,
        to: cleanEmail,
        subject: `Your ANITS Expo Voting OTP: ${otp}`,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ [EMAIL SUCCESS] Delivered via ${item.name} to:`, cleanEmail, info.messageId);
      return {
        success: true,
        provider: item.name,
        message: 'OTP sent successfully to your email.'
      };
    } catch (smtpErr) {
      lastErrorMsg = `SMTP error (${item.name}): ${smtpErr.message}`;
      console.warn(`⚠️ [SMTP FAIL ${item.name}]:`, smtpErr.message);
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
        console.log('✅ [EMAIL SUCCESS] Delivered via Resend to:', cleanEmail, result.data?.id);
        return {
          success: true,
          provider: 'resend',
          id: result.data?.id,
          message: 'OTP sent successfully to your email.'
        };
      }

      const resendErrStr = (result.error && (result.error.message || JSON.stringify(result.error))) || '';
      const isSandboxRestriction = resendErrStr.includes('only send testing emails to your own email address') ||
        resendErrStr.includes('validation_error');

      if (isSandboxRestriction) {
        console.warn(`⚠️ [RESEND SANDBOX RESTRICTION] Resend test domain (${fromAddress}) only allows delivery to the Resend account owner. Non-owner recipient (${cleanEmail}) was rejected by Resend. To send OTP to all voters, configure Gmail SMTP (EMAIL_USER & EMAIL_PASS) or verify a domain in Resend (resend.com/domains).`);
        lastErrorMsg = 'Email provider sandbox restriction: onboarding@resend.dev only allows sending to the Resend account owner. To send OTP to all users, please configure Gmail SMTP (EMAIL_USER and EMAIL_PASS) or verify a custom domain in Resend.';
      } else {
        lastErrorMsg = `Resend error: ${resendErrStr}`;
        console.warn('⚠️ [RESEND NOTICE]:', resendErrStr);
      }
    } catch (resendEx) {
      lastErrorMsg = `Resend exception: ${resendEx.message}`;
      console.warn('⚠️ [RESEND EXCEPTION]:', resendEx.message);
    }
  }

  // Strategy 3: Development / Testing Environment Fallback
  // When in development/test mode without an external email provider configured,
  // log OTP to terminal console so local developers and integration tests can authenticate.
  const isDevOrTest = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_OTP === 'true';
  if (isDevOrTest) {
    console.log('\n================================================================');
    console.log('🔑 [DEVELOPMENT CONSOLE OTP]');
    console.log(`   Recipient: ${cleanEmail}`);
    console.log(`   OTP Code:  ${otp}`);
    console.log('   Expiry:    5 minutes');
    console.log('   Notice:    In development/testing mode, OTP is logged to server console.');
    console.log('================================================================\n');
    return {
      success: true,
      provider: 'dev-console',
      devOtp: otp,
      message: 'OTP generated (Development mode: logged to server console).'
    };
  }

  // If email could not be delivered through configured providers in production
  return {
    success: false,
    message: lastErrorMsg || 'Unable to send OTP email. Please ensure your email credentials (EMAIL_USER & EMAIL_PASS, or verified RESEND_API_KEY) are configured.'
  };
};

module.exports = {
  sendOTPEmail,
  sendOtpEmail: sendOTPEmail
};
