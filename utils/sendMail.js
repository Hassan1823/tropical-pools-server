import ejs from "ejs";
import nodemailer from "nodemailer";
import path from "path";
import url from "url";

import { config } from "dotenv";
config();

const sendMail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const { email, subject, template, data } = options;

  // Get path to the email template
  const templatePath = path.join(
    path.dirname(url.fileURLToPath(import.meta.url)),
    "../mails",
    template
  );

  // Render the email template with EJS
  const html = await ejs.renderFile(templatePath, data);

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

export default sendMail;
