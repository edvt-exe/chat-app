import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationCode(email: string, code: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'NexusChat — your login code',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 400px; margin: 0 auto; background: #060b14; color: #e8f4ff; border-radius: 16px; padding: 32px; border: 1px solid rgba(0,200,255,0.15);">
        <h1 style="color: #00c8ff; font-size: 24px; margin-bottom: 8px;">NexusChat</h1>
        <p style="color: rgba(255,255,255,0.6); margin-bottom: 24px;">Your verification code</p>
        <div style="background: rgba(0,200,255,0.08); border: 1px solid rgba(0,200,255,0.2); border-radius: 12px; padding: 24px; text-align: center;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #00c8ff;">${code}</span>
        </div>
        <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin-top: 24px;">
          This code expires in 10 minutes. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
}