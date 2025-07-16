import { createTransport, SendMailOptions } from "nodemailer";
import type { Attachment } from "nodemailer/lib/mailer";
import { logger } from "../config/pino";

const user = process.env.sendEmail;
const pass = process.env.emailPassword;

if (!user || !pass) {
  throw new Error("Email credentials are not set in environment variables.");
}

// ✅ Create transporter ONCE (outside function)
const transporter = createTransport({
  service: "gmail",
  auth: {
    user,
    pass,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  attachments: Attachment[] = []
): Promise<boolean> => {
  const wrappedHtml = `
    <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 30px;">
      <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 32px 24px;">
        <h2 style="color: #2d7ff9; text-align: center; margin-bottom: 24px;">Welcome to Gahezlak!</h2>
        <div style="font-size: 16px; color: #222; margin-bottom: 24px;">
          ${html}
        </div>
        <div style="text-align: center; color: #888; font-size: 13px; margin-top: 32px;">
          If you did not request this, please ignore this email.<br/>
          &copy; ${new Date().getFullYear()} Gahezlak
        </div>
      </div>
    </div>
  `;

  const mailOptions: SendMailOptions = {
    from: `"Gahezlak 👻" <${user}>`,
    to,
    subject,
    html: wrappedHtml,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    return (
      info.accepted && Array.isArray(info.accepted) && info.accepted.length > 0
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.name);
    } else {
      logger.error("Unknown error occurred in sendEmail");
    }
    return false;
  }
};
