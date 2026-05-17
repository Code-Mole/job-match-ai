import nodemailer from "nodemailer";

let transporter = null;

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function getTransporter() {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function verifySmtpConnection() {
  const t = getTransporter();
  if (!t) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in server/.env",
    );
  }
  await t.verify();
  return true;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    throw new Error("SMTP is not configured.");
  }
  return t.sendMail({
    from: `"JobMatch AI" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  });
}

export async function sendApplicationEmail(user, job) {
  if (!isSmtpConfigured()) return null;

  return sendMail({
    to: user.email,
    subject: `Application recorded — ${job.title} at ${job.company}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#2563EB">Application recorded ✓</h2>
        <p>Hi ${user.name?.split(" ")[0] || "there"},</p>
        <p>We've recorded your application for:</p>
        <div style="background:#f8fafc;border-left:4px solid #2563EB;padding:16px;border-radius:4px;margin:16px 0">
          <strong>${job.title}</strong><br/>
          ${job.company} · ${job.location}<br/>
          ${job.salary || ""}
        </div>
        ${job.applyUrl ? `<p><a href="${job.applyUrl}" style="background:#2563EB;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block">Complete your application →</a></p>` : ""}
        <p style="color:#94a3b8;font-size:13px">Track your applications on the JobMatch AI dashboard.</p>
      </div>
    `,
  });
}
