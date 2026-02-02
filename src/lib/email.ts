import nodemailer from "nodemailer";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP belum dikonfigurasi.");
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    auth: {
      user,
      pass,
    },
  });
}

export async function sendEmail(payload: EmailPayload) {
  const from = process.env.SMTP_FROM;
  if (!from) {
    throw new Error("SMTP_FROM belum dikonfigurasi.");
  }
  const transporter = getTransport();
  await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
}
