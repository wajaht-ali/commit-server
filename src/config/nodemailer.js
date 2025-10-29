import nodemailer from 'nodemailer';
import { getForgotPasswordTemplate } from './emailTemplates.js';

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: process.env.SENDER_EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_EMAIL_PASSWORD,
    },
    connectionTimeout: 15000, 
  });
};

export const sendPasswordResetEmail = async (email, resetLink, userName) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: {
        name: 'Code Commit',
        address: process.env.SENDER_EMAIL
      },
      to: email,
      subject: 'Reset Your Code Commit Password',
      html: getForgotPasswordTemplate(resetLink, userName),
    };

    const result = await transporter.sendMail(mailOptions);
    return result;

  } catch (error) {
    throw error;
  }
};