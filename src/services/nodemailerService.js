const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

async function sendEmail(to, message) {
  try {
    // Check if SMTP credentials are configured
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.warn('⚠️ SMTP credentials not configured - skipping email send');
      console.log('📧 Verification code for', to, ':', message.match(/\d{6}/)?.[0]);
      return { success: true, message: 'Email service not configured' };
    }

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to,
      subject: "Your Verification Code",
      text: message
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    // Log the verification code so admin can manually verify users if needed
    console.log('📧 Verification code for', to, ':', message.match(/\d{6}/)?.[0]);
    return { success: false, error: error.message };
  }
}

module.exports = sendEmail;