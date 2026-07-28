import nodemailer from 'nodemailer';

export interface OtpDispatchResult {
  success: boolean;
  provider: 'twilio' | 'fast2sms' | 'smtp' | 'dev_sandbox';
  message: string;
}

export async function sendOtpViaSmsOrEmail(
  target: string,
  code: string,
  type: 'phone' | 'email' = 'phone'
): Promise<OtpDispatchResult> {
  const cleanTarget = target.trim();

  // 1. Email OTP Dispatch via Nodemailer (SMTP / Gmail)
  if (type === 'email' || cleanTarget.includes('@')) {
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || (process.env as any).GNAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || (process.env as any).GNAIL_APP_PASSWORD;

    if (!smtpUser || !smtpPass) {
      return {
        success: false,
        provider: 'smtp',
        message: 'GMAIL_USER or GMAIL_APP_PASSWORD environment variables are missing on server.'
      };
    }

    try {
      const isGmail = !process.env.SMTP_HOST || process.env.SMTP_HOST.includes('gmail');
      const transporterConfig: any = isGmail
        ? {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000,
            greetingTimeout: 8000,
            socketTimeout: 10000
          }
        : {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000,
            greetingTimeout: 8000,
            socketTimeout: 10000
          };

      const transporter = nodemailer.createTransport(transporterConfig);

      const sendMailPromise = transporter.sendMail({
        from: `"FoodFlow Security" <${smtpUser}>`,
        to: cleanTarget,
        subject: `🔐 FoodFlow Verification Code: ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
            <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 8px;">FoodFlow Verification</h2>
            <p style="color: #94a3b8; font-size: 14px;">Your 6-digit verification code is:</p>
            <div style="text-align: center; margin: 24px 0;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #fbbf24; background-color: #1e293b; padding: 12px 24px; border-radius: 12px; border: 1px solid #334155; display: inline-block;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 12px; text-align: center;">Expires in 5 minutes. Do not share this code with anyone.</p>
          </div>
        `
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP connection timed out after 10s')), 10000)
      );

      await Promise.race([sendMailPromise, timeoutPromise]);

      console.log(`[FOODFLOW OTP SERVICE] 📧 Real Email OTP delivered to ${cleanTarget}`);
      return {
        success: true,
        provider: 'smtp',
        message: `Real verification OTP email sent to ${cleanTarget}`
      };
    } catch (err: any) {
      console.error('[FOODFLOW OTP SERVICE] Email dispatch error/timeout:', err.message);
      return {
        success: false,
        provider: 'smtp',
        message: `Failed to send email OTP: ${err.message}`
      };
    }
  }

  // 2. Twilio SMS Integration
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuthToken && twilioPhone) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
      const body = new URLSearchParams({
        To: cleanTarget,
        From: twilioPhone,
        Body: `[FoodFlow] Your verification OTP code is: ${code}. Valid for 5 minutes.`
      });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (response.ok) {
        console.log(`[FOODFLOW OTP SERVICE] 📱 Twilio SMS Sent to ${cleanTarget}`);
        return {
          success: true,
          provider: 'twilio',
          message: `SMS OTP delivered via Twilio to ${cleanTarget}`
        };
      }
    } catch (err) {
      console.error('[FOODFLOW OTP SERVICE] Twilio SMS dispatch failed:', err);
    }
  }

  // 3. Fast2SMS Integration (India SMS Gateway)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;

  if (fast2smsKey) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: code,
          numbers: cleanTarget.replace(/\D/g, '')
        })
      });

      if (response.ok) {
        console.log(`[FOODFLOW OTP SERVICE] 📱 Fast2SMS Sent to ${cleanTarget}`);
        return {
          success: true,
          provider: 'fast2sms',
          message: `SMS OTP delivered via Fast2SMS to ${cleanTarget}`
        };
      }
    } catch (err) {
      console.error('[FOODFLOW OTP SERVICE] Fast2SMS dispatch failed:', err);
    }
  }

  // 4. Sandbox Development Fallback Mode
  console.log(`[FOODFLOW OTP SERVICE] 🧪 [SANDBOX MODE] Sent OTP code [${code}] to ${cleanTarget} (${type})`);
  return {
    success: true,
    provider: 'dev_sandbox',
    message: `OTP code generated for ${cleanTarget}`
  };
}
