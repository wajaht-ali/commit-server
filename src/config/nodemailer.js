import nodemailer from 'nodemailer';
import { getForgotPasswordTemplate } from './emailTemplates.js';

const createTransporter = () => {
  console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL);
  console.log('SENDER_EMAIL_HOST:', process.env.SENDER_EMAIL_HOST); // If used
  console.log('SENDER_EMAIL_PASSWORD (partial):', process.env.SENDER_EMAIL_PASSWORD ? process.env.SENDER_EMAIL_PASSWORD.substring(0, 3) + '...' : 'Not set');
  return nodemailer.createTransport({
    service: 'gmail',
    host: process.env.SENDER_EMAIL_HOST,
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
