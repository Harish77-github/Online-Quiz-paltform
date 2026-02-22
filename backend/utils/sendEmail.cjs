const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

function buildEmailHtml(name, otp, purpose) {
  const heading = purpose === "reset"
    ? "Password Reset"
    : "Email Verification";
  const instruction = purpose === "reset"
    ? "Use the code below to reset your password:"
    : "Use the verification code below to continue:";

  return `
<div style="font-family:Inter,Arial,sans-serif;background:#020617;padding:30px;color:#e2e8f0;">
  <div style="max-width:500px;margin:auto;background:#0f172a;border-radius:12px;padding:30px;border:1px solid #7c3aed;box-shadow:0 10px 40px rgba(0,0,0,0.5);">
    <h2 style="color:#a78bfa;margin-bottom:10px;">QuizHUB ${heading}</h2>
    <p style="margin-top:0;">Hi <strong>${name}</strong>,</p>
    <p>${instruction}</p>
    <div style="background:#020617;border:1px dashed #7c3aed;border-radius:8px;padding:15px;text-align:center;font-size:28px;letter-spacing:6px;font-weight:bold;color:#a78bfa;margin:20px 0;">
      ${otp}
    </div>
    <p style="font-size:14px;color:#94a3b8;">This code expires in 10 minutes.</p>
    <hr style="border:none;border-top:1px solid #334155;margin:20px 0;">
    <p style="font-size:12px;color:#64748b;">If you did not request this, please ignore this email.</p>
    <p style="font-size:12px;color:#64748b;margin-top:20px;">&copy; QuizHUB</p>
  </div>
</div>`;
}

const sendEmail = async (to, subject, name, otp, purpose) => {
  const html = buildEmailHtml(name, otp, purpose || "verify");
  await transporter.sendMail({
    from: `"QuizHUB" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
