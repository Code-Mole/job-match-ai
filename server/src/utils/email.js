import nodemailer from "nodemailer";

let transporter = null;

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function smtpPort() {
  return parseInt(process.env.SMTP_PORT || "587", 10);
}

function buildTransportOptions() {
  const port = smtpPort();
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;

  return {
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    requireTLS: !secure && port === 587,
    tls: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    },
    connectionTimeout: 60000,
    greetingTimeout: 60000,
    socketTimeout: 60000,
  };
}

export function getTransporter() {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport(buildTransportOptions());
  }
  return transporter;
}

export function resetTransporter() {
  transporter = null;
}

export async function verifySmtpConnection() {
  resetTransporter();
  const t = getTransporter();
  if (!t) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in server/.env",
    );
  }
  try {
    await t.verify();
  } catch (err) {
    resetTransporter();
    const hint =
      smtpPort() === 587
        ? " For Gmail use SMTP_PORT=587, SMTP_SECURE=false. For port 465 use SMTP_SECURE=true."
        : "";
    throw new Error(`${err.message || "SMTP connection failed."}${hint}`);
  }
  return true;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    throw new Error("SMTP is not configured.");
  }
  try {
    return await t.sendMail({
      from: `"JobMatch AI" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
  } catch (err) {
    resetTransporter();
    throw err;
  }
}

export async function sendJobMatchesEmail(user, matches = []) {
  if (!isSmtpConfigured() || !matches.length) return null;

  const rows = matches
    .map((m) => {
      const score = m.match_score != null ? `${m.match_score}%` : "—";
      const title = m.title || m.job?.title || "Role";
      const company = m.company || m.job?.company || "";
      return `<li><strong>${title}</strong> at ${company} — ${score} match</li>`;
    })
    .join("");

  return sendMail({
    to: user.email,
    subject: "Your top job matches — JobMatch AI",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#2563EB">Jobs matched to your profile</h2>
        <p>Hi ${user.name?.split(" ")[0] || "there"},</p>
        <p>Here are roles that closely fit your CV and skills:</p>
        <ul>${rows}</ul>
        <p><a href="${process.env.CLIENT_URL || "http://localhost:5173"}/jobs" style="color:#2563EB">View all matches →</a></p>
      </div>
    `,
    text: "Your personalized job matches are ready on JobMatch AI.",
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

export async function sendPasswordResetEmail(to, resetUrl) {
  return sendMail({
    from: `"JobMatch AI" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Reset your JobMatch AI password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Reset your password</h2>
        <p>We received a request to reset your JobMatch AI password. Click the button below to choose a new one. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block; background:#2563EB; color:#fff; padding:12px 24px; border-radius:10px; text-decoration:none; font-weight:600; margin: 16px 0;">
          Reset password
        </a>
        <p style="color:#64748B; font-size:13px;">If you didn't request this, you can safely ignore this email — your password will remain unchanged.</p>
        <p style="color:#94A3B8; font-size:12px;">If the button doesn't work, copy this link: ${resetUrl}</p>
      </div>
    `,
  });
}

