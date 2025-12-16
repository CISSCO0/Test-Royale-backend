const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

async function sendEmail(to, message) {
  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to,
    subject: "Your Verification Code",
    text: message
  });
}

module.exports = sendEmail;